const jwt = require('jsonwebtoken');
const chatService = require('../services/chatService');
const { rooms, broadcastMessage, broadcastRead, broadcastPresence } = require('./broadcast');
const presence = require('./presence');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/** Minimal cookie-header parser (avoids a dependency for the WS handshake). */
function parseCookies(header = '') {
  const out = {};
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function initSocket(io) {
  // ── Auth handshake: verify the same JWT cookie the REST API uses ──
  io.use((socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie || '');
      const token = cookies.token
        || socket.handshake.auth?.token           // fallback for non-cookie clients
        || null;
      if (!token) return next(new Error('Authentication required'));
      const user = jwt.verify(token, JWT_SECRET);
      if (!user?.id || !user?.role) return next(new Error('Invalid session'));
      // Normalise id to Number (JWT carries it as a string) so presence keys,
      // room targeting and authorization all align with the numeric model ids.
      socket.user = { id: Number(user.id), role: user.role };
      next();
    } catch {
      next(new Error('Invalid or expired session'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user;
    const staff = chatService.isStaff(role);

    socket.join(rooms.user(userId));
    if (staff) socket.join(rooms.admins);

    const became = presence.markOnline(userId, role, socket.id);
    if (became) broadcastPresence(io, userId, role, true, null);

    // Let the newly-connected socket learn who is currently online.
    socket.emit('presence-snapshot', { online: presence.onlineUserIds() });

    // ── Join / leave a conversation room (authorized) ──
    socket.on('join-room', async ({ conversationId } = {}, cb) => {
      try {
        const convo = await chatService.getAuthorizedConversation(conversationId, socket.user);
        socket.join(rooms.conversation(convo.id));
        if (typeof cb === 'function') cb({ ok: true, conversation_id: convo.id });
      } catch (err) {
        if (typeof cb === 'function') cb({ ok: false, error: err.message });
      }
    });

    socket.on('leave-room', ({ conversationId } = {}) => {
      if (conversationId) socket.leave(rooms.conversation(conversationId));
    });

    // ── Send a message ──
    socket.on('send-message', async ({ conversationId, body } = {}, cb) => {
      try {
        if (!body || !String(body).trim()) throw new Error('Message body is required');
        const convo = await chatService.getAuthorizedConversation(conversationId, socket.user);
        const message = await chatService.createMessage({
          conversation: convo,
          senderId: userId,
          senderRole: role,
          body: String(body),
        });
        broadcastMessage(io, convo, message);
        if (typeof cb === 'function') cb({ ok: true, message });
      } catch (err) {
        if (typeof cb === 'function') cb({ ok: false, error: err.message });
      }
    });

    // ── Typing indicators (fire-and-forget, excludes sender) ──
    socket.on('typing', ({ conversationId } = {}) => {
      if (!conversationId) return;
      socket.to(rooms.conversation(conversationId)).emit('typing', {
        conversation_id: conversationId, user_id: userId, role,
      });
    });
    socket.on('stop-typing', ({ conversationId } = {}) => {
      if (!conversationId) return;
      socket.to(rooms.conversation(conversationId)).emit('stop-typing', {
        conversation_id: conversationId, user_id: userId, role,
      });
    });

    // ── Read receipts ──
    socket.on('message-read', async ({ conversationId } = {}, cb) => {
      try {
        const convo = await chatService.getAuthorizedConversation(conversationId, socket.user);
        await chatService.markRead({ conversation: convo, readerRole: role });
        broadcastRead(io, convo.id, role);
        if (typeof cb === 'function') cb({ ok: true });
      } catch (err) {
        if (typeof cb === 'function') cb({ ok: false, error: err.message });
      }
    });

    // ── Cleanup ──
    socket.on('disconnect', () => {
      const { nowOffline, lastSeen } = presence.markOffline(userId, socket.id);
      if (nowOffline) broadcastPresence(io, userId, role, false, lastSeen);
    });
  });
}

module.exports = { initSocket };
