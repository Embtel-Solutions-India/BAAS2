import { ArrowRight, Check, X } from 'lucide-react';

// The pill-shaped bar above the booking panel: Session · Date · Time · Details, and one action button.
// The active step is the raised white segment. Steps already filled in show their value and can be cleared.
export default function BookingStepBar({ step, onStep, dateText, timeText, detailsText, onClear, action }) {
  const seg = (id, label, value, placeholder, { enabled, clearable }) => {
    const active = step === id;
    return (
      <div className={`bk2-seg${active ? ' is-active' : ''}${enabled ? '' : ' is-off'}`} key={id}>
        <button type="button" className="bk2-seg-btn" onClick={() => enabled && onStep(id)} aria-current={active ? 'step' : undefined} aria-disabled={!enabled}>
          <span className="bk2-seg-label">{label}</span>
          <span className={`bk2-seg-value${value ? '' : ' is-empty'}`}>{value || placeholder}</span>
        </button>
        {active && clearable && value && (
          <button type="button" className="bk2-clear" onClick={() => onClear(id)} aria-label={`Clear ${label.toLowerCase()}`}><X size={14} aria-hidden="true" /></button>
        )}
      </div>
    );
  };

  return (
    <div className="bk2-bar" role="group" aria-label="Booking steps">
      <div className="bk2-seg bk2-seg-static">
        <div className="bk2-seg-btn" aria-hidden={false}>
          <span className="bk2-seg-label">Session</span>
          <span className="bk2-seg-value">Free 1-to-1 · 30 min</span>
        </div>
      </div>
      {seg('date', 'Date', dateText, 'Add date', { enabled: true, clearable: true })}
      {seg('time', 'Time', timeText, 'Add time', { enabled: !!dateText, clearable: true })}
      {seg('details', 'Details', detailsText, 'Your details', { enabled: !!timeText, clearable: false })}
      <button type="button" className="bk2-go" onClick={action.onClick} disabled={action.disabled}>
        {action.final ? <Check size={18} aria-hidden="true" /> : null}
        <span>{action.label}</span>
        {!action.final ? <ArrowRight size={18} aria-hidden="true" /> : null}
      </button>
    </div>
  );
}
