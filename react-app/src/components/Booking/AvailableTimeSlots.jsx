import { formatLongDate, formatTime } from '../../utils/bookingDates';

// The day's 30-minute appointments. Times that are booked, blocked or already past stay visible but disabled;
// the lunch break is shown once as a divider and is never selectable.
export default function AvailableTimeSlots({ date, loading, error, slots, reason, selectedTime, onSelect, onRetry, zoneLabel }) {
  if (!date) {
    return (
      <div className="bk-empty">
        <h3 className="bk-panel-title">Choose a date</h3>
        <p>Select an available day on the calendar to see appointment times.</p>
      </div>
    );
  }

  const items = [];
  let lunchAdded = false;
  slots.forEach((s) => {
    if (s.reason === 'Lunch break') {
      if (!lunchAdded) {
        const lunch = slots.filter((x) => x.reason === 'Lunch break');
        items.push({ type: 'lunch', start: lunch[0].startTime, end: lunch[lunch.length - 1].endTime });
        lunchAdded = true;
      }
    } else items.push({ type: 'slot', ...s });
  });
  const openCount = slots.filter((s) => s.available).length;

  return (
    <div>
      <h3 className="bk-panel-title">{formatLongDate(date)}</h3>
      <p className="bk-zone">All times are {zoneLabel}. Each appointment is 30 minutes.</p>

      {loading && <div className="bk-loading-inline" role="status"><span className="bk-spinner" aria-hidden="true" />Loading times…</div>}
      {error && <div className="bk-alert" role="alert">{error} <button type="button" className="bk-link" onClick={onRetry}>Try again</button></div>}

      {!loading && !error && !slots.length && (
        <div className="bk-empty"><p>{reason ? `${reason}.` : 'No appointments are available on this date.'} Please choose another day.</p></div>
      )}

      {!loading && !error && slots.length > 0 && openCount === 0 && (
        <div className="bk-empty"><p>No appointments are left on this day. Please choose another date.</p></div>
      )}

      {!loading && !error && slots.length > 0 && (
        <ul className="bk-slots" aria-label={`Appointment times on ${formatLongDate(date)}`}>
          {items.map((it) => (it.type === 'lunch' ? (
            <li key="lunch" className="bk-lunch">Lunch break · {formatTime(it.start)} – {formatTime(it.end)}</li>
          ) : (
            <li key={it.startTime}>
              <button
                type="button" disabled={!it.available} aria-pressed={selectedTime === it.startTime}
                className={`bk-slot${selectedTime === it.startTime ? ' is-selected' : ''}`}
                onClick={() => onSelect(it)}
                aria-label={`${formatTime(it.startTime)} to ${formatTime(it.endTime)}${it.available ? '' : `, unavailable${it.reason === 'Booked' ? ', already booked' : ''}`}`}
              >
                {formatTime(it.startTime)}
              </button>
            </li>
          )))}
        </ul>
      )}
    </div>
  );
}
