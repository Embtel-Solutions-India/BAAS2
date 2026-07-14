const chatService = require('../services/chatService');
const presence = require('../socket/presence');
const { broadcastMessage, broadcastRead, broadcastConversationUpdated } = require('../socket/broadcast');
const { uploadToS3 } = require('../config/s3');
const { IMAGE_TYPES, EXT_BY_MIME } = require('../middleware/chatUpload');

const send = (res, status, payload) => res.status(status).json(payload);
const fail = (res, err, fallback = 'Request failed') =>
  send(res, err.status || 500, { error: err.message || fallback });

/** GET /api/chat/conversations — staff: all (search/status); client: own. */
exports.listConversations = async (req, res) => {
  try {
    const rows = await chatService.listConversations({
      user: req.user,
      search: req.query.search || '',
      status: req.query.status || '',
    });
    // Attach live presence so the list can show online dots immediately.
    const withPresence = rows.map(c => ({
      ...c,
      client_online: presence.isOnline(c.client_id),
      client_last_seen: presence.getLastSeen(c.client_id),
    }));
    send(res, 200, { conversations: withPresence });
  } catch (err) { fail(res, err, 'Failed to load conversations'); }
};

/** GET /api/chat/conversation — client's own conversation (get-or-create). */
exports.getMyConversation = async (req, res) => {
  try {
    const convo = await chatService.getOrCreateForClient(req.user.id);
    const [row] = await chatService.decorateConversations([convo]);
    send(res, 200, { conversation: row });
  } catch (err) { fail(res, err, 'Failed to load conversation'); }
};

/** GET /api/chat/conversations/:id/messages?before=&limit= */
exports.getMessages = async (req, res) => {
  try {
    const convo = await chatService.getAuthorizedConversation(req.params.id, req.user);
    const data = await chatService.getMessages(convo.id, {
      before: req.query.before,
      limit: req.query.limit,
    });
    send(res, 200, data);
  } catch (err) { fail(res, err, 'Failed to load messages'); }
};

/** POST /api/chat/conversations/:id/messages  (text; REST fallback for sockets) */
exports.sendMessage = async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !String(body).trim()) return send(res, 400, { error: 'Message body is required' });
    const convo = await chatService.getAuthorizedConversation(req.params.id, req.user);
    const message = await chatService.createMessage({
      conversation: convo, senderId: req.user.id, senderRole: req.user.role, body: String(body),
    });
    broadcastMessage(req.app.get('io'), convo, message);
    send(res, 201, { message });
  } catch (err) { fail(res, err, 'Failed to send message'); }
};

/** POST /api/chat/conversations/:id/attachments  (multipart: file + optional body) */
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return send(res, 400, { error: 'No file uploaded' });
    const convo = await chatService.getAuthorizedConversation(req.params.id, req.user);

    const mime = req.file.mimetype;
    const folder = IMAGE_TYPES.has(mime) ? 'chat/images' : 'chat/documents';
    const ext = EXT_BY_MIME[mime] || '';
    const url = await uploadToS3(req.file.buffer, folder, mime, ext);

    const message = await chatService.createMessage({
      conversation: convo,
      senderId: req.user.id,
      senderRole: req.user.role,
      body: req.body.body || '',
      attachment: { url, type: mime, name: req.file.originalname, size: req.file.size },
    });
    broadcastMessage(req.app.get('io'), convo, message);
    send(res, 201, { message });
  } catch (err) { fail(res, err, 'Failed to upload attachment'); }
};

/** PATCH /api/chat/conversations/:id/read */
exports.markRead = async (req, res) => {
  try {
    const convo = await chatService.getAuthorizedConversation(req.params.id, req.user);
    const row = await chatService.markRead({ conversation: convo, readerRole: req.user.role });
    broadcastRead(req.app.get('io'), convo.id, req.user.role);
    send(res, 200, { conversation: row });
  } catch (err) { fail(res, err, 'Failed to mark as read'); }
};

/** PATCH /api/chat/conversations/:id/status  (admin/staff: open|resolved|archived) */
exports.setStatus = async (req, res) => {
  try {
    const convo = await chatService.getAuthorizedConversation(req.params.id, req.user);
    const row = await chatService.setStatus({ conversation: convo, status: req.body.status });
    broadcastConversationUpdated(req.app.get('io'), row);
    send(res, 200, { conversation: row });
  } catch (err) { fail(res, err, 'Failed to update status'); }
};

/** GET /api/chat/conversations/:id/presence — the other party's online state. */
exports.getPresence = async (req, res) => {
  try {
    const convo = await chatService.getAuthorizedConversation(req.params.id, req.user);
    const targetId = chatService.isStaff(req.user.role) ? convo.client_id : (convo.admin_id || null);
    send(res, 200, {
      online: targetId ? presence.isOnline(targetId) : false,
      last_seen: targetId ? presence.getLastSeen(targetId) : null,
    });
  } catch (err) { fail(res, err, 'Failed to load presence'); }
};
