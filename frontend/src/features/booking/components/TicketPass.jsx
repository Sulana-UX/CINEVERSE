import React from 'react';
import { Film, Printer, Sparkles } from 'lucide-react';
import { formatLKR } from '../../../utils/currency';
import { formatShowDate, formatShowTime } from '../utils/showDates';

/** Printable e-ticket for a confirmed booking (shape from bookingApi.getBooking). */
export default function TicketPass({ booking }) {
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(
    booking.refCode
  )}&color=d4af37&bgcolor=0b0b0b`;

  return (
    <div className="bk-ticket">
      <div className="bk-ticket-main">
        <div className="bk-ticket-brand">
          <Film size={15} /> CINEVERSE
          <span className="bk-ticket-badge">E-TICKET</span>
        </div>
        <h2 className="bk-ticket-title">{booking.movieTitle}</h2>
        <p className="bk-ticket-sub">
          {[booking.format, booking.auditorium].filter(Boolean).join(' · ')}
        </p>

        <dl className="bk-ticket-grid">
          <div>
            <dt>Date</dt>
            <dd>{formatShowDate(booking.showDate)}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{formatShowTime(booking.showTime)}</dd>
          </div>
          <div>
            <dt>Seats</dt>
            <dd className="bk-gold">{booking.seats.join(', ')}</dd>
          </div>
          <div>
            <dt>Guest</dt>
            <dd>{booking.guestName}</dd>
          </div>
          <div>
            <dt>Paid</dt>
            <dd>{formatLKR(booking.totalAmount)}</dd>
          </div>
        </dl>

        {booking.addons?.length > 0 && (
          <div className="bk-ticket-extras">
            <Sparkles size={12} />
            {booking.addons.map((a) => `${a.name} × ${a.quantity}`).join(' · ')}
          </div>
        )}
      </div>

      <div className="bk-ticket-stub">
        <img src={qr} alt={`QR code for booking ${booking.refCode}`} width="132" height="132" />
        <span className="bk-ticket-ref-label">Booking reference</span>
        <span className="bk-ticket-ref">{booking.refCode}</span>
        <button type="button" className="bk-ghost-btn bk-no-print" onClick={() => window.print()}>
          <Printer size={14} /> Print ticket
        </button>
      </div>
    </div>
  );
}
