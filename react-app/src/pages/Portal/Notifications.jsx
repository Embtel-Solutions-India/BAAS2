import { useEffect, useState } from 'react';
import PortalLayout from '../../components/Portal/PortalLayout';
import { api, formatDate } from '../../utils/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const loadNotifications = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setAlertMsg('All notifications marked as read.');
    } catch (err) {
      alert(err.message);
    }
  };

  const TYPE_ICONS = {
    order_update: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
      </svg>
    ),
    message: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
    general: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    )
  };

  return (
    <PortalLayout title="Notifications" subtitle="Stay up to date with your orders">
      <div className="page-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Notifications</h1>
        <button className="btn-g" onClick={handleMarkAllRead} style={{ fontSize: '13px', cursor: 'pointer' }}>
          Mark all as read
        </button>
      </div>

      {alertMsg && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          {alertMsg}
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }} id="notif-card">
        {loading ? (
          <div className="empty-state" style={{ padding: '60px' }}>
            <div className="spinner"></div>
          </div>
        ) : !notifications.length ? (
          <div className="empty-state" style={{ padding: '80px', textAlign: 'center' }}>
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', opacity: 0.4 }}>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '8px 0' }}>All caught up!</h4>
            <p style={{ color: 'var(--td)', fontSize: '14px' }}>You have no notifications.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
              onClick={() => handleMarkRead(n.id, n.is_read)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                padding: '16px 20px', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', transition: 'background .15s',
                background: n.is_read ? 'transparent' : 'rgba(212,0,31,.03)'
              }}
            >
              <div className="notif-dot-wrap" style={{ paddingTop: '5px' }}>
                <div className="notif-dot" style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: 'var(--accent)', flexShrink: 0,
                  opacity: n.is_read ? 0 : 1,
                  transition: 'opacity .2s'
                }}></div>
              </div>
              <div className="type-icon" style={{
                width: '38px', height: '38px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(212,0,31,.08)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {TYPE_ICONS[n.type] || TYPE_ICONS.general}
              </div>
              <div style={{ flex: 1 }}>
                <div className="notif-title" style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{n.title}</div>
                <div className="notif-body" style={{ fontSize: '14px', color: 'var(--tm)', lineHeight: 1.5 }}>{n.body}</div>
                <div className="notif-date" style={{ fontSize: '12px', color: 'var(--td)', marginTop: '5px' }}>{formatDate(n.created_at)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </PortalLayout>
  );
}
