const { Conversation, ChatMessage, Client, Notification, toRow, toRows } = require('../models');
const chatNotifyService = require('./chatNotifyService');
const { broadcastMessage } = require('../socket/broadcast');

const isStaff = (role) => role === 'admin' || role === 'staff';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** One open conversation per client — create lazily. */
async function getOrCreateForClient(clientId) {
  let convo = await Conversation.findOne({ client_id: clientId });
  if (!convo) {
    convo = await Conversation.create({ client_id: clientId, status: 'open' });
  }
  return convo;
}

/**
 * Load a conversation and authorize the user.
 * Clients may only access their own conversation; staff may access any.
 */
async function getAuthorizedConversation(conversationId, user) {
  const convo = await Conversation.findById(conversationId);
  if (!convo) throw httpError(404, 'Conversation not found');
  // req.user.id arrives as a string (Mongoose's default `id` virtual is
  // _id.toString()), while client_id is numeric — compare as numbers.
  if (!isStaff(user.role) && Number(convo.client_id) !== Number(user.id)) {
    throw httpError(403, 'Access denied');
  }
  return convo;
}

/** Enrich a conversation row with the client's display info. */
async function decorateConversations(convos) {
  const clientIds = [...new Set(convos.map(c => c.client_id))];
  const clients = await Client.find({ _id: { $in: clientIds } });
  // Key by numeric _id — the `id` virtual is a string, but client_id is a Number.
  const byId = new Map(clients.map(c => [Number(c._id), c]));
  return convos.map(c => {
    const row = toRow(c);
    const cl = byId.get(Number(c.client_id));
    const fullName = cl ? `${cl.first_name || ''} ${cl.last_name || ''}`.trim() : '';
    row.client_name = fullName || (cl && cl.email) || `Client #${c.client_id}`;
    row.client_email = cl ? cl.email : null;
    row.company_name = cl ? cl.company_name : null;
    return row;
  });
}

/**
 * List conversations for a user.
 * Staff: all conversations (optional status filter + search by client
 * name/email/last message/message content). Client: their own only.
 */
async function listConversations({ user, search = '', status = '' }) {
  if (!isStaff(user.role)) {
    const convo = await getOrCreateForClient(user.id);
    return decorateConversations([convo]);
  }

  const query = {};
  if (status && ['open', 'resolved', 'archived'].includes(status)) query.status = status;

  if (search && search.trim()) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const clients = await Client.find({
      $or: [{ first_name: rx }, { last_name: rx }, { email: rx }, { company_name: rx }]
    }).select('_id');
    const clientIds = clients.map(c => c.id);
    const msgMatches = await ChatMessage.find({ body: rx }).select('conversation_id').limit(500);
    const convoIds = [...new Set(msgMatches.map(m => m.conversation_id))];
    query.$or = [
      { client_id: { $in: clientIds } },
      { last_message: rx },
      { _id: { $in: convoIds } }
    ];
  }

  const convos = await Conversation.find(query).sort({ last_message_at: -1, created_at: -1 }).limit(200);
  return decorateConversations(convos);
}

/**
 * Paginated message history (newest-first cursor via `before` message id).
 * Returns messages in ascending chronological order for rendering.
 */
async function getMessages(conversationId, { before, limit = 30 } = {}) {
  const q = { conversation_id: conversationId };
  if (before) q._id = { $lt: Number(before) };
  const capped = Math.min(Number(limit) || 30, 100);
  const docs = await ChatMessage.find(q).sort({ _id: -1 }).limit(capped);
  const hasMore = docs.length === capped;
  return { messages: toRows(docs.reverse()), hasMore };
}

/** Create a message and update conversation bookkeeping. */
async function createMessage({ conversation, senderId, senderRole, body = '', attachment = null }) {
  const staff = isStaff(senderRole);
  const receiverId = staff ? conversation.client_id : (conversation.admin_id || null);

  const msg = await ChatMessage.create({
    conversation_id: conversation.id,
    sender_id: senderId,
    sender_role: senderRole,
    receiver_id: receiverId,
    body: body || '',
    attachment_url: attachment?.url || null,
    attachment_type: attachment?.type || null,
    attachment_name: attachment?.name || null,
    attachment_size: attachment?.size || null,
    status: 'sent'
  });

  const preview = body?.trim()
    ? body.trim().slice(0, 140)
    : (attachment?.name ? `📎 ${attachment.name}` : 'Attachment');

  conversation.last_message = preview;
  conversation.last_message_at = new Date();
  conversation.last_sender_role = senderRole;
  conversation.updated_at = new Date();
  if (staff) {
    conversation.client_unread += 1;
    if (!conversation.admin_id) conversation.admin_id = senderId;
    if (conversation.status !== 'open') conversation.status = 'open';
  } else {
    conversation.admin_unread += 1;
  }
  await conversation.save();

  // Persistent notification for the client when an admin replies (reuses the
  // existing Notification model, which is client-scoped).
  if (staff) {
    try {
      await Notification.create({
        client_id: conversation.client_id,
        type: 'message',
        title: 'New message from BAAS',
        body: preview
      });
    } catch (err) { console.error('chat notify failed:', err.message); }
  }

  // Email notification (fire-and-forget; offline-only + cooldown enforced inside).
  chatNotifyService.notifyByEmail({ conversation, senderRole })
    .catch(err => console.error('chat email notify failed:', err.message));

  return toRow(msg);
}

