import { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PortalLayout from '../../components/Portal/PortalLayout';
import { api, formatDate, formatCurrency, statusBadge } from '../../utils/api';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const loadOrderDetails = async () => {
    try {
      const [orderRes, docsRes, msgsRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get(`/documents/order/${id}`),
        api.get(`/messages/order/${id}`)
      ]);
      setOrder(orderRes.order);
      setHistory(orderRes.history || []);
      setDocuments(docsRes.documents || []);
      setMessages(msgsRes.messages || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setErrorMsg('No order ID specified.');
      setLoading(false);
      return;
    }
    loadOrderDetails();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.patch(`/orders/${id}/cancel`);
      setUploadStatus({ type: 'success', text: 'Order cancelled.' });
      loadOrderDetails();
    } catch (err) {
      setUploadStatus({ type: 'danger', text: err.message });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    setSendLoading(true);
    try {
      await api.post(`/messages/order/${id}`, { body: msgInput.trim() });
      setMsgInput('');
      loadOrderDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setSendLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus({ type: 'info', text: `Uploading ${file.name}…` });
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.upload(`/documents/upload/${id}`, fd);
      setUploadStatus({ type: 'success', text: 'Uploaded successfully.' });
      loadOrderDetails();
    } catch (err) {
      setUploadStatus({ type: 'danger', text: err.message });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const infoRow = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '14px' }} key={label}>
      <span style={{ color: 'var(--td)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  if (loading) {
    return (
      <PortalLayout title="Order Detail">
        <div className="empty-state" style={{ padding: '80px 24px' }}>
          <div className="spinner"></div>
        </div>
      </PortalLayout>
    );
  }

  if (errorMsg) {
    return (
      <PortalLayout title="Order Detail">
        <div className="empty-state" style={{ padding: '60px' }}>
          <div className="alert alert-danger">{errorMsg}</div>
          <Link to="/client-portal/orders" className="btn-g mt-16">← Back to Orders</Link>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title={`Order ${order?.order_number || ''}`}>
      <div className="page-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1>Order {order?.order_number}</h1>
          <div style={{ fontSize: '14px', color: 'var(--td)', marginTop: '4px' }}>
            {order?.service_name || '—'} &nbsp;·&nbsp; {order?.state} &nbsp;·&nbsp; <span className={`badge badge-${order?.status}`}>{statusBadge(order?.status)}</span>
          </div>
        </div>
        <Link to="/client-portal/orders" className="btn-g">← Back to Orders</Link>
      </div>

      {uploadStatus.text && (
        <div className={`alert alert-${uploadStatus.type}`} style={{ marginBottom: '20px' }}>
          {uploadStatus.text}
        </div>
      )}

      <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Order Progress */}
          <div className="card">
            <h4 style={{ marginBottom: '18px', fontSize: '15px', fontWeight: 700 }}>Order Progress</h4>
            <div className="timeline" style={{ position: 'relative', paddingLeft: '24px' }}>
              <div style={{ content: "''", position: 'absolute', left: '7px', top: '4px', bottom: '4px', width: '2px', background: 'var(--border)' }}></div>
              {history.map((h, i) => (
                <div className={`timeline-item ${i === history.length - 1 ? 'active' : ''}`} key={h.id || i} style={{ position: 'relative', marginBottom: '20px' }}>
                  <div className="timeline-dot" style={{
                    position: 'absolute', left: '-24px', top: '4px',
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: i === history.length - 1 ? 'var(--accent)' : 'var(--border)',
                    border: '2px solid #fff',
                    boxShadow: i === history.length - 1 ? '0 0 0 3px rgba(212,0,31,.2)' : '0 0 0 2px var(--border)'
                  }}></div>
                  <div className="timeline-status" style={{ fontSize: '14px', fontWeight: 600 }}>
                    {capitalize(h.status.replace('_', ' '))}
                  </div>
                  {h.note && <div className="timeline-note" style={{ fontSize: '13px', color: 'var(--td)', marginTop: '2px' }}>{h.note}</div>}
                  <div className="timeline-date" style={{ fontSize: '12px', color: 'var(--tf)', marginTop: '2px' }}>{formatDate(h.created_at)}</div>
                </div>
              ))}
            </div>

            {['pending', 'in_review'].includes(order?.status) && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button className="btn-danger" onClick={handleCancelOrder} style={{ fontSize: '14px', padding: '8px 18px', cursor: 'pointer' }}>
                  Cancel Order
                </button>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Documents</h4>
              <label className="btn-g" style={{ cursor: 'pointer', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload
                <input ref={fileInputRef} type="file" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png,.docx" style={{ display: 'none' }} />
              </label>
            </div>
            <div id="doc-list">
              {!documents.length ? (
                <p style={{ fontSize: '14px', color: 'var(--td)', margin: 0 }}>No documents yet.</p>
              ) : (
                documents.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{d.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--td)' }}>{d.type} · {formatDate(d.created_at)}</div>
                    </div>
                    <a href={`http://localhost:4000/api/documents/${d.id}/download`} className="btn-g" style={{ fontSize: '13px', display: 'inline-flex', padding: '6px 12px' }} download>Download</a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="card">
            <h4 style={{ marginBottom: '14px', fontSize: '15px', fontWeight: 700 }}>Messages</h4>
            <div className="msg-area" style={{ maxHeight: '340px', overflowY: 'auto', padding: '4px 0' }}>
              {!messages.length ? (
                <p style={{ fontSize: '14px', color: 'var(--td)' }}>No messages yet. Send a message to your advisor below.</p>
              ) : (
                messages.map(m => (
                  <div className={`msg-bubble msg-${m.sender_role}`} key={m.id} style={{
                    padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '10px', maxWidth: '85%',
                    marginLeft: m.sender_role === 'client' ? 'auto' : '0',
                    background: m.sender_role === 'client' ? 'rgba(212,0,31,.08)' : '#f5f5f7',
                    borderBottomRightRadius: m.sender_role === 'client' ? '4px' : 'var(--radius-md)',
                    borderBottomLeftRadius: m.sender_role === 'admin' ? '4px' : 'var(--radius-md)'
                  }}>
                    <div className="msg-meta" style={{ fontSize: '12px', color: 'var(--td)', marginBottom: '4px', fontWeight: 600 }}>
                      {m.sender_role === 'client' ? 'You' : 'BAAS Advisor'}
                    </div>
                    <div className="msg-body" style={{ fontSize: '14px', lineHeight: 1.55 }}>{m.body}</div>
                    <div className="msg-time" style={{ fontSize: '11px', color: 'var(--tf)', marginTop: '4px', textAlign: 'right' }}>{formatDate(m.created_at)}</div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <textarea
                value={msgInput}
                onChange={e => setMsgInput(e.target.value)}
                className="form-control"
                rows={2}
                placeholder="Type a message to your advisor…"
                style={{ resize: 'none', flex: 1 }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button type="submit" className="btn-p" disabled={sendLoading} style={{ alignSelf: 'flex-end', padding: '10px 16px', cursor: 'pointer' }}>
                {sendLoading ? 'Sending…' : 'Send'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h4 style={{ marginBottom: '14px', fontSize: '15px', fontWeight: 700 }}>Order Info</h4>
            {infoRow('Order #', order?.order_number)}
            {infoRow('Service', order?.service_name || '—')}
            {infoRow('State', order?.state)}
            {infoRow('Status', <span className={`badge badge-${order?.status}`}>{statusBadge(order?.status)}</span>)}
            {infoRow('Amount', formatCurrency(order?.total_amount))}
            {infoRow('Placed', formatDate(order?.created_at))}
            {infoRow('Updated', formatDate(order?.updated_at))}
            {order?.notes && infoRow('Notes', <span style={{ color: 'var(--tm)' }}>{order?.notes}</span>)}
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '6px', fontSize: '15px', fontWeight: 700 }}>Need help?</h4>
            <p style={{ fontSize: '14px', margin: 0 }}>Contact us directly:</p>
            <a href="tel:+15109627300" className="btn-ol mt-8" style={{ width: '100%', justifyContent: 'center', fontSize: '14px', display: 'inline-flex' }}>
              📞 (510) 962-7300
            </a>
            <a href="mailto:accounting@bayareaaccountingsolutions.com" className="btn-g mt-8" style={{ width: '100%', justifyContent: 'center', fontSize: '13px', display: 'inline-flex' }}>
              ✉ Email Us
            </a>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
