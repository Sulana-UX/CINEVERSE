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
  ArrowDownRight,
} from 'lucide-react';
import { formatLKR } from '../../../utils/currency';
import RevenueBarChart from './charts/RevenueBarChart';
import OccupancyDonutChart from './charts/OccupancyDonutChart';

/** Small trend line from real daily values (oldest first). */
function Sparkline({ id, values, color }) {
  if (!values || values.length < 2 || values.every((v) => v === 0)) {
    return <div className="kpi-micro-sparkline" />;
  }
  const max = Math.max(...values);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 20 - (v / max) * 18;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${points.join(' L')}`;
  return (
    <div className="kpi-micro-sparkline">
      <svg viewBox="0 0 100 22" className="sparkline-svg" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L100,22 L0,22 Z`} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function GrossDelta({ pct, yesterday }) {
  if (pct === null || pct === undefined) {
    return <span className="kpi-footer-text">{yesterday ? '' : 'No sales yesterday'}</span>;
  }
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <>
      <span className={`kpi-delta ${up ? 'positive' : 'negative'}`}>
        <Icon size={13} style={{ display: 'inline', marginRight: '2px' }} />
        {up ? '+' : ''}
        {pct}%
      </span>
      <span className="kpi-footer-text">vs yesterday</span>
    </>
  );
}

