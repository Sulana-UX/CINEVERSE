import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { formatLKR } from '../../../utils/currency';

const TIER_KEYS = {
  ORCHESTRA: 'orchestra',
  PREMIER: 'premier',
  LOGE: 'loge',
};

function SeatButton({ seat, state, tier, onToggle, arc }) {
  const label =
    state === 'taken'
      ? `Seat ${seat.id}, already booked`
      : `Seat ${seat.id}, ${tier.name}, ${formatLKR(tier.price)}${state === 'selected' ? ', selected' : ''}`;

  return (
    <button
      type="button"
      className={`bk-seat tier-${TIER_KEYS[seat.tier]} is-${state}`}
      style={{ '--arc': arc }}
      disabled={state === 'taken'}
      aria-pressed={state === 'selected'}
      aria-label={label}
      title={state === 'taken' ? `${seat.id} · Booked` : `${seat.id} · ${tier.name} · ${formatLKR(tier.price)}`}
      onClick={() => onToggle(seat)}
    >
      <span className="bk-seat-back" aria-hidden="true" />
      <span className="bk-seat-label" aria-hidden="true">
        {state === 'selected' ? <Check size={12} strokeWidth={3} /> : state === 'taken' ? <X size={11} strokeWidth={2.5} /> : seat.number}
      </span>
    </button>
  );
}

export default function SeatMap({ layout, tiers, takenSeats, selectedSeats, onToggleSeat, loading }) {
  const takenSet = useMemo(() => new Set(takenSeats), [takenSeats]);
  const selectedSet = useMemo(() => new Set(selectedSeats.map((s) => s.id)), [selectedSeats]);

  return (
    <div className={`bk-seatmap ${loading ? 'is-loading' : ''}`}>
      <div className="bk-screen" aria-hidden="true">
        <svg viewBox="0 0 600 60" preserveAspectRatio="none" className="bk-screen-arc">
          <defs>
            <linearGradient id="bkScreenGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F3E5AB" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F3E5AB" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M20 40 Q300 0 580 40 L580 60 Q300 20 20 60 Z" fill="url(#bkScreenGlow)" />
          <path d="M20 40 Q300 0 580 40" stroke="#F3E5AB" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
        <span className="bk-screen-label">Screen</span>
      </div>

      <div className="bk-seat-scroll">
        <div className="bk-seat-rows" role="group" aria-label="Seat selection">
          {layout.map((row, rowIndex) => {
            const tier = tiers[row.tier];
            // Row A is nearest the screen; show a header where each price tier starts.
            const showTierHeader = rowIndex === 0 || layout[rowIndex - 1].tier !== row.tier;
            const numbers = Array.from({ length: row.seats }, (_, i) => i + 1);
            const mid = (row.seats + 1) / 2;
            // Rows curve around the screen: outer seats sit closer to it than the centre.
            const k = row.seats > 8 ? 0.55 : 0.8;
            const arcFor = (n) => `${Math.round(((mid - 1) ** 2 - (n - mid) ** 2) * k)}px`;

            const renderSeat = (n) => {
              const seat = { id: `${row.row}${n}`, row: row.row, number: n, tier: row.tier };
              const state = takenSet.has(seat.id) ? 'taken' : selectedSet.has(seat.id) ? 'selected' : 'available';
              return (
                <SeatButton
                  key={seat.id}
                  seat={seat}
                  state={state}
                  tier={tier}
                  arc={arcFor(n)}
                  onToggle={onToggleSeat}
                />
              );
            };

            return (
              <React.Fragment key={row.row}>
                {showTierHeader && (
                  <div className={`bk-tier-divider tier-${TIER_KEYS[row.tier]}`}>
                    <span className="bk-tier-swatch" />
                    <span className="bk-tier-name">{tier.name}</span>
                    <span className="bk-tier-price">{formatLKR(tier.price)}</span>
                  </div>
                )}
                <div className={`bk-row tier-${TIER_KEYS[row.tier]}`}>
                  <span className="bk-row-label">{row.row}</span>
                  <div className="bk-row-block">{numbers.slice(0, row.aisleAfter).map(renderSeat)}</div>
                  <span className="bk-aisle" aria-hidden="true" />
                  <div className="bk-row-block">{numbers.slice(row.aisleAfter).map(renderSeat)}</div>
                  <span className="bk-row-label">{row.row}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="bk-legend">
        <span className="bk-legend-item">
          <span className="bk-legend-seat is-available" /> Available
        </span>
        <span className="bk-legend-item">
          <span className="bk-legend-seat is-selected" /> Your seats
        </span>
        <span className="bk-legend-item">
          <span className="bk-legend-seat is-taken" /> Booked
        </span>
      </div>
    </div>
  );
}
