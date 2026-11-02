import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { formatLongDate, formatTime, zoneLabel } from '../../utils/bookingDates';

// Shown only after the server has confirmed the booking.
export default function BookingConfirmation({ booking, accessToken, heading = 'Your appointment is confirmed', note, onBookAnother }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);
  const manage = accessToken ? `/book/manage/${encodeURIComponent(booking.reference)}?token=${encodeURIComponent(accessToken)}` : '';
  return (
    <div className="bk-confirm" role="status">
      <CheckCircle2 size={44} className="bk-confirm-icon" aria-hidden="true" />
      <h2 className="serif" tabIndex={-1} ref={ref}>{heading}</h2>
      <p className="bk-confirm-ref">Booking reference <strong>{booking.reference}</strong></p>
      <dl className="bk-summary bk-summary-lg">
        <div><dt>Name</dt><dd>{booking.name}</dd></div>
        <div><dt>Date</dt><dd>{formatLongDate(booking.date)}</dd></div>
        <div><dt>Time</dt><dd>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</dd></div>
        <div><dt>Time zone</dt><dd>{zoneLabel(booking.date, booking.timezone)}</dd></div>
        <div><dt>Appointment</dt><dd>{booking.appointmentTypeLabel || booking.appointmentType}</dd></div>
        <div><dt>Status</dt><dd style={{ textTransform: 'capitalize' }}>{booking.status.replace('_', ' ')}</dd></div>
      </dl>
      <p className="bk-note">{note || `We sent a confirmation to ${booking.email}. Keep your reference number handy.`}</p>
      <div className="bk-confirm-actions">
        {manage && <Link to={manage} className="btn-g">Cancel or reschedule</Link>}
        {onBookAnother && <button type="button" className="btn-g" onClick={onBookAnother}>Book another time</button>}
        <Link to="/" className="btn-p">Back to home</Link>
      </div>
    </div>
  );
}