function formatToday(dateStr) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00Z`)
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .toUpperCase();
}

const PHASE_LABEL = { Live: 'Now playing', Completed: 'Finished', Scheduled: 'Upcoming' };

export default function AdminOverviewTab({ stats, bookings, onNavigateTab, onOpenUploadModal }) {
  const k = stats?.kpis;
  const week = stats?.revenueWeek || [];

  if (!stats) {
    return (
      <div className="admin-loading-state">
        <div className="admin-spinner" />
        <span>Loading today’s numbers…</span>
      </div>
    );
  }

  return (
    <div className="overview-tab-content">
      {/* 1. KPI cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">SALES TODAY</span>
            <div className="kpi-icon-wrap icon-indigo">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">{formatLKR(k.todayGross)}</div>
          <div className="kpi-footer">
            <GrossDelta pct={k.grossChangePct} yesterday={k.yesterdayGross} />
          </div>
          <Sparkline id="sparkGross" values={week.map((d) => d.tickets + d.dining)} color="#D4AF37" />
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">TODAY’S OCCUPANCY</span>
            <div className="kpi-icon-wrap icon-emerald">
              <Ticket size={16} />
            </div>
          </div>
          <div className="kpi-value">{k.occupancyToday}%</div>
          <div className="kpi-footer">
            <span className="kpi-subvalue">
              {k.seatsSoldToday} of {k.capacityToday} seats sold
            </span>
          </div>
          <Sparkline id="sparkOcc" values={week.map((d) => d.seats)} color="#10B981" />
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">FILMS ON SALE</span>
            <div className="kpi-icon-wrap icon-violet">
              <Film size={16} />
            </div>
          </div>
          <div className="kpi-value">
            {k.activeFilms} <span className="kpi-unit">of {k.totalFilms}</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-subvalue">
              {k.showsToday} screenings in {k.halls} halls today
            </span>
          </div>
          <div className="kpi-micro-sparkline" />
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">IN-SEAT ORDERS OPEN</span>
            <div className="kpi-icon-wrap icon-amber">
              <Wine size={16} />
            </div>
          </div>
          <div className="kpi-value">
            {k.conciergeOpen} <span className="kpi-unit">to deliver</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-subvalue">All time extras: {formatLKR(k.conciergeRevenue)}</span>
          </div>
          <Sparkline id="sparkWine" values={week.map((d) => d.dining)} color="#F59E0B" />
        </div>
      </div>

      {/* 2. Charts */}
      <div className="overview-charts-grid">
        <RevenueBarChart today={stats.revenueToday} week={stats.revenueWeek} />
        <OccupancyDonutChart
          halls={stats.hallOccupancy}
          tiers={stats.tierOccupancy}
          seatsSold={k.seatsSoldToday}
          capacity={k.capacityToday}
        />
      </div>

      {/* 3. Quick actions */}
      <div className="dashboard-quick-actions">
        <button type="button" onClick={onOpenUploadModal} className="quick-action-card">
          <div className="quick-action-icon">
            <Film size={18} />
          </div>
          <div className="quick-action-text">
            <span className="action-title">Add a Film</span>
            <span className="action-desc">Publish a new presentation with its poster and showtimes</span>
          </div>
          <ArrowRight size={16} className="action-arrow" />
        </button>

        <button type="button" onClick={() => onNavigateTab('bookings')} className="quick-action-card">
          <div className="quick-action-icon">
            <Ticket size={18} />
          </div>
          <div className="quick-action-text">
            <span className="action-title">Guest Reservations</span>
            <span className="action-desc">
              {k.bookingsToday} bookings today · {k.checkedInToday} checked in
            </span>
          </div>
          <ArrowRight size={16} className="action-arrow" />
        </button>

        <button type="button" onClick={() => onNavigateTab('concierge')} className="quick-action-card">
          <div className="quick-action-icon">
            <Wine size={18} />
          </div>
          <div className="quick-action-text">
            <span className="action-title">In-Seat Service</span>
            <span className="action-desc">Prepare and deliver extras to guests’ seats</span>
          </div>
          <ArrowRight size={16} className="action-arrow" />
        </button>
      </div>

      {/* 4. Today's screening timeline */}
      <div className="dashboard-section-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <Clock size={16} className="gold-icon" />
            <h2 className="panel-title">Today’s Screenings</h2>
          </div>
          <span className="panel-tag">{formatToday(stats.today)}</span>
        </div>

        <div className="screening-timeline-list">
          {stats.timeline.map((hall) => (
            <div key={hall.id} className="timeline-hall-row">
              <div className="hall-meta">
                <span className="hall-name">{hall.auditorium}</span>
                <span className="hall-format">{hall.format}</span>
                <span className="hall-film">
                  {hall.films.length ? `Playing: ${hall.films.join(', ')}` : 'No screenings today'}
                </span>
              </div>

              <div className="hall-showtimes-strip">
                {hall.showtimes.map((st) => (
                  <div
                    key={`${st.time}-${st.film}`}
                    className={`showtime-bubble ${st.status === 'Live' ? 'is-live' : ''} ${
                      st.status === 'Completed' ? 'is-completed' : ''
                    }`}
                    title={hall.films.length > 1 ? st.film : undefined}
                  >
                    <span className="bubble-time">{st.time}</span>
                    <span className="bubble-status">
                      {st.status === 'Live' ? `${PHASE_LABEL.Live} · ${st.progress}%` : PHASE_LABEL[st.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recent bookings */}
      <div className="dashboard-section-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <Sparkles size={16} className="gold-icon" />
            <h2 className="panel-title">Recent Reservations</h2>
          </div>
          <button type="button" onClick={() => onNavigateTab('bookings')} className="panel-view-all-btn">
            <span>View All Reservations</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="recent-bookings-table-wrap">
          {bookings.length === 0 ? (
            <div className="chart-empty-state">No paid bookings yet.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>REF ID</th>
                  <th>GUEST</th>
                  <th>FILM</th>
                  <th>SEATS</th>
                  <th>TOTAL</th>
                  <th>DOOR STATUS</th>
                </tr>
              </thead>
              <tbody>
                {[...bookings]
                  .sort((a, b) => String(b.bookedAt).localeCompare(String(a.bookedAt)))
                  .slice(0, 5)
                  .map((b) => (
                    <tr key={b.id}>
                      <td className="font-mono text-gold">{b.id}</td>
                      <td className="font-semibold text-ivory">{b.guestName}</td>
                      <td>{b.movieTitle}</td>
                      <td>
                        <span className="seats-badge">{Array.isArray(b.seats) ? b.seats.join(', ') : b.seats}</span>
                      </td>
                      <td className="text-champagne font-semibold">{formatLKR(b.totalAmount)}</td>
                      <td>
                        <span className={`status-pill-table ${b.checkedIn ? 'pill-checked' : 'pill-confirmed'}`}>
                          {b.checkedIn ? 'Checked-In' : 'Confirmed'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
