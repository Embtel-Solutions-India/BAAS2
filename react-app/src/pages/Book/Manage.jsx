import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import BookingCalendar from '../../components/Booking/BookingCalendar';
import AvailableTimeSlots from '../../components/Booking/AvailableTimeSlots';
import { useConsultationSlots } from '../../components/Booking/useConsultationSlots';
import { SESSION_MINUTES, addMinutesToTime, cancelConsultation, getConfirmation, rescheduleConsultation, slotDate, slotTime } from '../../utils/consultationApi';
import { BUSINESS_TZ, formatLongDate, formatTime, monthOf, todayIn, zoneLabel } from '../../utils/bookingDates';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NO_DATES = new Set();

// Cancel or reschedule a consultation. The booking id comes from the link; the visitor confirms the email they booked
// with, because the booking system checks the two together. Every reply hands back fresh free times.
export default function ManageBooking() {
  const { bookingId } = useParams();
  const [nonce, setNonce] = useState(0);
  const [data, setData] = useState({ key: '', booking: null, error: '' });
  const key = `${bookingId}#${nonce}`;
  const booking = data.booking;
  const error = data.key === key ? data.error : '';
  const loading = data.key !== key && !booking;

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mode, setMode] = useState('view'); // view | cancel | reschedule | done
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const slots = useConsultationSlots(mode === 'reschedule');
  const tz = (booking && booking.timezone) || BUSINESS_TZ;
  const today = useMemo(() => todayIn(tz), [tz]);
  const [month, setMonth] = useState(monthOf(todayIn(BUSINESS_TZ)));
  const [date, setDate] = useState('');
  const [pick, setPick] = useState(null);

  useEffect(() => {
    let alive = true;
    getConfirmation(bookingId).then((r) => {
      if (!alive) return;
      if (r.success) setData({ key, booking: r, error: '' });
      else setData((d) => ({ ...d, key, error: r.httpStatus === 404 ? 'We could not find this booking. Check the link in your confirmation email.' : r.message }));
    });
    return () => { alive = false; };
  }, [bookingId, nonce, key]);

  const daySlots = useMemo(() => (slots.byDate.get(date) || []).map((iso) => ({ startTime: slotTime(iso), endTime: addMinutesToTime(slotTime(iso), SESSION_MINUTES), available: true, iso })), [slots.byDate, date]);

  const needEmail = () => {
    if (!EMAIL_RE.test(email.trim())) { setEmailError('Enter the email address you used to book.'); return false; }
    setEmailError(''); return true;
  };

  const run = async (fn, onOk) => {
    if (sending.current || !needEmail()) return;
    sending.current = true; setBusy(true); setMessage({ type: '', text: '' });
    try {
      const r = await fn();
      if (Array.isArray(r.days)) slots.replace(r.days);
      if (r.success) onOk(r);
      else setMessage({ type: 'error', text: r.message });
    } finally { sending.current = false; setBusy(false); }
  };

  const doCancel = () => run(() => cancelConsultation(bookingId, email.trim()), (r) => {
    setData((d) => ({ ...d, booking: { ...d.booking, status: 'cancelled', meeting_link: '' } }));
    setMessage({ type: 'ok', text: r.message }); setMode('done');
  });
  const doReschedule = () => run(() => rescheduleConsultation(bookingId, email.trim(), pick.iso), (r) => {
    setData((d) => ({ ...d, booking: { ...d.booking, status: 'booked', start_time: r.appointment_start, end_time: `${slotDate(r.appointment_start)}T${addMinutesToTime(slotTime(r.appointment_start), SESSION_MINUTES)}:00`, meeting_link: r.meeting_link || d.booking.meeting_link } }));
    setMessage({ type: 'ok', text: r.message }); setMode('done'); setPick(null);
  });

  const when = booking && booking.start_time ? { date: slotDate(booking.start_time), start: slotTime(booking.start_time) } : null;
  const active = booking && booking.status === 'booked';

  return (
    <>
      <SEOHead title="Manage your consultation | Bay Area Accounting Solutions" description="Reschedule or cancel your free consultation." url={`https://bayareaaccountingsolutions.com/book/manage/${bookingId}`} type="website" noindex />
      <section className="section" style={{ paddingTop: 'clamp(120px,12vw,160px)' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div className="tc" style={{ marginBottom: '28px' }}>
            <div className="slabel">Your consultation</div>
            <h1 className="stitle">Manage your booking</h1>
          </div>

          {loading && <div className="bk-card"><div className="bk-loading-inline" role="status"><span className="bk-spinner" aria-hidden="true" />Loading your booking…</div></div>}
          {!loading && error && !booking && (
            <div className="bk-card">
              <div className="bk-alert" role="alert">{error} <button type="button" className="bk-link" onClick={() => setNonce((n) => n + 1)}>Try again</button></div>
              <p style={{ marginTop: '14px' }}><Link to="/book" className="btn-p">Book a consultation</Link></p>
            </div>
          )}

          {booking && (
            <div className="bk-card">
              {message.text && <div className={message.type === 'ok' ? 'bk-ok' : 'bk-alert'} role={message.type === 'ok' ? 'status' : 'alert'}>{message.text}</div>}
              <dl className="bk-summary bk-summary-lg">
                <div><dt>Booking ID</dt><dd>{booking.booking_id}</dd></div>
                <div><dt>Status</dt><dd style={{ textTransform: 'capitalize' }}>{booking.status}</dd></div>
                {when && <div><dt>Date</dt><dd>{formatLongDate(when.date)}</dd></div>}
                {when && <div><dt>Time</dt><dd>{formatTime(when.start)} – {formatTime(addMinutesToTime(when.start, SESSION_MINUTES))} ({zoneLabel(when.date, tz)})</dd></div>}
                {booking.name && <div><dt>Name</dt><dd>{booking.name}</dd></div>}
                {active && booking.meeting_link && <div><dt>Meeting link</dt><dd><a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{booking.meeting_link}</a></dd></div>}
              </dl>

              {!active && <p className="bk-note">{booking.status === 'cancelled' ? 'This consultation was cancelled.' : `This consultation is ${booking.status}.`} <Link to="/book">Book a new time</Link></p>}

              {active && mode !== 'done' && (
                <div className="bk-field" style={{ maxWidth: '420px' }}>
                  <label htmlFor="mg_email">Confirm your email to make changes</label>
                  <input id="mg_email" type="email" autoComplete="email" className={`form-input${emailError ? ' input-invalid' : ''}`} value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }} placeholder="The email you booked with" aria-invalid={!!emailError} aria-describedby={emailError ? 'mg_email_err' : undefined} />
                  {emailError && <div className="field-error" id="mg_email_err" role="alert">{emailError}</div>}
                </div>
              )}

              {active && mode === 'view' && (
                <div className="bk-confirm-actions" style={{ justifyContent: 'flex-start' }}>
                  <button type="button" className="btn-p" onClick={() => { setMode('reschedule'); setMessage({ type: '', text: '' }); }}>Reschedule</button>
                  <button type="button" className="btn-g" onClick={() => { setMode('cancel'); setMessage({ type: '', text: '' }); }}>Cancel consultation</button>
                </div>
              )}

              {mode === 'cancel' && (
                <div className="bk-confirm-box" role="alertdialog" aria-label="Confirm cancellation">
                  <p><strong>Cancel this consultation?</strong> The time will be released for other visitors.</p>
                  <div className="bk-confirm-actions" style={{ justifyContent: 'flex-start' }}>
                    <button type="button" className="btn-p" onClick={doCancel} disabled={busy}>{busy ? 'Cancelling…' : 'Yes, cancel it'}</button>
                    <button type="button" className="btn-g" onClick={() => setMode('view')} disabled={busy}>Keep my consultation</button>
                  </div>
                </div>
              )}

              {mode === 'reschedule' && (
                <div>
                  <h2 className="bk-panel-title" style={{ marginTop: '8px' }}>Choose a new time</h2>
                  {slots.error && <div className="bk-alert" role="alert">{slots.error} <button type="button" className="bk-link" onClick={slots.reload}>Try again</button></div>}
                  <div className="bk-layout">
                    <div>
                      <BookingCalendar month={month} onMonthChange={setMonth} selectedDate={date} onSelect={(d) => { setDate(d); setPick(null); }} today={today} maxDate={slots.lastDate || today}
                        availableDates={slots.availableDates} fullyBookedDates={NO_DATES} loading={slots.loading} error="" onRetry={slots.reload} />
                    </div>
                    <div>
                      <AvailableTimeSlots date={date} loading={false} error="" slots={daySlots} reason="" selectedTime={pick && pick.startTime}
                        onSelect={(s) => setPick(s)} onRetry={slots.reload} zoneLabel={date ? zoneLabel(date, tz) : 'Los Angeles time'} />
                      {pick && <p className="bk-note" style={{ marginTop: '14px' }}>New time: <strong>{formatLongDate(date)}, {formatTime(pick.startTime)}</strong></p>}
                    </div>
                  </div>
                  <div className="bk-confirm-actions" style={{ justifyContent: 'flex-start' }}>
                    <button type="button" className="btn-p" onClick={doReschedule} disabled={!pick || busy}>{busy ? 'Saving…' : 'Confirm new time'}</button>
                    <button type="button" className="btn-g" onClick={() => { setMode('view'); setMessage({ type: '', text: '' }); }} disabled={busy}>Back</button>
                  </div>
                </div>
              )}

              {mode === 'done' && <p className="bk-note"><Link to="/">Back to home</Link></p>}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