/**
 * Post a system-generated message into a conversation and broadcast it live.
 * `audience` decides whose unread count increments ('admin' | 'client').
 * Reuses the existing broadcastMessage so the admin/client get instant updates.
 */
async function postSystemMessage({ io, conversation, body, meta = null, audience = 'admin' }) {
  const msg = await ChatMessage.create({
    conversation_id: conversation.id,
    sender_id: 0,
    sender_role: 'system',
    receiver_id: null,
    body: body || '',
    meta: meta || null,
    status: 'sent',
  });

  const preview = (body || '').trim().slice(0, 140) || 'System message';
  conversation.last_message = preview;
  conversation.last_message_at = new Date();
  conversation.last_sender_role = 'system';
  if (audience === 'client') conversation.client_unread += 1;
  else conversation.admin_unread += 1;
  if (conversation.status !== 'open') conversation.status = 'open';
  conversation.updated_at = new Date();
  await conversation.save();

  const row = toRow(msg);
  if (io) broadcastMessage(io, conversation, row);
  return row;
}

/**
 * After a successful checkout/payment, drop a system message into the client's
 * conversation (creating it if needed): an order summary for the admin and a
 * confirmation for the client. Idempotent per order to avoid duplicates on retry.
 */
async function postOrderCheckoutMessages({ io, order, serviceName = null, paymentId = null }) {
  const orderId = Number(order.id);
  const convo = await getOrCreateForClient(Number(order.client_id));

  // Idempotency guard — never post twice for the same order.
  const dupe = await ChatMessage.findOne({ conversation_id: convo.id, sender_role: 'system', 'meta.order_id': orderId });
  if (dupe) return;

  const client = await Client.findById(order.client_id).select('first_name last_name');
  const clientName = client
    ? (`${client.first_name || ''} ${client.last_name || ''}`.trim() || `Client #${order.client_id}`)
    : `Client #${order.client_id}`;
  const amount = Number(order.total_amount || 0).toFixed(2);
  const when = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const serviceId = order.service_id ? Number(order.service_id._id ?? order.service_id) : null;

  const meta = {
    order_id: orderId,
    order_number: order.order_number,
    client_id: Number(order.client_id),
    service_id: serviceId,
    payment_id: paymentId != null ? Number(paymentId) : null,
    transaction_id: order.transaction_id || null,
    amount: Number(order.total_amount || 0),
    timestamp: new Date(),
  };

  const adminBody =
    `🛒 New Order Received\n\n` +
    `Client: ${clientName}\n` +
    `Service: ${serviceName || '—'}\n` +
    `Order Number: ${order.order_number}\n` +
    `Amount: $${amount}\n` +
    `Payment Status: Paid\n` +
    `Payment Method: QuickBooks Payments\n` +
    `Order Time: ${when}\n\n` +
    `The client has successfully completed checkout. Please review the order and contact the client for the next steps.`;

  await postSystemMessage({ io, conversation: convo, body: adminBody, meta, audience: 'admin' });

  const clientBody =
    `✅ Your payment has been received successfully.\n\n` +
    `Your order ${order.order_number} has been submitted to our team. ` +
    `An administrator will review it and contact you shortly through this chat.`;

  await postSystemMessage({
    io, conversation: convo, body: clientBody,
    meta: { order_id: orderId, order_number: order.order_number },
    audience: 'client',
  });
}

/** Mark the other party's messages as seen and clear the reader's unread count. */
async function markRead({ conversation, readerRole }) {
  const staff = isStaff(readerRole);
  const otherRoles = staff ? ['client'] : ['admin', 'staff'];
  await ChatMessage.updateMany(
    { conversation_id: conversation.id, sender_role: { $in: otherRoles }, is_read: false },
    { is_read: true, status: 'seen', updated_at: new Date() }
  );
  if (staff) conversation.admin_unread = 0;
  else conversation.client_unread = 0;
  conversation.updated_at = new Date();
  await conversation.save();
  return toRow(conversation);
}

/** Admin: set conversation status (open|resolved|archived). */
async function setStatus({ conversation, status }) {
  if (!['open', 'resolved', 'archived'].includes(status)) {
    throw httpError(400, 'Invalid status');
  }
  conversation.status = status;
  conversation.updated_at = new Date();
  await conversation.save();
  return toRow(conversation);
}

module.exports = {
  isStaff,
  getOrCreateForClient,
  getAuthorizedConversation,
  decorateConversations,
  listConversations,
  getMessages,
  createMessage,
  postSystemMessage,
  postOrderCheckoutMessages,
  markRead,
  setStatus,
};
