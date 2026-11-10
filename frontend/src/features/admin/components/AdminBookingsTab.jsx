import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Ticket,
  Clock,
  Wine,
  X,
  UserCheck,
  Sparkles,
  Download,
  RotateCcw,
  Crown,
  Armchair,
} from 'lucide-react';
import { formatLKR } from '../../../utils/currency';

export default function AdminBookingsTab({ bookings = [], onToggleCheckIn }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [auditoriumFilter, setAuditoriumFilter] = useState('ALL');

  // Bulletproof seats formatter
  const formatSeats = (seats, seatsDisplay) => {
    if (Array.isArray(seatsDisplay) && seatsDisplay.length > 0) {
      return seatsDisplay.join(', ');
    }
    if (Array.isArray(seats)) {
      return seats
        .map((s) => (typeof s === 'object' && s !== null ? s.id || s.seatId || '' : String(s)))
        .filter(Boolean)
        .join(', ');
    }
    if (typeof seats === 'string' && seats) return seats;
    return 'General Loge';
  };

  // Safe auditorium extractor
  const getAuditoriumShort = (aud) => {
    if (!aud || typeof aud !== 'string') return '—';
    return aud.split('—')[0].trim();
  };

  // Bulletproof date formatter (handles objects like {day, date, full} or strings)
  const formatDate = (val) => {
    if (!val) return '—';
    if (typeof val === 'object') {
      return val.full || `${val.day || ''} ${val.date || ''}`.trim() || '—';
    }
    return String(val);
  };

  // Compute metrics
  const totalRevenue = useMemo(
    () => bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0),
    [bookings]
  );
  const checkedInCount = useMemo(
    () => bookings.filter((b) => Boolean(b.checkedIn)).length,
    [bookings]
  );
  const pendingCount = Math.max(0, bookings.length - checkedInCount);
  const checkInRate = bookings.length > 0 ? Math.round((checkedInCount / bookings.length) * 100) : 0;

  // Filter list safely
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const seatsStr = formatSeats(b.seats, b.seatsDisplay);
      const guestName = (b.guestName || '').toLowerCase();
      const id = (b.id || '').toLowerCase();
      const movieTitle = (b.movieTitle || (b.movie && b.movie.title) || '').toLowerCase();
      const guestEmail = (b.guestEmail || '').toLowerCase();

      const matchesSearch =
        !q ||
        guestName.includes(q) ||
        id.includes(q) ||
        movieTitle.includes(q) ||
        guestEmail.includes(q) ||
        seatsStr.toLowerCase().includes(q);

      const isChecked = Boolean(b.checkedIn);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'CHECKED_IN' && isChecked) ||
        (statusFilter === 'CONFIRMED' && !isChecked);

      const audStr = String(b.auditorium || (b.movie && b.movie.auditorium) || '');
      const matchesAuditorium =
        auditoriumFilter === 'ALL' ||
        audStr.includes(auditoriumFilter);

      return matchesSearch && matchesStatus && matchesAuditorium;
    });
  }, [bookings, searchQuery, statusFilter, auditoriumFilter]);

  // Unique Auditoriums for dropdown
  const uniqueAuditoriums = useMemo(() => {
    const set = new Set();
    bookings.forEach((b) => {
      const aud = b.auditorium || (b.movie && b.movie.auditorium);
      if (typeof aud === 'string' && aud) {
        set.add(aud.split('—')[0].trim());
      }
    });
    return Array.from(set);
  }, [bookings]);

  // Initials generator
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'VP';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'VP';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Avatar pastel colors
  const getAvatarStyle = (name) => {
    const palettes = [
      { bg: 'rgba(212, 175, 55, 0.10)', color: '#D4AF37', border: 'rgba(212, 175, 55, 0.32)' },
      { bg: 'rgba(16, 185, 129, 0.12)', color: '#34D399', border: 'rgba(16, 185, 129, 0.32)' },
      { bg: 'rgba(245, 158, 11, 0.12)', color: '#FBBF24', border: 'rgba(245, 158, 11, 0.32)' },
      { bg: 'rgba(167, 139, 250, 0.12)', color: '#A78BFA', border: 'rgba(167, 139, 250, 0.32)' },
      { bg: 'rgba(244, 114, 182, 0.12)', color: '#F472B6', border: 'rgba(244, 114, 182, 0.32)' },
    ];
    let hash = 0;
    const str = String(name || '');
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palettes[Math.abs(hash) % palettes.length];
  };

  // Tier styling helper
  const getTierBadge = (tier = '') => {
    const str = String(tier || '');
    if (!str) return <span className="tier-tag tier-club">—</span>;
    const lower = str.toLowerCase();
    if (lower.includes('sovereign') || lower.includes('royal')) {
      return (
        <span className="tier-tag tier-sovereign">
          <Crown size={10} />
          <span>{str}</span>
        </span>
      );
    }
    if (lower.includes('velvet') || lower.includes('premier')) {
      return (
        <span className="tier-tag tier-premier">
          <Sparkles size={10} />
          <span>{str}</span>
        </span>
      );
    }
    return (
      <span className="tier-tag tier-club">
        <Armchair size={10} />
        <span>{str}</span>
      </span>
    );
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Booking Ref',
      'Date',
      'Guest Name',
      'Email',
      'Film Title',
      'Format',
      'Auditorium',
      'Showtime',
      'Seats',
      'Loge Tier',
      'Concierge Add-ons',
      'Total Paid ($)',
      'Status',
    ];
    const rows = filteredBookings.map((b) => [
      b.id,
      `"${formatDate(b.date)}"`,
      `"${b.guestName || ''}"`,
      b.guestEmail || '',
      `"${b.movieTitle || (b.movie && b.movie.title) || ''}"`,
      `"${b.format || (b.movie && b.movie.format) || ''}"`,
      `"${b.auditorium || (b.movie && b.movie.auditorium) || ''}"`,
      b.showtime || b.time || '',
      `"${formatSeats(b.seats, b.seatsDisplay)}"`,
      `"${b.tier || ''}"`,
      `"${(b.addons || []).map((a) => (typeof a === 'object' && a !== null ? `${a.name} (x${a.quantity || 1})` : String(a))).join('; ')}"`,
      (Number(b.totalAmount) || 0).toFixed(2),
      b.checkedIn ? 'Checked-In' : 'Awaiting Arrival',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `CINEVERSE_Guest_Manifest_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bookings-tab-content">
      {/* 1. Header KPI Metric Cards */}
      <div className="bookings-stats-row">
        {/* Card 1: Total Reservations */}
        <div className="booking-kpi-card">
          <div className="kpi-icon-wrap icon-indigo">
            <Ticket size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">TOTAL RESERVATIONS</span>
            <div className="kpi-number-row">
              <span className="kpi-value font-mono">{bookings.length}</span>
              <span className="kpi-badge-pill">Vault Active</span>
            </div>
            <span className="kpi-subtext">100% Guaranteed Admissions</span>
          </div>
        </div>

        {/* Card 2: Door Check-Ins */}
        <div className="booking-kpi-card highlight-emerald">
          <div className="kpi-icon-wrap icon-emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">DOOR CHECK-IN PROGRESS</span>
            <div className="kpi-number-row">
              <span className="kpi-value font-mono">{checkedInCount} / {bookings.length}</span>
              <span className="kpi-badge-pill badge-emerald">{checkInRate}%</span>
            </div>
            {/* Progress Bar */}
            <div className="kpi-progress-bar">
              <div
                className="kpi-progress-fill"
                style={{ width: `${checkInRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Awaiting Arrival */}
        <div className="booking-kpi-card">
          <div className="kpi-icon-wrap icon-amber">
            <Clock size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">AWAITING ARRIVAL</span>
            <div className="kpi-number-row">
              <span className="kpi-value font-mono">{pendingCount}</span>
              <span className="kpi-badge-pill badge-amber">In Transit</span>
            </div>
            <span className="kpi-subtext">Reserved Soundstage Seats</span>
          </div>
        </div>

        {/* Card 4: Ticket & VIP Gross */}
        <div className="booking-kpi-card">
          <div className="kpi-icon-wrap icon-violet">
            <Sparkles size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">BOX OFFICE & VIP GROSS</span>
            <div className="kpi-number-row">
              <span className="kpi-value font-mono font-bold text-slate-900">
                {formatLKR(totalRevenue)}
              </span>
            </div>
            <span className="kpi-subtext">Admissions + VIP Concessions</span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Filter Bar */}
      <div className="bookings-controls-bar">
        {/* Search */}
        <div className="admin-search-wrap bookings-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by patron name, ref, film, seat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="search-clear-btn"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Segmented Status Tabs */}
        <div className="bookings-segmented-tabs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`segmented-tab-btn ${statusFilter === 'ALL' ? 'is-active' : ''}`}
          >
            <span>All Bookings</span>
            <span className="tab-count-pill">{bookings.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`segmented-tab-btn ${statusFilter === 'CONFIRMED' ? 'is-active' : ''}`}
          >
            <span className="tab-pulse-dot dot-amber" />
            <span>Awaiting Arrival</span>
            <span className="tab-count-pill pill-amber">{pendingCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CHECKED_IN')}
            className={`segmented-tab-btn ${statusFilter === 'CHECKED_IN' ? 'is-active' : ''}`}
          >
            <span className="tab-pulse-dot dot-emerald" />
            <span>Checked In</span>
            <span className="tab-count-pill pill-emerald">{checkedInCount}</span>
          </button>
        </div>

        {/* Right side: Auditorium Filter + CSV Export */}
        <div className="bookings-actions-cluster">
          {uniqueAuditoriums.length > 1 && (
            <div className="auditorium-select-wrap">
              <select
                value={auditoriumFilter}
                onChange={(e) => setAuditoriumFilter(e.target.value)}
                className="admin-select auditorium-filter-select"
              >
                <option value="ALL">All Soundstages</option>
                {uniqueAuditoriums.map((aud) => (
                  <option key={aud} value={aud}>
                    {aud}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="export-manifest-btn"
            title="Export full guest manifest to CSV spreadsheet"
          >
            <Download size={14} />
            <span>Export Manifest</span>
          </button>
        </div>
      </div>

      {/* 3. High-End Data Table Card */}
      <div className="bookings-table-card">
        <div className="table-header-meta">
          <div className="table-meta-left">
            <h4 className="table-card-heading">Patron Manifest</h4>
            <span className="table-card-subheading">
              Showing {filteredBookings.length} of {bookings.length} reservations
            </span>
          </div>
          {searchQuery && (
            <div className="filter-active-pill">
              <span>Filtered by “{searchQuery}”</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="pill-clear-btn"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="table-responsive-wrapper">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>BOOKING REF</th>
                <th>PATRON / GUEST</th>
                <th>PRESENTATION & SOUNDSTAGE</th>
                <th>SEATS & TIER</th>
                <th>VIP CONCIERGE ADD-ONS</th>
                <th>TOTAL GROSS</th>
                <th style={{ textAlign: 'right' }}>DOOR CHECK-IN</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty-cell">
                    <div className="empty-manifest-wrap">
                      <div className="empty-icon-bubble">
                        <Ticket size={28} className="empty-ticket-icon" />
                      </div>
                      <h5>No Matching Reservations Found</h5>
                      <p>
                        We couldn’t find any bookings matching your active search or filters.
                      </p>
                      {(searchQuery || statusFilter !== 'ALL' || auditoriumFilter !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                            setAuditoriumFilter('ALL');
                          }}
                          className="clear-all-filters-btn"
                        >
                          <RotateCcw size={13} />
                          <span>Reset All Filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const guestName = b.guestName || 'Guest';
                  const avatarStyle = getAvatarStyle(guestName);
                  const isChecked = Boolean(b.checkedIn);
                  const movieTitle = b.movieTitle || (b.movie && b.movie.title) || '—';
                  const format = b.format || (b.movie && b.movie.format) || '';
                  const showtime = b.showtime || b.time || '—';
                  const audShort = getAuditoriumShort(b.auditorium || (b.movie && b.movie.auditorium));
                  const seatsFormatted = formatSeats(b.seats, b.seatsDisplay);

                  return (
                    <tr
                      key={b.id}
                      className={`booking-data-row ${isChecked ? 'row-checked-in' : ''}`}
                    >
                      {/* 1. REF */}
                      <td>
                        <div className="booking-ref-block">
                          <span className="booking-ref-pill font-mono">{b.id}</span>
                          <span className="booking-date-sub">{formatDate(b.date)}</span>
                        </div>
                      </td>

                      {/* 2. PATRON / GUEST */}
                      <td>
                        <div className="patron-profile-cell">
                          <div
                            className="patron-avatar-circle"
                            style={{
                              backgroundColor: avatarStyle.bg,
                              color: avatarStyle.color,
                              borderColor: avatarStyle.border,
                            }}
                          >
                            <span>{getInitials(guestName)}</span>
                          </div>
                          <div className="patron-text-meta">
                            <span className="patron-full-name">{guestName}</span>
                            <span className="patron-email-link">{b.guestEmail || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* 3. PRESENTATION & AUDITORIUM */}
                      <td>
                        <div className="screening-cell">
                          <span className="film-screening-title">{movieTitle}</span>
                          <div className="screening-sub-pills">
                            <span className="format-micro-badge">
                              {format.split('•')[0].trim()}
                            </span>
                            <span className="screening-time-text">
                              <Clock size={11} className="inline-clock" />
                              {showtime} • {audShort}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 4. SEATS & TIER */}
                      <td>
                        <div className="seats-tier-cell">
                          <div className="seats-badge-wrap">
                            <Armchair size={13} className="seat-icon" />
                            <span className="seats-numbers font-mono">
                              {seatsFormatted}
                            </span>
                          </div>
                          {getTierBadge(b.tier)}
                        </div>
                      </td>

                      {/* 5. ADD-ONS */}
                      <td>
                        {b.addons && b.addons.length > 0 ? (
                          <div className="addons-list-cell">
                            {b.addons.map((addon, idx) => {
                              const addonLabel =
                                typeof addon === 'object' && addon !== null
                                  ? `${addon.name || 'Concession'} (x${addon.quantity || 1})`
                                  : String(addon);
                              return (
                                <span key={idx} className="addon-luxury-tag">
                                  <Wine size={11} className="addon-icon" />
                                  <span>{addonLabel}</span>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="no-addons-pill">Standard Box Office</span>
                        )}
                      </td>

                      {/* 6. TOTAL */}
                      <td>
                        <div className="total-amount-cell">
                          <span className="total-amount-val font-mono font-bold">
                            {formatLKR(b.totalAmount)}
                          </span>
                          <span className="payment-status-badge">{b.status || 'Confirmed'}</span>
                        </div>
                      </td>

                      {/* 7. DOOR CHECK-IN TOGGLE */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => onToggleCheckIn(b.id)}
                          className={`checkin-action-btn ${isChecked ? 'is-checked-in' : 'is-pending'}`}
                          title={isChecked ? 'Click to toggle back to pending' : 'Click to check-in guest at door'}
                        >
                          {isChecked ? (
                            <>
                              <span className="btn-state-default">
                                <CheckCircle2 size={14} className="check-icon" />
                                <span>Checked In</span>
                              </span>
                              <span className="btn-state-hover">
                                <RotateCcw size={13} />
                                <span>Undo</span>
                              </span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} />
                              <span>Check In</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
