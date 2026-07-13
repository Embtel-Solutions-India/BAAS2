import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/Portal/AdminLayout';
import { api, formatDate, statusBadge } from '../../utils/api';

export default function AdminMessages() {
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
        const { orders } = await api.get('/admin/orders');
        setThreads(orders || []);
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
      const { messages } = await api.get(`/admin/orders/${orderId}/messages`);
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
      await api.post(`/admin/orders/${activeThread.id}/messages`, { body: msgInput.trim() });
      setMsgInput('');
      loadMessages(activeThread.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <AdminLayout title="Messages">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] border border-gray-100 rounded-xl overflow-hidden bg-white shadow-xs h-[calc(100vh-170px)] min-h-[500px]">
        {/* Thread Sidebar List */}
        <div className="border-r border-gray-100 flex flex-col h-full bg-white">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
            All Orders
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-rose-100 border-t-rose-600"></div>
              </div>
            ) : !threads.length ? (
              <div className="p-8 text-center text-xs text-gray-400">No orders.</div>
            ) : (
              threads.map(t => (
                <div
                  key={t.id}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50/70 select-none ${activeThread?.id === t.id ? 'bg-rose-50/20 border-r-2 border-r-[#d4001f]' : ''}`}
                  onClick={() => handleSelectThread(t)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-gray-900">{t.order_number}</span>
                    <span className={`badge badge-${t.status} border border-current/10 font-semibold px-2 py-0.5 text-[9px] rounded-full`}>
                      {statusBadge(t.status)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-1 truncate">{t.client_name || '—'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messaging Pane */}
        <div className="flex flex-col h-full bg-gray-50/30">
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">No Active Conversation</h4>
              <p className="text-xs text-gray-400 max-w-xs">Select an order thread from the sidebar to view customer messages and reply.</p>
            </div>
          ) : (
            <>
              {/* Active Conversation Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
                <div>
                  <div className="text-sm font-extrabold text-gray-900">{activeThread.order_number}</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">
                    {activeThread.client_name} &bull; <span className={`badge badge-${activeThread.status} border border-current/10 px-2 py-0.5 text-[9px] rounded-full`}>{statusBadge(activeThread.status)}</span>
                  </div>
                </div>
              </div>

              {/* Chat Timeline */}
              <div
                className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col"
                ref={chatMessagesRef}
              >
                {msgLoading ? (
                  <div className="flex items-center justify-center m-auto">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-100 border-t-rose-600"></div>
                  </div>
                ) : !messages.length ? (
                  <p className="text-xs text-gray-400 text-center m-auto font-medium">No messages yet. Send a message to start the conversation.</p>
                ) : (
                  messages.map(m => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender_role === 'client' ? 'self-start items-start' : 'self-end items-end'} max-w-[75%]`}
                    >
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">
                        {m.sender_role === 'client' ? activeThread.client_name : 'Admin'}
                      </span>
                      <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed border shadow-2xs ${m.sender_role === 'client' ? 'bg-white text-gray-700 border-gray-100 rounded-bl-xs' : 'bg-[#d4001f] text-white border-transparent rounded-br-xs'}`}>
                        {m.body}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1 px-1">{formatDate(m.created_at)}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMsg} className="p-4 border-t border-gray-100 bg-white flex items-end gap-2 shrink-0">
                <textarea
                  id="msg-input"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-[#d4001f] focus:ring-3 focus:ring-[#d4001f]/10 outline-none text-xs transition-all bg-white resize-none min-h-[44px]"
                  rows={1}
                  placeholder="Reply to client…"
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMsg(e);
                    }
                  }}
                />
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-[#d4001f] hover:bg-[#a4001a] text-white text-xs font-bold rounded-lg shadow-xs transition-all duration-200 cursor-pointer disabled:opacity-50 shrink-0"
                  disabled={sendLoading}
                >
                  {sendLoading ? 'Sending…' : 'Send'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

