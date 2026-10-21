import React from 'react';
import { SEAT_TIERS } from '../data/mockCinemaData';

export default function SeatMap({
  seatGrid,
  selectedSeats,
  onToggleSeat,
}) {
  const isSelected = (seatId) => selectedSeats.some((s) => s.id === seatId);

  return (
    <div className="seatmap-container">
      {/* Curved Architectural Cinema Screen */}
      <div className="seat-screen-container">
        <div className="seat-screen-curve">
          <div className="seat-screen-light-beam" />
        </div>
        <div className="seat-screen-caption">
          <span className="screen-caption-dot" />
          <span>70MM CURVED ARCHITECTURAL PROJECTION SURFACE</span>
          <span className="screen-caption-dot" />
        </div>
      </div>

      {/* Seating Grid */}
      <div className="seat-grid-layout">
        {seatGrid.map((rowItem) => {
          const tierInfo = SEAT_TIERS[rowItem.tier];

          return (
            <div key={rowItem.row} className="seat-row">
              {/* Row Label Left */}
              <span className="seat-row-label">{rowItem.row}</span>

              {/* Left Wing (Seats 1-4) */}
              <div className="seat-wing left-wing">
                {rowItem.seats.slice(0, 4).map((seatNum) => {
                  const seatId = `${rowItem.row}${seatNum}`;
                  const isReserved = rowItem.reserved.includes(seatNum);
                  const selected = isSelected(seatId);

                  return (
                    <button
                      key={seatId}
                      type="button"
                      disabled={isReserved}
                      onClick={() =>
                        onToggleSeat({
                          id: seatId,
                          row: rowItem.row,
                          number: seatNum,
                          tier: rowItem.tier,
                          tierName: tierInfo.name,
                          price: tierInfo.price,
                        })
                      }
                      className={`seat-btn tier-${rowItem.tier.toLowerCase()} ${
                        isReserved ? 'reserved' : ''
                      } ${selected ? 'selected' : ''}`}
                      title={`${seatId} • ${tierInfo.name} ($${tierInfo.price})`}
                      aria-label={`Seat ${seatId}, ${tierInfo.name}, $${tierInfo.price}`}
                    >
                      <svg
                        className="seat-svg"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Recliner Base & Cushion */}
                        <path
                          d="M8 8C8 5.79086 9.79086 4 12 4H20C22.2091 4 24 5.79086 24 8V22C24 24.2091 22.2091 26 20 26H12C9.79086 26 8 24.2091 8 22V8Z"
                          className="seat-cushion"
                        />
                        {/* Left Armrest */}
                        <rect
                          x="3"
                          y="10"
                          width="4"
                          height="14"
                          rx="2"
                          className="seat-armrest"
                        />
                        {/* Right Armrest */}
                        <rect
                          x="25"
                          y="10"
                          width="4"
                          height="14"
                          rx="2"
                          className="seat-armrest"
                        />
                      </svg>
                      <span className="seat-number-text">{seatNum}</span>
                    </button>
                  );
                })}
              </div>

              {/* Center Aisle */}
              <div className="seat-center-aisle" aria-hidden="true" />

              {/* Right Wing (Seats 5-8) */}
              <div className="seat-wing right-wing">
                {rowItem.seats.slice(4, 8).map((seatNum) => {
                  const seatId = `${rowItem.row}${seatNum}`;
                  const isReserved = rowItem.reserved.includes(seatNum);
                  const selected = isSelected(seatId);

                  return (
                    <button
                      key={seatId}
                      type="button"
                      disabled={isReserved}
                      onClick={() =>
                        onToggleSeat({
                          id: seatId,
                          row: rowItem.row,
                          number: seatNum,
                          tier: rowItem.tier,
                          tierName: tierInfo.name,
                          price: tierInfo.price,
                        })
                      }
                      className={`seat-btn tier-${rowItem.tier.toLowerCase()} ${
                        isReserved ? 'reserved' : ''
                      } ${selected ? 'selected' : ''}`}
                      title={`${seatId} • ${tierInfo.name} ($${tierInfo.price})`}
                      aria-label={`Seat ${seatId}, ${tierInfo.name}, $${tierInfo.price}`}
                    >
                      <svg
                        className="seat-svg"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 8C8 5.79086 9.79086 4 12 4H20C22.2091 4 24 5.79086 24 8V22C24 24.2091 22.2091 26 20 26H12C9.79086 26 8 24.2091 8 22V8Z"
                          className="seat-cushion"
                        />
                        <rect
                          x="3"
                          y="10"
                          width="4"
                          height="14"
                          rx="2"
                          className="seat-armrest"
                        />
                        <rect
                          x="25"
                          y="10"
                          width="4"
                          height="14"
                          rx="2"
                          className="seat-armrest"
                        />
                      </svg>
                      <span className="seat-number-text">{seatNum}</span>
                    </button>
                  );
                })}
              </div>

              {/* Row Label Right */}
              <span className="seat-row-label">{rowItem.row}</span>
            </div>
          );
        })}
      </div>

      {/* Luxury Legend */}
      <div className="seat-legend-bar">
        <div className="legend-group">
          <div className="legend-item">
            <span className="legend-sample available" />
            <span>Available</span>
          </div>
          <div className="legend-item">
            <span className="legend-sample selected" />
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <span className="legend-sample reserved" />
            <span>Reserved</span>
          </div>
        </div>

        <div className="legend-separator" />

        <div className="legend-group">
          <div className="legend-item">
            <span className="legend-badge loge" />
            <span>Royal Loge ($48)</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge premier" />
            <span>Premier Velvet ($36)</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge orchestra" />
            <span>Orchestra ($26)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
