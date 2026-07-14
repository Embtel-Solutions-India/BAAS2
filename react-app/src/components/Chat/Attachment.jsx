import { fmtSize, isImage } from '../../utils/chatFormat';

/** Renders a chat message attachment: inline image preview or a file chip. */
export default function Attachment({ m }) {
  if (!m.attachment_url) return null;

  if (isImage(m.attachment_type)) {
    return (
      <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: m.body ? 8 : 0 }}>
        <img src={m.attachment_url} alt={m.attachment_name || 'image'} style={{ maxWidth: 240, maxHeight: 240, borderRadius: 10, display: 'block' }} />
      </a>
    );
  }

  return (
    <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" download
      style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: m.body ? 8 : 0, padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.04)', border: '1px solid var(--cb)', maxWidth: 260 }}>
      <svg width="22" height="22" fill="none" stroke="var(--accent)" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.attachment_name || 'Attachment'}</span>
        <span style={{ fontSize: 11, color: 'var(--td)' }}>{fmtSize(m.attachment_size)}</span>
      </span>
    </a>
  );
}
