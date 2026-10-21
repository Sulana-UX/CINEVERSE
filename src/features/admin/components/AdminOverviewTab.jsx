import React from 'react';
import {
  TrendingUp,
  Ticket,
  Film,
  Wine,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function AdminOverviewTab({
  metrics,
  bookings,
  movies,
  onNavigateTab,
  onOpenUploadModal,
}) {
  const TIMELINE_SCREENINGS = [
    {
      auditorium: 'Auditorium 01 — The Sovereign Soundstage',
      format: '70MM DUAL LASER • DOLBY ATMOS',
      film: 'DUNE: PART TWO',
      showtimes: [
        { time: '14:30', status: 'Completed' },
        { time: '17:45', status: 'Completed' },
        { time: '20:30', status: 'Live Screening', isLive: true },
        { time: '23:30', status: 'Scheduled' },
      ],
    },
    {
      auditorium: 'Auditorium 02 — The Director’s Loge',
      format: '70MM ULTRA PANAVISION • 6-TRACK',
      film: 'OPPENHEIMER',
      showtimes: [
        { time: '14:00', status: 'Completed' },
        { time: '17:45', status: 'Completed' },
        { time: '21:15', status: 'Scheduled' },
      ],
    },
    {
      auditorium: 'Auditorium 03 — The Quantum Chamber',
      format: '10TH ANNIVERSARY 70MM PRESENTATION',
      film: 'INTERSTELLAR',
      showtimes: [
        { time: '15:15', status: 'Completed' },
        { time: '18:45', status: 'Live Screening', isLive: true },
        { time: '22:15', status: 'Scheduled' },
      ],
    },
  ];

  return (
    <div className="overview-tab-content">
      {/* 1. Executive KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">TOTAL BOX OFFICE GROSS</span>
            <div className="kpi-icon-wrap">
              <TrendingUp size={16} className="gold-icon" />
            </div>
          </div>
          <div className="kpi-value">${metrics?.totalGross?.toLocaleString() || '1,273.00'}</div>
          <div className="kpi-footer">
            <span className="kpi-delta positive">+18.4%</span>
            <span className="kpi-footer-text">vs yesterday’s repertory</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">SEAT OCCUPANCY RATE</span>
            <div className="kpi-icon-wrap">
              <Ticket size={16} className="gold-icon" />
            </div>
          </div>
          <div className="kpi-value">{metrics?.occupancyRate || 86}%</div>
          <div className="kpi-footer">
            <span className="kpi-subvalue">
              {metrics?.totalSeatsBooked || 12} Seats Reserved Today
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">ACTIVE 70MM FILMS</span>
            <div className="kpi-icon-wrap">
              <Film size={16} className="gold-icon" />
            </div>
          </div>
          <div className="kpi-value">{movies?.length || 3} Presentations</div>
          <div className="kpi-footer">
            <span className="kpi-subvalue">Across 3 Luxury Soundstages</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">VIP CONCIERGE ORDERS</span>
            <div className="kpi-icon-wrap">
              <Wine size={16} className="gold-icon" />
            </div>
          </div>
          <div className="kpi-value">{metrics?.conciergeOrdersCount || 3} Active</div>
          <div className="kpi-footer">
            <span className="kpi-subvalue">Dom Pérignon & Truffles En Route</span>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions Strip */}
      <div className="dashboard-quick-actions">
        <button
          type="button"
          onClick={onOpenUploadModal}
          className="quick-action-card"
        >
          <div className="quick-action-icon">
            <Film size={18} />
          </div>
          <div className="quick-action-text">
            <span className="action-title">Upload 70mm Presentation</span>
            <span className="action-desc">Add a new repertory film with Cloudinary imagery</span>
          </div>
          <ArrowRight size={16} className="action-arrow" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('bookings')}
          className="quick-action-card"
        >
          <div className="quick-action-icon">
            <Ticket size={18} />
          </div>
          <div className="quick-action-text">
            <span className="action-title">Review Guest Reservations</span>
            <span className="action-desc">Verify patron passes and door check-in status</span>
          </div>
          <ArrowRight size={16} className="action-arrow" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('concierge')}
          className="quick-action-card"
        >
          <div className="quick-action-icon">
            <Wine size={18} />
          </div>
          <div className="quick-action-text">
            <span className="action-title">VIP Concierge In-Seat Bar</span>
            <span className="action-desc">Track champagne, caviar, and wine deliveries</span>
          </div>
          <ArrowRight size={16} className="action-arrow" />
        </button>
      </div>

      {/* 3. Today's 70mm Screening Schedule Timeline */}
      <div className="dashboard-section-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <Clock size={16} className="gold-icon" />
            <h2 className="panel-title">Today’s Architectural Screening Timeline</h2>
          </div>
          <span className="panel-tag">WEDNESDAY, OCT 21 • 70MM SCHEDULE</span>
        </div>

        <div className="screening-timeline-list">
          {TIMELINE_SCREENINGS.map((hall, idx) => (
            <div key={idx} className="timeline-hall-row">
              <div className="hall-meta">
                <span className="hall-name">{hall.auditorium}</span>
                <span className="hall-format">{hall.format}</span>
                <span className="hall-film">Playing: {hall.film}</span>
              </div>

              <div className="hall-showtimes-strip">
                {hall.showtimes.map((st, i) => (
                  <div
                    key={i}
                    className={`showtime-bubble ${st.isLive ? 'is-live' : ''} ${
                      st.status === 'Completed' ? 'is-completed' : ''
                    }`}
                  >
                    <span className="bubble-time">{st.time}</span>
                    <span className="bubble-status">{st.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recent Guest Bookings Preview */}
      <div className="dashboard-section-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <Sparkles size={16} className="gold-icon" />
            <h2 className="panel-title">Recent Patron Reservations</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('bookings')}
            className="panel-view-all-btn"
          >
            <span>View All Reservations</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="recent-bookings-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>REF ID</th>
                <th>PATRON NAME</th>
                <th>PRESENTATION</th>
                <th>SEATS</th>
                <th>TOTAL</th>
                <th>DOOR STATUS</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 4).map((b) => (
                <tr key={b.id}>
                  <td className="font-mono text-gold">{b.id}</td>
                  <td className="font-semibold text-ivory">{b.guestName}</td>
                  <td>{b.movieTitle}</td>
                  <td>
                    <span className="seats-badge">
                      {Array.isArray(b.seats) ? b.seats.join(', ') : b.seats}
                    </span>
                  </td>
                  <td className="text-champagne font-semibold">${b.totalAmount.toFixed(2)}</td>
                  <td>
                    <span
                      className={`status-pill-table ${
                        b.checkedIn ? 'pill-checked' : 'pill-confirmed'
                      }`}
                    >
                      {b.checkedIn ? 'Checked-In' : 'Confirmed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
