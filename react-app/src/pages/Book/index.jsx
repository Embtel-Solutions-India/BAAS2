import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import SEOHead from '../../components/SEO/SEOHead';
import { SITE_URL, breadcrumbSchema } from '../../components/SEO/seoConfig';
import DualCalendar from '../../components/Booking/DualCalendar';
import BookingStepBar from '../../components/Booking/BookingStepBar';
import AvailableTimeSlots from '../../components/Booking/AvailableTimeSlots';
import ConsultationForm from '../../components/Booking/ConsultationForm';
import { useConsultationSlots } from '../../components/Booking/useConsultationSlots';
import { SESSION_MINUTES, addMinutesToTime, slotDate, slotTime } from '../../utils/consultationApi';
import { BUSINESS_TZ, formatLongDate, formatPillDate, formatTime, monthOf, todayIn, zoneLabel } from '../../utils/bookingDates';

const SCHEMA = breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Book a Free Consultation', path: '/book' }]);

// The build-time prerender runs in a headless browser with no API behind it; it should only capture the page shell.
const isPrerender = typeof window !== 'undefined' && window.__BAAS_PRERENDER__ === true;

const PARTS = [['all', 'All day'], ['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening']];
const partOf = (hhmm) => (hhmm < '12:00' ? 'morning' : hhmm < '17:00' ? 'afternoon' : 'evening');

