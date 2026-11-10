import React from 'react';
import { ArrowRight, Loader2, Lock, X } from 'lucide-react';
import { formatLKR } from '../../../utils/currency';
import { formatShowDate, formatShowTime } from '../utils/showDates';
import { computeTotals } from '../utils/bookingFlow';

export default function BookingSummary({
  movie,
  date,
  time,
  selectedSeats,
  selectedExtras,
  onRemoveSeat,
  action,
}) {
  const { seatsTotal, extrasTotal, total } = computeTotals(selectedSeats, selectedExtras);
  const extras = Object.values(selectedExtras);

  return (
    <aside className="bk-summary" aria-label="Booking summary">
      <div className="bk-summary-film">
        {movie && (
          <img
            className="bk-summary-poster"
            src={movie.backdrop || '/images/luxury_cinema_interior.jpg'}
            alt=""
          />
        )}
        <div>
          <h3 className="bk-summary-title">{movie?.title || 'Choose a film'}</h3>
          <p className="bk-summary-meta">{movie?.auditorium}</p>
          {date && time && (
            <p className="bk-summary-when">
              {formatShowDate(date)}
              <br />
              {formatShowTime(time)}
            </p>
          )}
        </div>
      </div>

      <div className="bk-summary-block">
        <div className="bk-summary-head">
          <span>Seats</span>
          <span>{selectedSeats.length || '—'}</span>
        </div>
        {selectedSeats.length === 0 ? (
          <p className="bk-muted bk-small">No seats selected yet.</p>
        ) : (
          <ul className="bk-summary-seats">
            {selectedSeats.map((s) => (
              <li key={s.id}>
                <span className="bk-seat-pill">{s.id}</span>
                <span className="bk-summary-tier">{s.tierName}</span>
                <span className="bk-summary-price">{formatLKR(s.price)}</span>
                {onRemoveSeat && (
                  <button type="button" onClick={() => onRemoveSeat(s.id)} aria-label={`Remove seat ${s.id}`}>
                    <X size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {extras.length > 0 && (
        <div className="bk-summary-block">
          <div className="bk-summary-head">
            <span>Extras</span>
          </div>
          <ul className="bk-summary-extras">
            {extras.map((e) => (
              <li key={e.id}>
                <span>
                  {e.name} <span className="bk-muted">× {e.quantity}</span>
                </span>
                <span>{formatLKR(e.price * e.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bk-summary-totals">
        <div>
          <span>Seats</span>
          <span>{formatLKR(seatsTotal)}</span>
        </div>
        {extrasTotal > 0 && (
          <div>
            <span>Extras</span>
            <span>{formatLKR(extrasTotal)}</span>
          </div>
        )}
        <div className="bk-summary-grand">
          <span>Total</span>
          <span>{formatLKR(total)}</span>
        </div>
      </div>

      {action && (
        <div className="bk-summary-action">
          {action.hint && <p className="bk-action-hint">{action.hint}</p>}
          <button
            type="button"
            className="bk-primary-btn"
            onClick={action.onClick}
            disabled={action.disabled || action.busy}
          >
            {action.busy ? <Loader2 size={16} className="bk-spin" /> : action.locked ? <Lock size={15} /> : null}
            <span>{action.label}</span>
            {!action.busy && !action.locked && <ArrowRight size={16} />}
          </button>
        </div>
      )}
    </aside>
  );
}
