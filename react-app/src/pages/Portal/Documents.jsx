import { useEffect, useState } from 'react';
import PortalLayout from '../../components/Portal/PortalLayout';
import { api, apiUrl, formatDate } from '../../utils/api';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadDocuments = async () => {
    try {
      const data = await api.get('/documents');
      setDocuments(data.documents || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const getDocIcon = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    const isImg = ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
    if (isImg) {
      return (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      );
    }
    return (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
      </svg>
    );
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <PortalLayout title="Documents" subtitle="All your filed documents in one place">
      <div className="page-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Documents</h1>
        <div style={{ fontSize: '14px', color: 'var(--td)' }}>
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="empty-state" style={{ padding: '80px 24px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="doc-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          {!documents.length ? (
            <div className="empty-state" style={{ padding: '80px', textAlign: 'center' }}>
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', opacity: 0.4 }}>
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
              <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '8px 0' }}>No documents yet</h4>
              <p style={{ color: 'var(--td)', fontSize: '14px' }}>Documents will appear here once your orders are processed.</p>
            </div>
          ) : (
            documents.map(d => (
              <div
                key={d.id}
                className="doc-card"
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--cb)', background: '#fff',
                  transition: 'border-color .2s'
                }}
              >
                <div className="doc-icon" style={{
                  width: '44px', height: '44px', flexShrink: 0,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(212,0,31,.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)'
                }}>
                  {getDocIcon(d.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="doc-name" style={{ fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.name}
                  </div>
                  <div className="doc-meta" style={{ fontSize: '12px', color: 'var(--td)', marginTop: '2px' }}>
                    <span className="type-chip" style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(0,0,0,.06)', fontSize: '11px', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--td)'
                    }}>{d.type}</span>
                    {d.order_number && ` · ${d.order_number}`}
                    {d.file_size && ` · ${formatSize(d.file_size)}`}
                    {` · ${formatDate(d.created_at)}`}
                  </div>
                </div>
                <div className="doc-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <a
                    href={apiUrl(`/documents/${d.id}/download`)}
                    className="btn-g"
                    style={{ fontSize: '13px', display: 'inline-flex', padding: '6px 12px' }}
                    download
                  >
                    Download
                  </a>
                  {!d.is_final && (
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(d.id)}
                      style={{ padding: '7px 14px', fontSize: '13px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </PortalLayout>
  );
}