// Free 30-minute consultation booking in three steps (date, time, details), driven by the pill bar on top.
// The free times come from the booking system through our server and are refreshed every 10 minutes; booking,
// cancelling and rescheduling hand back a fresh list, which replaces the old one.
export default function Book() {
  const navigate = useNavigate();
  const slots = useConsultationSlots(!isPrerender);
  const tz = slots.timezone || BUSINESS_TZ;
  const today = useMemo(() => todayIn(tz), [tz]);
  const maxDate = slots.lastDate || today;

  const [month, setMonth] = useState(monthOf(todayIn(BUSINESS_TZ)));
  const [step, setStep] = useState('date'); // date | time | details
  const [selectedDate, setSelectedDate] = useState('');
  const [slot, setSlot] = useState(null); // { date, startTime, endTime, iso }
  const [part, setPart] = useState('all');
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState({}); // what the visitor typed, kept if they have to pick another time
  const [done, setDone] = useState(null); // a booking confirmed without a booking id (see onResult)

  useEffect(() => {
    if (isPrerender) return;
    try { if (typeof window.gtag === 'function') window.gtag('event', 'view_booking_page', { referrer: document.referrer || 'direct' }); } catch { /* analytics must never break the page */ }
  }, []);

  // Jump the calendar to the first month that has a free time, once, when the list first arrives.
  const firstDate = useMemo(() => [...slots.availableDates].sort()[0] || '', [slots.availableDates]);
  const [jumped, setJumped] = useState(false);
  if (!jumped && firstDate) { setJumped(true); if (monthOf(firstDate) !== month) setMonth(monthOf(firstDate)); }

  const daySlots = useMemo(() => (slots.byDate.get(selectedDate) || []).map((iso) => ({
    startTime: slotTime(iso), endTime: addMinutesToTime(slotTime(iso), SESSION_MINUTES), available: true, iso,
  })), [slots.byDate, selectedDate]);
  const shownSlots = part === 'all' ? daySlots : daySlots.filter((s) => partOf(s.startTime) === part);

  const pickDate = (date) => { setSelectedDate(date); setSlot(null); setPart('all'); setNotice(''); setStep('time'); };
  const pickSlot = (s) => { setSlot({ date: slotDate(s.iso), startTime: s.startTime, endTime: s.endTime, iso: s.iso }); setNotice(''); setStep('details'); };
  const earliest = () => { if (firstDate) { setMonth(monthOf(firstDate)); pickDate(firstDate); } };
  const clear = (id) => {
    if (id === 'date') { setSelectedDate(''); setSlot(null); setStep('date'); } else { setSlot(null); setStep('time'); }
  };

  // The booking system answered. Success -> confirmation page. Otherwise (for example "that time was just taken")
  // keep what was typed, show the message, and return to the times using the fresh list it sent back.
  const onResult = (res, values) => {
    setSaved(values);
    if (Array.isArray(res.days)) slots.replace(res.days);
    // Booked, but the booking system gave no id to build a confirmation link from: confirm on this page instead.
    if (res.success && !res.booking_id) { setDone(res); return; }
    if (res.success && res.booking_id) { navigate(`/book/confirmation/${encodeURIComponent(res.booking_id)}`, { state: { booking: res } }); return; }
    if (res.httpStatus === 200 || res.httpStatus === 409) { setSlot(null); setStep(selectedDate ? 'time' : 'date'); setNotice(res.message); }
  };

  const unavailable = !slots.loading && !slots.error && slots.availableDates.size === 0 && !isPrerender;
  const action = step === 'date'
    ? { label: 'Next', disabled: !selectedDate, onClick: () => setStep('time') }
    : step === 'time'
      ? { label: 'Next', disabled: !slot, onClick: () => setStep('details') }
      : { label: 'Book session', final: true, disabled: false, onClick: () => { const f = document.getElementById('consult-form'); if (f) f.requestSubmit(); } };

  return (
    <>
      <SEOHead
        title="Book a Free Consultation | Bay Area Accounting Solutions"
        description="Pick a time for a free 30-minute clarity session with Bay Area Accounting Solutions. We answer your questions and recommend exactly what you need."
        url={`${SITE_URL}/book`}
        type="website"
        structuredData={SCHEMA}
      />
      <section className="section" style={{ paddingTop: 'clamp(120px,12vw,160px)' }}>
        <div className="container" style={{ maxWidth: '1100px' }}>
          <div className="tc" style={{ marginBottom: '32px' }}>
            <div className="slabel">Free clarity session</div>
            <h1 className="stitle">Schedule an appointment</h1>
            <p className="ssub">Choose a convenient date and time to book your free 30-minute consultation. Times are shown in Los Angeles time (Pacific).</p>
          </div>

          {done ? (
            <div className="bk-card">
              <div className="bk-confirm" role="status">
                <CheckCircle2 size={44} className="bk-confirm-icon" aria-hidden="true" />
                <h2 className="serif" tabIndex={-1} ref={(el) => { if (el) el.focus(); }}>Your consultation is booked</h2>
                <dl className="bk-summary bk-summary-lg">
                  <div><dt>Date</dt><dd>{formatLongDate(slotDate(done.appointment_start))}</dd></div>
                  <div><dt>Time</dt><dd>{formatTime(slotTime(done.appointment_start))} – {formatTime(addMinutesToTime(slotTime(done.appointment_start), SESSION_MINUTES))}</dd></div>
                  <div><dt>Time zone</dt><dd>{zoneLabel(slotDate(done.appointment_start), tz)}</dd></div>
                  <div><dt>Session</dt><dd>Free 1-to-1 Session (30 minutes)</dd></div>
                </dl>
                <p className="bk-note">{done.message} If it has not arrived within a few minutes, please call <a href="tel:+15109627300">(510) 962-7300</a>.</p>
                <div className="bk-confirm-actions">
                  <button type="button" className="btn-g" onClick={() => { setDone(null); setSlot(null); setStep('date'); setSelectedDate(''); setSaved({}); }}>Book another time</button>
                  <Link to="/" className="btn-p">Back to home</Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {slots.error && (
                <div className="bk-alert" role="alert" style={{ marginBottom: '16px' }}>
                  {slots.error} <button type="button" className="bk-link" onClick={slots.reload}>Try again</button>
                </div>
              )}
              {unavailable && <div className="bk-alert" role="status" style={{ marginBottom: '16px' }}>No times are open right now. Please check back soon or call <a href="tel:+15109627300">(510) 962-7300</a>.</div>}
              {notice && <div className="bk-alert" role="alert" style={{ marginBottom: '16px' }}>{notice}</div>}

              <BookingStepBar
                step={step} onStep={setStep} onClear={clear} action={action}
                dateText={selectedDate ? formatPillDate(selectedDate) : ''}
                timeText={slot ? formatTime(slot.startTime) : ''}
                detailsText={[saved.first_name, saved.last_name].filter(Boolean).join(' ')}
              />

              <div className="bk2-panel" aria-live="polite">
                {step === 'date' && (
                  <>
                    <DualCalendar
                      month={month} onMonthChange={setMonth} selectedDate={selectedDate} onSelect={pickDate}
                      today={today} maxDate={maxDate} availableDates={slots.availableDates}
                      loading={!slots.error && (isPrerender || slots.loading)} error="" onRetry={slots.reload}
                    />
                    <div className="bk2-chips">
                      <button type="button" className="bk2-chip is-on" onClick={earliest} disabled={!firstDate}>Earliest available</button>
                      <span className="bk2-hint">All times are Los Angeles time (Pacific).</span>
                    </div>
                  </>
                )}

                {step === 'time' && selectedDate && (
                  <div className="bk2-timewrap">
                    <AvailableTimeSlots
                      date={selectedDate} loading={false} error="" slots={shownSlots} reason="" selectedTime={slot && slot.startTime}
                      onSelect={pickSlot} onRetry={slots.reload} zoneLabel={zoneLabel(selectedDate, tz)}
                    />
                    {daySlots.length > 0 && shownSlots.length === 0 && <div className="bk-empty"><p>No {part} times on this day. Try another time of day.</p></div>}
                    <div className="bk2-chips" role="group" aria-label="Time of day">
                      {PARTS.map(([id, text]) => (
                        <button key={id} type="button" className={`bk2-chip${part === id ? ' is-on' : ''}`} aria-pressed={part === id} onClick={() => setPart(id)}>{text}</button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 'details' && slot && (
                  <div className="bk2-formwrap">
                    <ConsultationForm
                      slot={slot} zoneLabel={zoneLabel(slot.date, tz)} initialValues={saved} onValuesChange={setSaved}
                      onBack={() => setStep('time')} onResult={onResult}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <p className="tc" style={{ marginTop: '22px', fontSize: '14px', color: 'var(--td)' }}>
            Prefer to talk? Call <a href="tel:+15109627300" style={{ color: 'var(--accent)' }}>(510) 962-7300</a>.
          </p>
          <noscript><p className="tc">Online booking needs JavaScript. Please call <a href="tel:+15109627300">(510) 962-7300</a> to book.</p></noscript>
        </div>
      </section>
    </>
  );
}
