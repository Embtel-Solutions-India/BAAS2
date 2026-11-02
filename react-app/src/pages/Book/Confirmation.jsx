import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import SEOHead from '../../components/SEO/SEOHead';
import { SESSION_MINUTES, addMinutesToTime, getConfirmation, slotDate, slotTime } from '../../utils/consultationApi';
import { BUSINESS_TZ, formatLongDate, formatTime, zoneLabel } from '../../utils/bookingDates';

const STATUS_TEXT = {
  booked: ['Your consultation is booked', 'We look forward to speaking with you. Your confirmation email has the details.'],
  cancelled: ['This consultation was cancelled', 'You are welcome to book a new time whenever you are ready.'],
  completed: ['This consultation took place', 'Thank you for meeting with us. Get in touch any time if you need anything else.'],
  missed: ['We missed you', 'This consultation was not attended. You can book a new time below.'],
};

// Confirmation page for /book/confirmation/:bookingId. It always asks the booking system for the latest details, so a
// refreshed page, or a link opened later from an email, shows the real status (booked, cancelled, completed, missed).
export default function BookingConfirmationPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const justBooked = location.state && location.state.booking;
  const [nonce, setNonce] = useState(0);
  const [res, setRes] = useState({ key: '', data: null, error: '' });
  const key = `${bookingId}#${nonce}`;
  const headingRef = useRef(null);

  useEffect(() => {
    let alive = true;
    getConfirmation(bookingId).then((r) => {
      if (!alive) return;
      if (r.success) setRes({ key, data: r, error: '' });
      else setRes({ key, data: null, error: r.httpStatus === 404 ? 'We could not find this booking. Check the link in your confirmation email.' : r.message });
    });
    return () => { alive = false; };
  }, [bookingId, nonce, key]);

  // While the lookup runs, show what the booking call just returned (if we arrived from the booking form).
  const fresh = res.key === key;
  const data = fresh ? res.data : null;
  const early = !data && justBooked && justBooked.booking_id === bookingId
    ? { status: 'booked', start_time: justBooked.appointment_start, meeting_link: justBooked.meeting_link, timezone: justBooked.timezone } : null;
  const b = data || early;
  const error = fresh ? res.error : '';
  const loading = !fresh && !early;

  useEffect(() => { if (b && headingRef.current) headingRef.current.focus(); }, [!!b]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = b && STATUS_TEXT[b.status] ? b.status : 'booked';
  const tz = (b && b.timezone) || BUSINESS_TZ;
  const day = b && b.start_time ? slotDate(b.start_time) : '';
  const start = b && b.start_time ? slotTime(b.start_time) : '';
  const end = b && b.end_time ? slotTime(b.end_time) : (start ? addMinutesToTime(start, SESSION_MINUTES) : '');

  return (
    <>
      <SEOHead title="Your consultation | Bay Area Accounting Solutions" description="Details of your free consultation." url={`https://bayareaaccountingsolutions.com/book/confirmation/${bookingId}`} type="website" noindex />
      <section className="section" style={{ paddingTop: 'clamp(120px,12vw,160px)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <div className="bk-card">
            {loading && <div className="bk-loading-inline" role="status"><span className="bk-spinner" aria-hidden="true" />Loading your booking…</div>}
            {error && !b && (
              <>
                <div className="bk-alert" role="alert">{error} <button type="button" className="bk-link" onClick={() => setNonce((n) => n + 1)}>Try again</button></div>
                <p style={{ marginTop: '14px' }}><Link to="/book" className="btn-p">Book a consultation</Link></p>
              </>
            )}
            {b && (
              <div className="bk-confirm" role="status">
                <CheckCircle2 size={44} className="bk-confirm-icon" aria-hidden="true" style={status === 'booked' ? undefined : { color: 'var(--td)' }} />
                <h1 className="serif" tabIndex={-1} ref={headingRef} style={{ fontSize: '30px', margin: '0 0 6px', fontWeight: 400 }}>{STATUS_TEXT[status][0]}</h1>
                <p className="bk-confirm-ref">Booking ID <strong>{bookingId}</strong></p>
                <dl className="bk-summary bk-summary-lg">
                  {b.name && <div><dt>Name</dt><dd>{b.name}</dd></div>}
                  {day && <div><dt>Date</dt><dd>{formatLongDate(day)}</dd></div>}
                  {start && <div><dt>Time</dt><dd>{formatTime(start)} – {formatTime(end)}</dd></div>}
                  {day && <div><dt>Time zone</dt><dd>{zoneLabel(day, tz)}</dd></div>}
                  <div><dt>Session</dt><dd>Free 1-to-1 Session (30 minutes)</dd></div>
                  <div><dt>Status</dt><dd style={{ textTransform: 'capitalize' }}>{status}</dd></div>
                </dl>
                {status === 'booked' && b.meeting_link && (
                  <p style={{ margin: '14px 0' }}><a href={b.meeting_link} target="_blank" rel="noopener noreferrer" className="btn-p">Open meeting link</a></p>
                )}
                <p className="bk-note">{STATUS_TEXT[status][1]}</p>
                <div className="bk-confirm-actions">
                  {status === 'booked' && <Link to={`/book/manage/${encodeURIComponent(bookingId)}`} className="btn-g">Reschedule or cancel</Link>}
                  {status !== 'booked' && <Link to="/book" className="btn-g">Book a new time</Link>}
                  <Link to="/" className="btn-p">Back to home</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
