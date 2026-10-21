import React from 'react';
import { Video, Volume2, CheckCircle2, Film } from 'lucide-react';

export default function AdminAuditoriumsTab({ auditoriums }) {
  return (
    <div className="auditoriums-tab-content">
      <div className="auditoriums-grid">
        {auditoriums.map((hall) => {
          const occupancyPercent = Math.round((hall.occupiedSeats / hall.totalSeats) * 100);

          return (
            <div key={hall.id} className="auditorium-card">
              <div className="auditorium-card-header">
                <div className="hall-number-badge">
                  <span>SOUNDSTAGE {hall.number}</span>
                </div>
                <div className="hall-status-pill">
                  <CheckCircle2 size={12} className="gold-icon" />
                  <span>{hall.status}</span>
                </div>
              </div>

              <h2 className="auditorium-title">{hall.name}</h2>
              <div className="auditorium-format-tag">{hall.format}</div>

              {/* Current Feature */}
              <div className="current-screening-box">
                <span className="box-label">CURRENT FEATURE PRESENTATION</span>
                <div className="screening-movie-row">
                  <Film size={16} className="gold-icon" />
                  <span className="screening-title">{hall.currentFilm}</span>
                </div>
                <span className="next-showtime-label">Next Architectural Showing: {hall.nextShowtime}</span>
              </div>

              {/* Specs List */}
              <div className="specs-list">
                <div className="spec-item">
                  <Video size={15} className="spec-icon" />
                  <div className="spec-text">
                    <span className="spec-label">PROJECTION SUITE</span>
                    <span className="spec-desc">{hall.projection}</span>
                  </div>
                </div>

                <div className="spec-item">
                  <Volume2 size={15} className="spec-icon" />
                  <div className="spec-text">
                    <span className="spec-label">ACOUSTIC ARCHITECTURE</span>
                    <span className="spec-desc">{hall.sound}</span>
                  </div>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div className="hall-occupancy-section">
                <div className="occupancy-labels">
                  <span>SEAT OCCUPANCY TODAY</span>
                  <span className="occupancy-pct font-mono text-gold">
                    {hall.occupiedSeats} / {hall.totalSeats} ({occupancyPercent}%)
                  </span>
                </div>
                <div className="occupancy-bar-bg">
                  <div
                    className="occupancy-bar-fill"
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
