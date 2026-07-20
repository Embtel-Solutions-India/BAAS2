import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api } from '../../utils/api';
import { getSocket } from '../../utils/chatSocket';
import { fmtTime, fmtDay } from '../../utils/chatFormat';
import Attachment from '../../components/Chat/Attachment';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'archived', label: 'Archived' },
];

export default function AdminChat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [presenceMap, setPresenceMap] = useState({});   // clientId -> { online, last_seen }
  const [otherTyping, setOtherTyping] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const activeRef = useRef(null);
  const typingSendRef = useRef(null);
  const otherTypingRef = useRef(null);

  const active = conversations.find(c => c.id === activeId) || null;

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const loadConversations = useCallback(async (s = '', st = '') => {
    try {
      const q = new URLSearchParams();
      if (s) q.set('search', s);
      if (st) q.set('status', st);
      const { conversations: rows } = await api.get(`/chat/conversations?${q.toString()}`);
      setConversations(rows);
      setPresenceMap(prev => {
        const next = { ...prev };
        rows.forEach(c => {
          if (next[c.client_id] === undefined) next[c.client_id] = { online: !!c.client_online, last_seen: c.client_last_seen };
        });
        return next;
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load conversations');
    }
  }, []);

  // debounced search / filter
  useEffect(() => {
    const t = setTimeout(() => loadConversations(search, statusFilter), 300);
    return () => clearTimeout(t);
  }, [search, statusFilter, loadConversations]);

  // socket listeners (admin joins the 'admins' room automatically on connect)
  useEffect(() => {
    const socket = getSocket();

    const onConvoUpdated = (summary) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === summary.conversation_id || c.id === summary.id);
        if (idx === -1) { loadConversations(search, statusFilter); return prev; }
        const merged = { ...prev[idx], ...summary, id: prev[idx].id };
        const rest = prev.filter((_, i) => i !== idx);
        return [merged, ...rest];   // bubble to top
      });
    };
    const onReceive = ({ conversation_id, message }) => {
      if (conversation_id === activeRef.current) {
        setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
        const el = scrollRef.current;
        const nearBottom = el && (el.scrollHeight - el.scrollTop - el.clientHeight < 140);
        if (nearBottom || message.sender_role !== 'client') requestAnimationFrame(() => scrollToBottom(true));
        if (message.sender_role === 'client') socket.emit('message-read', { conversationId: activeRef.current });
      }
    };
    const onTyping = ({ conversation_id, role }) => {
      if (conversation_id === activeRef.current && role === 'client') {
        setOtherTyping(true);
        clearTimeout(otherTypingRef.current);
        otherTypingRef.current = setTimeout(() => setOtherTyping(false), 3500);
      }
    };
    const onStopTyping = ({ conversation_id, role }) => {
      if (conversation_id === activeRef.current && role === 'client') setOtherTyping(false);
    };
    const onRead = ({ conversation_id, reader_role }) => {
      if (conversation_id === activeRef.current && reader_role === 'client') {
        setMessages(prev => prev.map(m => (m.sender_role === 'admin' || m.sender_role === 'staff') ? { ...m, status: 'seen', is_read: true } : m));
      }
    };
    const onOnline = ({ user_id, role, last_seen }) => { if (role === 'client') setPresenceMap(p => ({ ...p, [user_id]: { online: true, last_seen } })); };
    const onOffline = ({ user_id, role, last_seen }) => { if (role === 'client') setPresenceMap(p => ({ ...p, [user_id]: { online: false, last_seen } })); };

    socket.on('conversation-updated', onConvoUpdated);
    socket.on('receive-message', onReceive);
    socket.on('typing', onTyping);
    socket.on('stop-typing', onStopTyping);
    socket.on('message-read', onRead);
    socket.on('user-online', onOnline);
    socket.on('user-offline', onOffline);
    return () => {
      socket.off('conversation-updated', onConvoUpdated);
      socket.off('receive-message', onReceive);
      socket.off('typing', onTyping);
      socket.off('stop-typing', onStopTyping);
      socket.off('message-read', onRead);
      socket.off('user-online', onOnline);
      socket.off('user-offline', onOffline);
      clearTimeout(typingSendRef.current);
      clearTimeout(otherTypingRef.current);
    };
  }, [search, statusFilter, loadConversations, scrollToBottom]);

  const openConversation = async (convo) => {
    const socket = getSocket();
    if (activeRef.current && activeRef.current !== convo.id) socket.emit('leave-room', { conversationId: activeRef.current });
    setActiveId(convo.id);
    activeRef.current = convo.id;
    setOtherTyping(false);
    setLoadingMsgs(true);
    setMessages([]);
    socket.emit('join-room', { conversationId: convo.id });
    try {
      const { messages: msgs, hasMore } = await api.get(`/chat/conversations/${convo.id}/messages?limit=30`);
      setMessages(msgs);
      setHasMore(hasMore);
      requestAnimationFrame(() => scrollToBottom(false));
      await api.patch(`/chat/conversations/${convo.id}/read`).catch(() => {});
      setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, admin_unread: 0 } : c));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load messages');
    }
    setLoadingMsgs(false);
  };

  const handleScroll = async () => {
    const el = scrollRef.current;
    if (!el || loadingOlder || !hasMore || !activeRef.current) return;
    if (el.scrollTop < 60) {
      setLoadingOlder(true);
      const oldest = messages[0]?.id;
      const prevHeight = el.scrollHeight;
      try {
        const { messages: older, hasMore: more } = await api.get(`/chat/conversations/${activeRef.current}/messages?limit=30&before=${oldest}`);
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
    if (!activeRef.current) return;
    socket.emit('typing', { conversationId: activeRef.current });
    clearTimeout(typingSendRef.current);
    typingSendRef.current = setTimeout(() => socket.emit('stop-typing', { conversationId: activeRef.current }), 1800);
  };

  const sendText = () => {
    const body = text.trim();
    if (!body || !activeRef.current) return;
    setSending(true);
    const socket = getSocket();
    socket.emit('send-message', { conversationId: activeRef.current, body }, (ack) => {
      setSending(false);
      if (!ack?.ok) setErrorMsg(ack?.error || 'Failed to send');
    });
    socket.emit('stop-typing', { conversationId: activeRef.current });
    setText('');
  };

  const uploadFile = async (file) => {
    if (!file || !activeRef.current) return;
    setUploadMsg(`Uploading ${file.name}…`);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.upload(`/chat/conversations/${activeRef.current}/attachments`, fd);
      setUploadMsg('');
    } catch (err) {
      setUploadMsg('');
      setErrorMsg(err.message || 'Upload failed');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const setStatus = async (status) => {
    if (!activeRef.current) return;
    try {
      await api.patch(`/chat/conversations/${activeRef.current}/status`, { status });
      setConversations(prev => prev.map(c => c.id === activeRef.current ? { ...c, status } : c));
    } catch (err) { setErrorMsg(err.message || 'Failed to update status'); }
  };

  const clientPresence = active ? presenceMap[active.client_id] : null;
  const online = !!clientPresence?.online;
  const presenceLabel = online ? 'Online' : (clientPresence?.last_seen ? `Last seen ${fmtDay(clientPresence.last_seen)} ${fmtTime(clientPresence.last_seen)}` : 'Offline');

  return (
    <AdminLayout title="Live Chat">
      {errorMsg && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{errorMsg}</div>}
      <div className={`admin-chat-grid bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden${active ? ' has-active' : ''}`} style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: 'calc(100vh - 170px)', minHeight: 460 }}>
        {/* Conversation list */}
        <div className="chat-list-pane" style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
            <input className="form-control" placeholder="Search name, email, message…" value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {STATUS_TABS.map(t => (
                <button key={t.key} onClick={() => setStatusFilter(t.key)}
                  className={statusFilter === t.key ? 'btn-p' : 'btn-g'}
                  style={{ padding: '4px 10px', fontSize: 12 }}>{t.label}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {!conversations.length ? (
              <div className="empty-state" style={{ padding: 30 }}><p style={{ fontSize: 13, color: 'var(--td)' }}>No conversations.</p></div>
            ) : conversations.map(c => (
              <button key={c.id} onClick={() => openConversation(c)}
                style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', border: 'none', borderBottom: '1px solid var(--border)', background: c.id === activeId ? 'rgba(212,0,31,.05)' : '#fff', cursor: 'pointer' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-grad)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                    {(c.client_name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff', background: presenceMap[c.client_id]?.online ? 'var(--success)' : 'var(--tf)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.client_name}</span>
                    <span style={{ fontSize: 10, color: 'var(--tf)', flexShrink: 0 }}>{fmtTime(c.last_message_at)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 12, color: 'var(--td)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last_message || 'No messages yet'}</span>
                    {c.admin_unread > 0 && <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '1px 7px', flexShrink: 0 }}>{c.admin_unread}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="chat-thread-pane" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {!active ? (
            <div className="empty-state" style={{ flex: 1, justifyContent: 'center' }}>
              <h4>Select a conversation</h4>
              <p style={{ fontSize: 13, color: 'var(--td)' }}>Choose a client on the left to start chatting.</p>
            </div>
          ) : (
            <>
              {/* header */}
              <div className="chat-thread-header" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <button type="button" className="btn-g chat-back-btn" title="Back to conversations" onClick={() => { setActiveId(null); activeRef.current = null; }} style={{ padding: '5px 10px', fontSize: 14, lineHeight: 1 }}>←</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{active.client_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--td)' }}>
                    {active.client_email}{active.company_name ? ` · ${active.company_name}` : ''}
                  </div>
                </div>
                <div className="chat-thread-actions" style={{ display: 'contents' }}>
                  <div style={{ fontSize: 12, color: online ? 'var(--success)' : 'var(--td)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: online ? 'var(--success)' : 'var(--tf)' }} />{presenceLabel}
                  </div>
                  <span className={`badge badge-${active.status === 'open' ? 'in_review' : active.status === 'resolved' ? 'completed' : 'draft'}`}>{active.status}</span>
                  <button className="btn-g" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setStatus(active.status === 'resolved' ? 'open' : 'resolved')}>
                    {active.status === 'resolved' ? 'Reopen' : 'Resolve'}
                  </button>
                  <button className="btn-g" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setStatus('archived')}>Archive</button>
                </div>
              </div>

              {/* messages */}
              <div ref={scrollRef} onScroll={handleScroll}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f) uploadFile(f); }}
                style={{ flex: 1, overflowY: 'auto', padding: 16, minHeight: 0, background: dragOver ? 'rgba(212,0,31,.04)' : 'transparent', position: 'relative' }}>
                {dragOver && <div style={{ position: 'absolute', inset: 12, border: '2px dashed var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 600, pointerEvents: 'none', background: 'rgba(255,255,255,.6)' }}>Drop file to send</div>}
                {loadingMsgs ? (
                  <div className="empty-state"><div className="spinner" /></div>
                ) : (
                  <>
                    {loadingOlder && <div style={{ textAlign: 'center', padding: 8 }}><div className="spinner" style={{ width: 16, height: 16 }} /></div>}
                    {messages.map(m => {
                      if (m.sender_role === 'system') {
                        return (
                          <div key={m.id} style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
                            <div style={{ maxWidth: '90%', background: '#fff7ed', border: '1px solid #fed7aa', color: '#7c2d12', borderRadius: 12, padding: '12px 16px', fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                              {m.body}
                              {m.meta?.order_id && (
                                <div style={{ marginTop: 8 }}>
                                  <Link to={`/admin/orders/${m.meta.order_id}`} style={{ fontSize: 12, fontWeight: 700, color: '#d4001f' }}>View order →</Link>
                                </div>
                              )}
                              <div style={{ fontSize: 10, color: '#b45309', marginTop: 6, textAlign: 'right' }}>{fmtTime(m.created_at)}</div>
                            </div>
                          </div>
                        );
                      }
                      const mine = m.sender_role === 'admin' || m.sender_role === 'staff';
                      return (
                        <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                          <div style={{ maxWidth: '76%', padding: '10px 14px', borderRadius: 14, background: mine ? 'var(--accent-grad)' : '#f5f5f7', color: mine ? '#fff' : 'var(--text)', borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4 }}>
                            {m.body && <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>}
                            <Attachment m={m} />
                            <div style={{ fontSize: 10, marginTop: 4, textAlign: 'right', color: mine ? 'rgba(255,255,255,.85)' : 'var(--tf)', display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                              {fmtTime(m.created_at)}{mine && <span title={m.status}>{m.status === 'seen' || m.is_read ? '✓✓' : '✓'}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {otherTyping && <div style={{ fontSize: 12, color: 'var(--td)', fontStyle: 'italic', padding: '2px 4px' }}>{active.client_name?.split(' ')[0] || 'Client'} is typing…</div>}
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
                  <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.zip" onChange={(e) => uploadFile(e.target.files?.[0])} />
                  <textarea className="form-control" rows={1} value={text} placeholder="Type a reply…"
                    onChange={(e) => { setText(e.target.value); emitTyping(); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); } }}
                    style={{ resize: 'none', flex: 1, maxHeight: 120 }} />
                  <button type="button" className="btn-p" onClick={sendText} disabled={sending || !text.trim()} style={{ padding: '10px 18px' }}>{sending ? '…' : 'Send'}</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
