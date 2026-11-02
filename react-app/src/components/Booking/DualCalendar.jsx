import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WEEKDAYS_MONDAY, addDays, addMonths, dayNumber, formatLongDate, monthGridMonday, monthOf, monthTitle, shiftMonth } from '../../utils/bookingDates';
import { useMediaQuery } from './useMediaQuery';

// Two months side by side on wide screens (one on phones), Monday first. It only shows what the booking system says is
// free; it never decides availability. Keyboard: arrows move between days, Home/End go to the start/end of the week,
// PageUp/PageDown change month, Enter or Space picks. Unavailable days stay focusable so screen readers can hear why.
export default function DualCalendar({ month, onMonthChange, selectedDate, onSelect, today, maxDate, availableDates, loading, error, onRetry }) {
  const twoUp = useMediaQuery('(min-width: 900px)');
  const visible = twoUp ? [month, addMonths(month, 1)] : [month];
  const lastVisible = visible[visible.length - 1];
  const minMonth = monthOf(today);
  const maxMonth = monthOf(maxDate);

  const [focusDate, setFocusDate] = useState('');
  const wantFocus = useRef(false);
  const rootRef = useRef(null);

  const allDays = visible.flatMap((m) => monthGridMonday(m).flat().filter(Boolean));
  const firstOpen = allDays.find((d) => availableDates.has(d));
  const tabStop = allDays.includes(focusDate) ? focusDate
    : (allDays.includes(selectedDate) ? selectedDate : (firstOpen || (allDays.includes(today) ? today : allDays[0])));

  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    const el = rootRef.current && rootRef.current.querySelector(`[data-date="${tabStop}"]`);
    if (el) el.focus();
  });

  const statusOf = (date) => {
    if (date < today || date > maxDate) return 'unavailable';
    return availableDates.has(date) ? 'available' : 'unavailable';
  };

  const move = (target) => {
    if (target < `${minMonth}-01` || monthOf(target) > maxMonth) return;
    wantFocus.current = true;
    setFocusDate(target);
    if (!allDays.includes(target)) {
      const tm = monthOf(target);
      onMonthChange(tm < month ? tm : addMonths(tm, twoUp ? -1 : 0));
    }
  };

  const onKeyDown = (e, date) => {
    const dow = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
    const keys = {
      ArrowLeft: () => addDays(date, -1), ArrowRight: () => addDays(date, 1), ArrowUp: () => addDays(date, -7), ArrowDown: () => addDays(date, 7),
      Home: () => addDays(date, -dow), End: () => addDays(date, 6 - dow),
      PageUp: () => shiftMonth(date, -1), PageDown: () => shiftMonth(date, 1),
    };
    if (keys[e.key]) { e.preventDefault(); move(keys[e.key]()); }
  };

  const label = (date, status) => {
    const text = status === 'available' ? 'available' : 'not available';
    return `${formatLongDate(date)}, ${text}${date === today ? ', today' : ''}${date === selectedDate ? ', selected' : ''}`;
  };

  return (
    <div className="bk2-cal" ref={rootRef} aria-busy={loading}>
      <button type="button" className="bk2-arrow bk2-arrow-prev" onClick={() => onMonthChange(addMonths(month, -1))} disabled={month <= minMonth} aria-label="Previous month"><ChevronLeft size={20} aria-hidden="true" /></button>
      <button type="button" className="bk2-arrow bk2-arrow-next" onClick={() => onMonthChange(addMonths(month, 1))} disabled={lastVisible >= maxMonth} aria-label="Next month"><ChevronRight size={20} aria-hidden="true" /></button>

      <div className={`bk2-months${twoUp ? ' is-two' : ''}${loading ? ' is-loading' : ''}`}>
        {visible.map((m) => (
          <div className="bk2-month" key={m}>
            <h3 className="bk2-title" aria-live="polite">{monthTitle(m)}</h3>
            <div role="grid" aria-label={`Choose a date in ${monthTitle(m)}`} className="bk2-grid">
              <div role="row" className="bk2-row">
                {WEEKDAYS_MONDAY.map((d) => <div key={d} role="columnheader" className="bk2-dow" aria-label={d}>{d.slice(0, 2)}</div>)}
              </div>
              {monthGridMonday(m).map((week, i) => (
                <div role="row" className="bk2-row" key={i}>
                  {week.map((date, j) => {
                    if (!date) return <div role="gridcell" key={j} className="bk2-cell" />;
                    const status = statusOf(date);
                    const pickable = status === 'available' && !loading;
                    return (
                      <div role="gridcell" key={date} className="bk2-cell">
                        <button
                          type="button" data-date={date} tabIndex={date === tabStop ? 0 : -1}
                          className={`bk2-day is-${status}${date === today ? ' is-today' : ''}${date === selectedDate ? ' is-selected' : ''}`}
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
            </div>
          </div>
        ))}
        {loading && <div className="bk2-loading" role="status"><span className="bk-spinner" aria-hidden="true" />Loading available times…</div>}
      </div>

      {error && <div className="bk-alert" role="alert">{error} <button type="button" className="bk-link" onClick={onRetry}>Try again</button></div>}
    </div>
  );
}
