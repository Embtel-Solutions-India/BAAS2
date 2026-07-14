/**
 * Shared Socket.IO emit helpers + room-name conventions.
 * Used by both the socket connection handlers and the REST controller so
 * real-time events fire whether a message arrives over WS or HTTP.
 */
const presence = require('./presence');

const rooms = {
  conversation: (id) => `conversation:${id}`,
  user: (id) => `user:${id}`,
  admins: 'admins',
};

/** Emit a newly created message to everyone in the conversation room. */
function broadcastMessage(io, conversation, message) {
  if (!io) return;
  // conversation.id is Mongoose's `.id` virtual (a STRING); the frontend
  // compares against numeric ids from toRow(), so emit a Number consistently.
  const cid = Number(conversation.id);
  io.to(rooms.conversation(cid)).emit('receive-message', {
    conversation_id: cid,
    message,
  });
  // Update conversation lists (admins + the owning client) without needing the room.
  const summary = {
    conversation_id: cid,
    last_message: conversation.last_message,
    last_message_at: conversation.last_message_at,
    last_sender_role: conversation.last_sender_role,
    client_unread: conversation.client_unread,
    admin_unread: conversation.admin_unread,
    status: conversation.status,
  };
  io.to(rooms.admins).emit('conversation-updated', summary);
  io.to(rooms.user(conversation.client_id)).emit('conversation-updated', summary);

  // Targeted live notification to the recipient side.
  if (message.sender_role === 'client') {
    io.to(rooms.admins).emit('new-notification', {
      kind: 'new-message',
      conversation_id: cid,
      preview: conversation.last_message,
    });
  } else {
    io.to(rooms.user(conversation.client_id)).emit('new-notification', {
      kind: 'new-reply',
      conversation_id: cid,
      preview: conversation.last_message,
    });
  }
}

/** Notify a conversation room that messages were read/seen. */
function broadcastRead(io, conversationId, readerRole) {
  if (!io) return;
  const cid = Number(conversationId);
  io.to(rooms.conversation(cid)).emit('message-read', {
    conversation_id: cid,
    reader_role: readerRole,
    at: new Date(),
  });
}

/** Broadcast a user's online/offline transition. */
function broadcastPresence(io, userId, role, isOnlineNow, lastSeen) {
  if (!io) return;
  const payload = { user_id: userId, role, online: isOnlineNow, last_seen: lastSeen || null };
  io.to(rooms.admins).emit(isOnlineNow ? 'user-online' : 'user-offline', payload);
  io.to(rooms.user(userId)).emit(isOnlineNow ? 'user-online' : 'user-offline', payload);
}

/** Emit an updated conversation summary (e.g., after status change). */
function broadcastConversationUpdated(io, conversationRow) {
  if (!io) return;
  io.to(rooms.admins).emit('conversation-updated', conversationRow);
  io.to(rooms.user(conversationRow.client_id)).emit('conversation-updated', conversationRow);
}

module.exports = { rooms, broadcastMessage, broadcastRead, broadcastPresence, broadcastConversationUpdated, presence };
