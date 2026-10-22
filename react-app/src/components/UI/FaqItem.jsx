import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function FaqItem({ question, answer, link, onOpen }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className={`faq-q${open ? ' open' : ''}`} onClick={() => { if (!open && onOpen) onOpen(); setOpen(o => !o); }} aria-expanded={open}>
        {question}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      <div className={`faq-a${open ? ' open' : ''}`}>
        <p>{answer}{link && <> <Link to={link.to} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline' }}>{link.label}</Link></>}</p>
      </div>
    </div>
  );
}
