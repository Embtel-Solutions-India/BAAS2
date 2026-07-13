import { useState } from 'react';

export default function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className={`faq-q${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {question}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      <div className={`faq-a${open ? ' open' : ''}`}>
        <p>{answer}</p>
      </div>
    </div>
  );
}
