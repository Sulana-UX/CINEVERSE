import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Ticket,
  Clock,
  Wine,
} from 'lucide-react';

export default function AdminBookingsTab({ bookings, onToggleCheckIn }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.movieTitle.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'CHECKED_IN') return matchesSearch && b.checkedIn;
    if (statusFilter === 'CONFIRMED') return matchesSearch && !b.checkedIn;
    return matchesSearch;
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const checkedInCount = bookings.filter((b) => b.checkedIn).length;

  return (
    <div className="bookings-tab-content">
      {/* 1. Header Stats Summary */}
      <div className="bookings-stats-row">
        <div className="booking-mini-stat">
          <span className="mini-stat-label">TOTAL RESERVATIONS</span>
          <span className="mini-stat-val">{bookings.length}</span>
        </div>
        <div className="booking-mini-stat">
          <span className="mini-stat-label">CHECKED-IN GUESTS</span>
          <span className="mini-stat-val text-gold">{checkedInCount} / {bookings.length}</span>
        </div>
        <div className="booking-mini-stat">
          <span className="mini-stat-label">TICKET & VIP CONCESSION GROSS</span>
          <span className="mini-stat-val text-champagne">${totalRevenue.toFixed(2)}</span>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bookings-controls-bar">
        <div className="admin-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by patron name, ref ID, or film..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <div className="filter-chips-group">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`filter-chip ${statusFilter === 'ALL' ? 'active' : ''}`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`filter-chip ${statusFilter === 'CONFIRMED' ? 'active' : ''}`}
          >
            Awaiting Arrival ({bookings.length - checkedInCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CHECKED_IN')}
            className={`filter-chip ${statusFilter === 'CHECKED_IN' ? 'active' : ''}`}
          >
            Checked-In ({checkedInCount})
          </button>
        </div>
      </div>

      {/* 3. Reservations Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>BOOKING REF</th>
              <th>PATRON / GUEST</th>
              <th>PRESENTATION & TIME</th>
              <th>SEATS & TIER</th>
              <th>CONCIERGE ADD-ONS</th>
              <th>TOTAL</th>
              <th>DOOR CHECK-IN</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty-cell">
                  <Ticket size={24} className="gold-icon" style={{ margin: '0 auto 0.5rem' }} />
                  <p>No reservations matching your filter query.</p>
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b.id} className={b.checkedIn ? 'row-checked-in' : ''}>
                  <td className="font-mono text-gold font-semibold">{b.id}</td>
                  <td>
                    <div className="patron-cell">
                      <span className="patron-name">{b.guestName}</span>
                      <span className="patron-email">{b.guestEmail}</span>
                    </div>
                  </td>
                  <td>
                    <div className="screening-cell">
                      <span className="film-title">{b.movieTitle}</span>
                      <span className="screening-meta">
                        <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                        {b.showtime} • {b.auditorium.split('—')[0]}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="seats-cell">
                      <span className="seats-badge">
                        {Array.isArray(b.seats) ? b.seats.join(', ') : b.seats}
                      </span>
                      <span className="tier-tag">{b.tier}</span>
                    </div>
                  </td>
                  <td>
                    {b.addons && b.addons.length > 0 ? (
                      <div className="addons-list-cell">
                        {b.addons.map((addon, idx) => (
                          <span key={idx} className="addon-tag">
                            <Wine size={10} style={{ display: 'inline', marginRight: '3px' }} />
                            {addon}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-dim">—</span>
                    )}
                  </td>
                  <td className="text-champagne font-semibold font-mono">
                    ${b.totalAmount.toFixed(2)}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onToggleCheckIn(b.id)}
                      className={`checkin-toggle-btn ${b.checkedIn ? 'btn-is-checked' : ''}`}
                    >
                      {b.checkedIn ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Checked In</span>
                        </>
                      ) : (
                        <>
                          <span>Check In</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
