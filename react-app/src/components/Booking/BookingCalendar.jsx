import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WEEKDAYS, addDays, addMonths, dayNumber, formatLongDate, monthGrid, monthOf, monthTitle } from '../../utils/bookingDates';

// Month calendar. It only displays what the server says is available; it never decides availability itself.
// Keyboard: arrow keys move between days, Home/End jump to the start/end of the week, PageUp/PageDown change month,
// Enter or Space picks a day. Unavailable days stay focusable (so screen readers can hear why) but cannot be picked.
export default function BookingCalendar({ month, onMonthChange, selectedDate, onSelect, today, maxDate, availableDates, fullyBookedDates, loading, error, onRetry }) {
  const [focusDate, setFocusDate] = useState(selectedDate || '');
  const wantFocus = useRef(false);
  const gridRef = useRef(null);

  const minMonth = monthOf(today);
  const maxMonth = monthOf(maxDate);
  const weeks = monthGrid(month);

  // The day that takes the tab stop: the focused day, else the selection, else the first bookable day, else today.
  const firstOpen = weeks.flat().find((d) => d && availableDates.has(d));
  const tabStop = focusDate && monthOf(focusDate) === month ? focusDate : (selectedDate && monthOf(selectedDate) === month ? selectedDate : (firstOpen || (monthOf(today) === month ? today : `${month}-01`)));

  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    const el = gridRef.current && gridRef.current.querySelector(`[data-date="${tabStop}"]`);
    if (el) el.focus();
  });

  const statusOf = (date) => {
    if (date < today || date > maxDate) return 'unavailable';
    if (availableDates.has(date)) return 'available';
    if (fullyBookedDates.has(date)) return 'full';
    return 'unavailable';
  };

  const move = (target) => {
    if (target < `${minMonth}-01`) return;
    if (monthOf(target) > maxMonth) return;
    wantFocus.current = true;
    setFocusDate(target);
    if (monthOf(target) !== month) onMonthChange(monthOf(target));
  };

  const onKeyDown = (e, date) => {
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    const keys = {
      ArrowLeft: () => addDays(date, -1), ArrowRight: () => addDays(date, 1), ArrowUp: () => addDays(date, -7), ArrowDown: () => addDays(date, 7),
      Home: () => addDays(date, -dow), End: () => addDays(date, 6 - dow),
      PageUp: () => `${addMonths(month, -1)}-${date.slice(8)}`, PageDown: () => `${addMonths(month, 1)}-${date.slice(8)}`,
    };
    if (keys[e.key]) { e.preventDefault(); let t = keys[e.key](); if (monthOf(t) !== monthOf(addDays(`${monthOf(t)}-01`, 0))) t = `${monthOf(t)}-01`; move(t); }
  };

  const label = (date, status) => {
    const text = { available: 'available', full: 'fully booked', unavailable: 'not available' }[status];
    return `${formatLongDate(date)}, ${text}${date === today ? ', today' : ''}${date === selectedDate ? ', selected' : ''}`;
  };

  return (
    <div className="bk-cal" aria-busy={loading}>
      <div className="bk-cal-head">
        <button type="button" className="bk-nav" onClick={() => onMonthChange(addMonths(month, -1))} disabled={month <= minMonth} aria-label="Previous month"><ChevronLeft size={20} aria-hidden="true" /></button>
        <h3 className="bk-cal-title" aria-live="polite">{monthTitle(month)}</h3>
        <button type="button" className="bk-nav" onClick={() => onMonthChange(addMonths(month, 1))} disabled={month >= maxMonth} aria-label="Next month"><ChevronRight size={20} aria-hidden="true" /></button>
      </div>

      <div ref={gridRef} role="grid" aria-label={`Choose a date in ${monthTitle(month)}`} className={`bk-grid${loading ? ' is-loading' : ''}`}>
        <div role="row" className="bk-row">
          {WEEKDAYS.map((d) => <div key={d} role="columnheader" className="bk-dow" aria-label={d}>{d.slice(0, 3)}</div>)}
        </div>
        {weeks.map((week, i) => (
          <div role="row" className="bk-row" key={i}>
            {week.map((date, j) => {
              if (!date) return <div role="gridcell" key={j} className="bk-cell bk-cell-empty" />;
              const status = statusOf(date);
              const pickable = status === 'available' && !loading;
              return (
                <div role="gridcell" key={date} className="bk-cell">
                  <button
                    type="button" data-date={date} tabIndex={date === tabStop ? 0 : -1}
                    className={`bk-day is-${status}${date === today ? ' is-today' : ''}${date === selectedDate ? ' is-selected' : ''}`}
                    aria-label={label(date, status)} aria-disabled={!pickable} aria-pressed={date === selectedDate}
                    onClick={() => { setFocusDate(date); if (pickable) onSelect(date); }}
                    onKeyDown={(e) => onKeyDown(e, date)}
                  >
                    {dayNumber(date)}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
        {loading && <div className="bk-loading" role="status"><span className="bk-spinner" aria-hidden="true" />Loading availability…</div>}
      </div>

      {error && (
        <div className="bk-alert" role="alert">
          {error} <button type="button" className="bk-link" onClick={onRetry}>Try again</button>
        </div>
      )}

      <ul className="bk-legend" aria-label="Calendar key">
        <li><span className="bk-key is-available" />Available</li>
        {fullyBookedDates.size > 0 && <li><span className="bk-key is-full" />Fully booked</li>}
        <li><span className="bk-key is-unavailable" />Unavailable</li>
        <li><span className="bk-key is-today" />Today</li>
      </ul>
    </div>
  );
}
