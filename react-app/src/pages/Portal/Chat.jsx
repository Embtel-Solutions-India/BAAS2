import { useEffect, useRef, useState, useCallback } from 'react';
import PortalLayout from '../../components/Portal/PortalLayout';
import { api } from '../../utils/api';
import { getSocket } from '../../utils/chatSocket';
import { fmtTime, fmtDay } from '../../utils/chatFormat';
import Attachment from '../../components/Chat/Attachment';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherLastSeen, setOtherLastSeen] = useState(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');

  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const convoRef = useRef(null);
  const typingSendRef = useRef(null);
  const otherTypingRef = useRef(null);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const addMessage = useCallback((msg) => {
    setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
  }, []);

  // ── init: load conversation + history, connect socket, listeners ──
  useEffect(() => {
    let active = true;
    const socket = getSocket();

    async function init() {
      try {
        const { conversation: convo } = await api.get('/chat/conversation');
        if (!active) return;
        convoRef.current = convo;

        const [{ messages: msgs, hasMore }, presence] = await Promise.all([
          api.get(`/chat/conversations/${convo.id}/messages?limit=30`),
          api.get(`/chat/conversations/${convo.id}/presence`).catch(() => ({ online: false, last_seen: null })),
        ]);
        if (!active) return;
        setMessages(msgs);
        setHasMore(hasMore);
        setOtherOnline(!!presence.online);
        setOtherLastSeen(presence.last_seen);
        setLoading(false);
        requestAnimationFrame(() => scrollToBottom(false));

        socket.emit('join-room', { conversationId: convo.id });
        api.patch(`/chat/conversations/${convo.id}/read`).catch(() => {});
      } catch (err) {
        if (active) { setErrorMsg(err.message || 'Failed to load chat'); setLoading(false); }
      }
    }
    init();

    const onReceive = ({ conversation_id, message }) => {
      if (!convoRef.current || conversation_id !== convoRef.current.id) return;
      addMessage(message);
      const el = scrollRef.current;
      const nearBottom = el && (el.scrollHeight - el.scrollTop - el.clientHeight < 140);
      if (nearBottom || message.sender_role === 'client') requestAnimationFrame(() => scrollToBottom(true));
      if (message.sender_role !== 'client') {
        socket.emit('message-read', { conversationId: convoRef.current.id });
      }
    };
    const onTyping = ({ conversation_id, role }) => {
      if (!convoRef.current || conversation_id !== convoRef.current.id) return;
      if (role === 'admin' || role === 'staff') {
        setOtherTyping(true);
        clearTimeout(otherTypingRef.current);
        otherTypingRef.current = setTimeout(() => setOtherTyping(false), 3500);
      }
    };
    const onStopTyping = ({ conversation_id, role }) => {
      if (!convoRef.current || conversation_id !== convoRef.current.id) return;
      if (role === 'admin' || role === 'staff') setOtherTyping(false);
    };
    const onRead = ({ conversation_id, reader_role }) => {
      if (!convoRef.current || conversation_id !== convoRef.current.id) return;
      if (reader_role === 'admin' || reader_role === 'staff') {
        setMessages(prev => prev.map(m => m.sender_role === 'client' ? { ...m, status: 'seen', is_read: true } : m));
      }
    };
    const onOnline = ({ role }) => { if (role === 'admin' || role === 'staff') setOtherOnline(true); };
    const onOffline = ({ role, last_seen }) => { if (role === 'admin' || role === 'staff') { setOtherOnline(false); if (last_seen) setOtherLastSeen(last_seen); } };

    socket.on('receive-message', onReceive);
    socket.on('typing', onTyping);
    socket.on('stop-typing', onStopTyping);
    socket.on('message-read', onRead);
    socket.on('user-online', onOnline);
    socket.on('user-offline', onOffline);

    return () => {
      active = false;
      if (convoRef.current) socket.emit('leave-room', { conversationId: convoRef.current.id });
      socket.off('receive-message', onReceive);
      socket.off('typing', onTyping);
      socket.off('stop-typing', onStopTyping);
      socket.off('message-read', onRead);
      socket.off('user-online', onOnline);
      socket.off('user-offline', onOffline);
      clearTimeout(typingSendRef.current);
      clearTimeout(otherTypingRef.current);
    };
  }, [addMessage, scrollToBottom]);

  // ── infinite scroll (load older at top) ──
  const handleScroll = async () => {
    const el = scrollRef.current;
    if (!el || loadingOlder || !hasMore || !convoRef.current) return;
    if (el.scrollTop < 60) {
      setLoadingOlder(true);
      const oldest = messages[0]?.id;
      const prevHeight = el.scrollHeight;
      try {
        const { messages: older, hasMore: more } = await api.get(`/chat/conversations/${convoRef.current.id}/messages?limit=30&before=${oldest}`);
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id));
          return [...older.filter(m => !ids.has(m.id)), ...prev];
        });
        setHasMore(more);
        requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - prevHeight; });
      } catch { /* ignore */ }
      setLoadingOlder(false);
    }
  };

  const emitTyping = () => {
    const socket = getSocket();
    if (!convoRef.current) return;
    socket.emit('typing', { conversationId: convoRef.current.id });
    clearTimeout(typingSendRef.current);
    typingSendRef.current = setTimeout(() => socket.emit('stop-typing', { conversationId: convoRef.current.id }), 1800);
  };

  const sendText = () => {
    const body = text.trim();
    if (!body || !convoRef.current) return;
    setSending(true);
    const socket = getSocket();
    socket.emit('send-message', { conversationId: convoRef.current.id, body }, (ack) => {
      setSending(false);
      if (!ack?.ok) setErrorMsg(ack?.error || 'Failed to send');
    });
    socket.emit('stop-typing', { conversationId: convoRef.current.id });
    setText('');
  };

  const uploadFile = async (file) => {
    if (!file || !convoRef.current) return;
    setUploadMsg(`Uploading ${file.name}…`);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.upload(`/chat/conversations/${convoRef.current.id}/attachments`, fd);
      setUploadMsg('');
    } catch (err) {
      setUploadMsg('');
      setErrorMsg(err.message || 'Upload failed');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadFile(file);
  };

  const presenceLabel = otherOnline ? 'Online' : (otherLastSeen ? `Last seen ${fmtDay(otherLastSeen)} ${fmtTime(otherLastSeen)}` : 'Offline');

  return (
    <PortalLayout title="Live Support" subtitle="Chat with the BAAS team in real time">
      {errorMsg && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{errorMsg}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 420 }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-grad)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: "'DM Serif Display',serif" }}>B</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>BAAS Support</div>
            <div style={{ fontSize: 12, color: otherOnline ? 'var(--success)' : 'var(--td)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: otherOnline ? 'var(--success)' : 'var(--tf)' }} />
              {presenceLabel}
            </div>
          </div>
        </div>

        {/* messages */}
        <div ref={scrollRef} onScroll={handleScroll}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{ flex: 1, overflowY: 'auto', padding: '18px', background: dragOver ? 'rgba(212,0,31,.04)' : 'transparent', position: 'relative' }}>
          {dragOver && (
            <div style={{ position: 'absolute', inset: 12, border: '2px dashed var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 600, pointerEvents: 'none', background: 'rgba(255,255,255,.6)' }}>Drop file to send</div>
          )}
          {loading ? (
            <div className="empty-state"><div className="spinner" /></div>
          ) : !messages.length ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <h4>Start the conversation</h4>
              <p style={{ fontSize: 14, color: 'var(--td)' }}>Send a message and our team will reply here in real time.</p>
            </div>
          ) : (
            <>
              {loadingOlder && <div style={{ textAlign: 'center', padding: 8 }}><div className="spinner" style={{ width: 16, height: 16 }} /></div>}
              {messages.map(m => {
                const mine = m.sender_role === 'client';
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                    <div style={{
                      maxWidth: '78%', padding: '10px 14px', borderRadius: 14,
                      background: mine ? 'var(--accent-grad)' : '#f5f5f7',
                      color: mine ? '#fff' : 'var(--text)',
                      borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4,
                    }}>
                      {m.body && <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>}
                      <Attachment m={m} />
                      <div style={{ fontSize: 10, marginTop: 4, textAlign: 'right', opacity: .75, color: mine ? 'rgba(255,255,255,.85)' : 'var(--tf)', display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {fmtTime(m.created_at)}
                        {mine && <span title={m.status}>{m.status === 'seen' || m.is_read ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {otherTyping && (
                <div style={{ fontSize: 12, color: 'var(--td)', fontStyle: 'italic', padding: '2px 4px' }}>BAAS is typing…</div>
              )}
            </>
          )}
        </div>

        {/* composer */}
        <div style={{ borderTop: '1px solid var(--border)', padding: 12 }}>
          {uploadMsg && <div style={{ fontSize: 12, color: 'var(--td)', marginBottom: 6 }}>{uploadMsg}</div>}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button type="button" className="btn-g" onClick={() => fileRef.current?.click()} title="Attach file" style={{ padding: '10px 12px' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
            </button>
            <input ref={fileRef} type="file" style={{ display: 'none' }}
              accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.zip"
              onChange={(e) => uploadFile(e.target.files?.[0])} />
            <textarea
              className="form-control" rows={1} value={text}
              placeholder="Type a message…"
              onChange={(e) => { setText(e.target.value); emitTyping(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); } }}
              style={{ resize: 'none', flex: 1, maxHeight: 120 }}
            />
            <button type="button" className="btn-p" onClick={sendText} disabled={sending || !text.trim()} style={{ padding: '10px 18px' }}>
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
