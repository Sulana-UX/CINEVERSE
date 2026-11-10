import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { formatLKR } from '../../../utils/currency';

/** Fixed bottom bar on small screens: what you've picked, the total, and the next step. */
export default function MobileCheckoutBar({ selectedSeats, total, action }) {
  if (!action) return null;
  const seatText =
    selectedSeats.length > 0
      ? `${selectedSeats.map((s) => s.id).join(', ')} · ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''}`
      : 'No seats yet';

  return (
    <div className="bk-mobile-bar" role="region" aria-label="Booking total">
      <div className="bk-mobile-info">
        <span className="bk-mobile-seats">{seatText}</span>
        <span className="bk-mobile-total">{formatLKR(total)}</span>
      </div>
      <button
        type="button"
        className="bk-primary-btn"
        onClick={action.onClick}
        disabled={action.disabled || action.busy}
      >
        {action.busy && <Loader2 size={16} className="bk-spin" />}
        <span>{action.shortLabel || action.label}</span>
        {!action.busy && <ArrowRight size={16} />}
      </button>
    </div>
  );
}
