import { useEffect, useState, useRef } from 'react';
import PortalLayout from '../../components/Portal/PortalLayout';
import { api, formatDate } from '../../utils/api';

export default function Messages() {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null); // order object
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    async function loadThreads() {
      try {
        const { orders } = await api.get('/orders');
        const active = orders.filter(o => o.status !== 'cancelled');
        setThreads(active);
      } catch (err) {
        console.error('Error loading threads:', err);
      } finally {
        setLoading(false);
      }
    }
    loadThreads();
  }, []);

  const loadMessages = async (orderId) => {
    setMsgLoading(true);
    try {
      const { messages } = await api.get(`/messages/order/${orderId}`);
      setMessages(messages || []);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setMsgLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  const handleSelectThread = (thread) => {
    setActiveThread(thread);
    loadMessages(thread.id);
  };

  const handleSendMsg = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeThread) return;
    setSendLoading(true);
    try {
      await api.post(`/messages/order/${activeThread.id}`, { body: msgInput.trim() });
      setMsgInput('');
      loadMessages(activeThread.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <PortalLayout title="Messages" subtitle="Chat with your BAAS advisor">
      <div className="page-header-bar" style={{ marginBottom: '20px' }}>
        <h1>Messages</h1>
      </div>

      <div className="msg-layout" style={{
        display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0,
        height: 'calc(100vh - 220px)', minHeight: '400px',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        border: '1px solid var(--border)', background: '#fff'
      }}>
        {/* Thread List */}
        <div className="thread-list" style={{ borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
          <div style={{ padding: '14px 16px', background: '#f9f9fb', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: 600, color: 'var(--td)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Conversations
          </div>
          <div id="thread-items">
            {loading ? (
              <div className="empty-state" style={{ padding: '40px' }}><div className="spinner"></div></div>
            ) : !threads.length ? (
              <div className="empty-state" style={{ padding: '40px 16px' }}><p>No active orders found.</p></div>
            ) : (
              threads.map(t => (
                <div
                  key={t.id}
                  className={`thread-item ${activeThread?.id === t.id ? 'active' : ''}`}
                  onClick={() => handleSelectThread(t)}
                  style={{
                    padding: '14px 16px', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'background .15s',
                    background: activeThread?.id === t.id ? 'rgba(212,0,31,.05)' : 'transparent',
                    borderRight: activeThread?.id === t.id ? '2px solid var(--accent)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="thread-order" style={{ fontSize: '13px', fontWeight: 600 }}>{t.order_number}</div>
                    <span className={`badge badge-${t.status}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{t.status}</span>
                  </div>
                  <div className="thread-svc" style={{ fontSize: '12px', color: 'var(--td)', marginTop: '2px' }}>{t.service_name || '—'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {!activeThread ? (
            <div className="no-thread" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--td)', height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: .3, marginBottom: '12px', margin: '0 auto' }}>
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <p style={{ margin: 0 }}>Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="chat-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{activeThread.order_number}</div>
                <div style={{ fontSize: '13px', color: 'var(--td)' }}>
                  {activeThread.service_name || '—'} · <span className={`badge badge-${activeThread.status}`}>{activeThread.status}</span>
                </div>
              </div>

              <div
                className="chat-messages"
                ref={chatMessagesRef}
                style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                {msgLoading ? (
                  <div className="spinner" style={{ margin: 'auto' }}></div>
                ) : !messages.length ? (
                  <p style={{ color: 'var(--td)', fontSize: '14px', textAlign: 'center', margin: 'auto' }}>No messages yet. Send one below.</p>
                ) : (
                  messages.map(m => (
                    <div
                      key={m.id}
                      className={`msg-bubble msg-${m.sender_role}`}
                      style={{
                        padding: '12px 16px', borderRadius: 'var(--radius-md)', maxWidth: '70%',
                        marginLeft: m.sender_role === 'client' ? 'auto' : '0',
                        background: m.sender_role === 'client' ? 'rgba(212,0,31,.08)' : '#f5f5f7',
                        borderBottomRightRadius: m.sender_role === 'client' ? '4px' : 'var(--radius-md)',
                        borderBottomLeftRadius: m.sender_role === 'admin' ? '4px' : 'var(--radius-md)'
                      }}
                    >
                      <div className="msg-meta" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--td)', marginBottom: '4px' }}>
                        {m.sender_role === 'client' ? 'You' : 'BAAS Advisor'}
                      </div>
                      <div className="msg-body" style={{ fontSize: '14px', lineHeight: 1.55 }}>{m.body}</div>
                      <div className="msg-time" style={{ fontSize: '11px', color: 'var(--tf)', marginTop: '4px', textAlign: 'right' }}>{formatDate(m.created_at)}</div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMsg} className="chat-input-bar" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
                <textarea
                  id="msg-input"
                  className="form-control"
                  rows={1}
                  placeholder="Type a message…"
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  style={{ resize: 'none', flex: 1, minHeight: '40px' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMsg(e);
                    }
                  }}
                />
                <button type="submit" className="btn-p" disabled={sendLoading} style={{ padding: '6px 16px', cursor: 'pointer' }}>
                  {sendLoading ? 'Sending…' : 'Send'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
