import { useState } from 'react';

/**
 * Password input with an accessible show/hide toggle.
 * Drop-in replacement for a password <input>: pass the same className,
 * value, onChange, id, name, placeholder, etc. The eye button sits inside
 * the field (absolutely positioned) so it never shifts the form layout,
 * and the input value is preserved when toggling.
 *
 * `iconColor` defaults to a neutral gray that reads on both light and dark
 * backgrounds (works for the portal's light forms and the admin dark login).
 */
export default function PasswordInput({ className = '', style, wrapperStyle, iconColor = '#94a3b8', ...props }) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'block', ...wrapperStyle }}>
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={className}
        style={{ ...style, paddingRight: '42px' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        title={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '30px', height: '30px', padding: 0, border: 'none', background: 'transparent',
          color: iconColor, cursor: 'pointer', borderRadius: '6px', transition: 'color .15s, opacity .15s', opacity: 0.85,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.85'; }}
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
