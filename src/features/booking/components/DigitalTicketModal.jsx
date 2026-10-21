import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X, Download, Film, Sparkles } from 'lucide-react';

export default function DigitalTicketModal({
  booking,
  onClose,
}) {
  if (!booking) return null;

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="ticket-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ticket-modal-card">
            <button
              type="button"
              onClick={onClose}
              className="ticket-modal-close-btn"
              aria-label="Close pass"
            >
              <X size={18} />
            </button>

            {/* Confirmation Banner */}
            <div className="ticket-success-badge">
              <CheckCircle2 size={18} className="gold-icon" />
              <span>PRIVATE RESERVATION CONFIRMED</span>
            </div>

            {/* Royal Cinema Ticket Pass */}
            <div className="cinema-pass-ticket">
              <div className="ticket-top-header">
                <div className="ticket-brand">
                  <Film size={16} className="gold-icon" />
                  <span className="brand-name">CINEVERSE</span>
                </div>
                <span className="ticket-tier-badge">EXCLUSIVE SANCTUARY PASS</span>
              </div>

              <div className="ticket-main-body">
                <h2 className="ticket-movie-title">{booking.movie.title}</h2>
                <p className="ticket-movie-format">{booking.movie.format}</p>
                <p className="ticket-auditorium">{booking.movie.auditorium}</p>

                <div className="ticket-info-grid">
                  <div className="ticket-info-block">
                    <span className="info-label">DATE</span>
                    <span className="info-val">{booking.date.full}</span>
                  </div>
                  <div className="ticket-info-block">
                    <span className="info-label">TIME</span>
                    <span className="info-val">{booking.time}</span>
                  </div>
                  <div className="ticket-info-block">
                    <span className="info-label">RECLINERS</span>
                    <span className="info-val gold-text">
                      {booking.seats.map((s) => s.id).join(', ')}
                    </span>
                  </div>
                  <div className="ticket-info-block">
                    <span className="info-label">GUEST</span>
                    <span className="info-val">
                      {booking.guestName || 'Patron of the Arts'}
                    </span>
                  </div>
                </div>

                {booking.addons && booking.addons.length > 0 && (
                  <div className="ticket-addons-summary">
                    <span className="addons-title">
                      <Sparkles size={12} className="gold-icon" />
                      <span>IN-SEAT CONCIERGE SERVICE ORDERED:</span>
                    </span>
                    <div className="addons-pills">
                      {booking.addons.map((a) => (
                        <span key={a.id} className="addon-pill">
                          {a.name} (×{a.quantity})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Perforation Divider */}
              <div className="ticket-perforation">
                <div className="notch left" />
                <div className="perf-line" />
                <div className="notch right" />
              </div>

              {/* Ticket Stub with QR Code */}
              <div className="ticket-stub-footer">
                <div className="stub-details">
                  <span className="stub-ref-label">BOOKING REFERENCE</span>
                  <span className="stub-ref-code">{booking.refCode}</span>
                  <span className="stub-concierge-notice">
                    Present this pass at the Grand Foyer Concierge desk upon arrival.
                  </span>
                </div>

                {/* SVG Digital QR Code */}
                <div className="stub-qr-code">
                  <svg viewBox="0 0 100 100" className="qr-svg">
                    <rect width="100" height="100" fill="#080808" />
                    {/* QR Finder Corners */}
                    <rect x="10" y="10" width="25" height="25" fill="#D4AF37" rx="3" />
                    <rect x="15" y="15" width="15" height="15" fill="#080808" />
                    <rect x="19" y="19" width="7" height="7" fill="#D4AF37" />

                    <rect x="65" y="10" width="25" height="25" fill="#D4AF37" rx="3" />
                    <rect x="70" y="15" width="15" height="15" fill="#080808" />
                    <rect x="74" y="19" width="7" height="7" fill="#D4AF37" />

                    <rect x="10" y="65" width="25" height="25" fill="#D4AF37" rx="3" />
                    <rect x="15" y="70" width="15" height="15" fill="#080808" />
                    <rect x="19" y="74" width="7" height="7" fill="#D4AF37" />

                    {/* QR Code decorative bit matrix */}
                    <rect x="42" y="12" width="6" height="6" fill="#D4AF37" />
                    <rect x="52" y="18" width="6" height="6" fill="#D4AF37" />
                    <rect x="42" y="30" width="6" height="6" fill="#D4AF37" />
                    <rect x="12" y="42" width="6" height="6" fill="#D4AF37" />
                    <rect x="24" y="48" width="6" height="6" fill="#D4AF37" />
                    <rect x="38" y="44" width="8" height="8" fill="#D4AF37" />
                    <rect x="50" y="44" width="6" height="6" fill="#D4AF37" />
                    <rect x="62" y="44" width="6" height="6" fill="#D4AF37" />
                    <rect x="75" y="48" width="8" height="8" fill="#D4AF37" />
                    <rect x="44" y="62" width="6" height="6" fill="#D4AF37" />
                    <rect x="55" y="68" width="6" height="6" fill="#D4AF37" />
                    <rect x="44" y="78" width="6" height="6" fill="#D4AF37" />
                    <rect x="68" y="75" width="10" height="10" fill="#D4AF37" />
                    <rect x="82" y="65" width="6" height="6" fill="#D4AF37" />
                    <rect x="82" y="82" width="6" height="6" fill="#D4AF37" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="ticket-actions-bar">
              <button
                type="button"
                onClick={() => window.print()}
                className="ticket-print-btn"
              >
                <Download size={15} />
                <span>PRINT / SAVE CINEMA PASS</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="ticket-dismiss-btn"
              >
                <span>RETURN TO EXPERIENCE</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;
}
