import React from 'react';
import { ShieldCheck, ChevronRight, X, Ticket, Lock, Sparkles } from 'lucide-react';

export default function BookingSummaryBar({
  movie,
  date,
  time,
  selectedSeats,
  onRemoveSeat,
  selectedAddons,
  onConfirmBooking,
  user,
}) {
  const seatsTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const addonsTotal = Object.values(selectedAddons).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const grandTotal = seatsTotal + addonsTotal;
  const hasSeats = selectedSeats.length > 0;
  const isAuthenticated = Boolean(user);

  return (
    <div className="booking-summary-panel">
      <div className="summary-header">
        <Ticket size={18} className="gold-icon" />
        <h3 className="summary-title">Reservation Order Summary</h3>
      </div>

      {/* Movie & Showtime Recap */}
      <div className="summary-screening-recap">
        <span className="recap-movie">{movie.title}</span>
        <span className="recap-auditorium">{movie.auditorium}</span>
        <span className="recap-datetime">
          {date.full} • {time}
        </span>
      </div>

      {/* Selected Seats */}
      <div className="summary-seats-section">
        <div className="summary-section-label">
          <span>Selected Recliners</span>
          <span className="seat-count-tag">{selectedSeats.length} Reserved</span>
        </div>

        {hasSeats ? (
          <div className="summary-seats-list">
            {selectedSeats.map((seat) => (
              <div key={seat.id} className="summary-seat-pill">
                <div className="seat-pill-info">
                  <span className="seat-pill-code">{seat.id}</span>
                  <span className="seat-pill-tier">{seat.tierName}</span>
                </div>
                <span className="seat-pill-price">${seat.price}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSeat(seat.id)}
                  className="seat-remove-btn"
                  title="Remove seat"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="summary-seats-empty">
            <span>Please select one or more seats on the auditorium chart.</span>
          </div>
        )}
      </div>

      {/* Selected Add-ons */}
      {Object.values(selectedAddons).some((a) => a.quantity > 0) && (
        <div className="summary-addons-section">
          <span className="summary-section-label">Concierge In-Seat Dining</span>
          <div className="summary-addons-list">
            {Object.values(selectedAddons)
              .filter((a) => a.quantity > 0)
              .map((addon) => (
                <div key={addon.id} className="summary-addon-row">
                  <span className="addon-name">
                    {addon.name} <small>×{addon.quantity}</small>
                  </span>
                  <span className="addon-price">
                    ${addon.price * addon.quantity}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Price Calculations */}
      <div className="summary-pricing-breakdown">
        <div className="pricing-row">
          <span>Seats Subtotal</span>
          <span>${seatsTotal}</span>
        </div>
        {addonsTotal > 0 && (
          <div className="pricing-row">
            <span>Concierge Services</span>
            <span>${addonsTotal}</span>
          </div>
        )}
        <div className="pricing-row complimentary">
          <span>Concierge Booking Fee</span>
          <span className="complimentary-text">COMPLIMENTARY</span>
        </div>
        <div className="pricing-divider" />
        <div className="pricing-row total-row">
          <span className="total-label">Grand Total</span>
          <span className="total-amount">${grandTotal}</span>
        </div>
      </div>

      {/* Security / Member note */}
      <div className={`summary-security-note ${!isAuthenticated ? 'auth-required-note' : ''}`}>
        {isAuthenticated ? (
          <>
            <ShieldCheck size={14} className="gold-icon" />
            <span>Secured for Member: {user.user_metadata?.full_name || user.email}</span>
          </>
        ) : (
          <>
            <Lock size={14} className="gold-icon" />
            <span>Patron sign-in required to confirm reservation</span>
          </>
        )}
      </div>

      {/* Action Button */}
      <button
        type="button"
        disabled={!hasSeats}
        onClick={onConfirmBooking}
        className={`summary-checkout-btn ${!isAuthenticated ? 'needs-auth' : ''}`}
      >
        {!isAuthenticated ? (
          <>
            <Lock size={15} />
            <span>SIGN IN TO RESERVE SEATS</span>
            <ChevronRight size={16} />
          </>
        ) : (
          <>
            <Sparkles size={15} />
            <span>CONFIRM PRIVATE RESERVATION</span>
            <ChevronRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
