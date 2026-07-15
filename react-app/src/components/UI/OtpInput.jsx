import { useRef } from 'react';

/**
 * Segmented OTP input. Controlled via `value` (string) / `onChange`.
 * Auto-advances on entry, supports backspace/arrows and paste, and calls
 * `onComplete(code)` when all boxes are filled (for auto-submit).
 */
export default function OtpInput({ value = '', onChange, length = 6, onComplete, disabled = false }) {
  const refs = useRef([]);

  const emit = (arr) => {
    const next = arr.join('');
    onChange(next);
    if (arr.every((c) => c !== '')) onComplete?.(next);
  };

  const handleChange = (i, e) => {
    const digit = (e.target.value.match(/\d/g) || []).pop();
    if (!digit) return;
    const arr = Array.from({ length }, (_, k) => value[k] || '');
    arr[i] = digit;
    emit(arr);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = Array.from({ length }, (_, k) => value[k] || '');
      if (arr[i]) { arr[i] = ''; onChange(arr.join('')); }
      else if (i > 0) { arr[i - 1] = ''; onChange(arr.join('')); refs.current[i - 1]?.focus(); }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const txt = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    if (!txt) return;
    e.preventDefault();
    const arr = Array.from({ length }, (_, k) => txt[k] || '');
    emit(arr);
    refs.current[Math.min(txt.length, length - 1)]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }} role="group" aria-label="One-time code">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          style={{
            width: '46px', height: '54px', textAlign: 'center', fontSize: '22px', fontWeight: 700,
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--bl)', color: 'var(--text)',
            background: '#fff', outline: 'none', transition: 'border-color .15s, box-shadow .15s',
          }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--bl)'; e.target.style.boxShadow = 'none'; }}
          onFocusCapture={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = 'var(--ring)'; }}
        />
      ))}
    </div>
  );
}
