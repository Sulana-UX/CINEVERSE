import React from 'react';
import {
  TrendingUp,
  Ticket,
  Film,
  Wine,
  Sparkles,
  ArrowRight,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { formatLKR } from '../../../utils/currency';
import RevenueBarChart from './charts/RevenueBarChart';
import OccupancyDonutChart from './charts/OccupancyDonutChart';

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
      {/* 1. Executive Modern KPI Cards with Sparklines */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">TOTAL BOX OFFICE GROSS</span>
            <div className="kpi-icon-wrap icon-indigo">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">{formatLKR(metrics?.totalGross || 0)}</div>
          <div className="kpi-footer">
            <span className="kpi-delta positive">
              <ArrowUpRight size={13} style={{ display: 'inline', marginRight: '2px' }} />
              +18.4%
            </span>
            <span className="kpi-footer-text">vs yesterday’s repertory</span>
          </div>
          <div className="kpi-micro-sparkline">
            <svg viewBox="0 0 100 22" className="sparkline-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,18 Q15,14 30,16 T60,8 T80,11 T100,2 L100,22 L0,22 Z" fill="url(#sparkGross)" />
              <path d="M0,18 Q15,14 30,16 T60,8 T80,11 T100,2" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">SEAT OCCUPANCY RATE</span>
            <div className="kpi-icon-wrap icon-emerald">
              <Ticket size={16} />
            </div>
          </div>
          <div className="kpi-value">{metrics?.occupancyRate ?? 0}%</div>
          <div className="kpi-footer">
            <span className="kpi-subvalue">
              {metrics?.totalSeatsBooked ?? 0} Seats Booked
            </span>
          </div>
          <div className="kpi-micro-sparkline">
            <svg viewBox="0 0 100 22" className="sparkline-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkOcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,16 Q20,10 40,14 T70,5 T100,3 L100,22 L0,22 Z" fill="url(#sparkOcc)" />
              <path d="M0,16 Q20,10 40,14 T70,5 T100,3" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">ACTIVE 70MM FILMS</span>
            <div className="kpi-icon-wrap icon-violet">
              <Film size={16} />
            </div>
          </div>
          <div className="kpi-value">{movies?.length || 2} <span className="kpi-unit">Presentations</span></div>
          <div className="kpi-footer">
            <span className="kpi-subvalue">Across 3 Luxury Soundstages</span>
          </div>
          <div className="kpi-micro-sparkline">
            <svg viewBox="0 0 100 22" className="sparkline-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkFilms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,15 Q30,12 50,14 T80,7 T100,5 L100,22 L0,22 Z" fill="url(#sparkFilms)" />
              <path d="M0,15 Q30,12 50,14 T80,7 T100,5" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">VIP CONCIERGE ORDERS</span>
            <div className="kpi-icon-wrap icon-amber">
              <Wine size={16} />
            </div>
          </div>
          <div className="kpi-value">{metrics?.conciergeOrdersCount ?? 0} <span className="kpi-unit">Active</span></div>
          <div className="kpi-footer">
            <span className="kpi-subvalue">Dom Pérignon & Truffles En Route</span>
          </div>
          <div className="kpi-micro-sparkline">
            <svg viewBox="0 0 100 22" className="sparkline-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkWine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,18 Q25,16 45,11 T75,9 T100,2 L100,22 L0,22 Z" fill="url(#sparkWine)" />
              <path d="M0,18 Q25,16 45,11 T75,9 T100,2" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Interactive Analytics Engine: Bar Graph & Donut Chart */}
      <div className="overview-charts-grid">
        <RevenueBarChart />
        <OccupancyDonutChart />
      </div>

      {/* 3. Quick Actions Strip */}
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
                  <td className="text-champagne font-semibold">{formatLKR(b.totalAmount)}</td>
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
