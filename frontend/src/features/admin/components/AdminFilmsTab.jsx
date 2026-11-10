import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Film,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Video,
  ExternalLink,
  Search,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';

export default function AdminFilmsTab({
  movies,
  loading,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteMovie,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filtered film list
  const filteredFilms = movies.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.director && m.director.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.auditorium && m.auditorium.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.format && m.format.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const nowShowingCount = movies.filter((m) => m.status === 'Now Showing').length;
  const comingSoonCount = movies.filter((m) => m.status === 'Coming Soon').length;
  const archiveCount = movies.filter((m) => m.status === 'Special Archive').length;

  const totalShowtimes = movies.reduce((sum, m) => {
    const count = Array.isArray(m.showtimes) ? m.showtimes.length : 1;
    return sum + count;
  }, 0);

  return (
    <div className="films-tab-view">
      {/* 1. Header Metrics Strip */}
      <div className="films-archive-metrics-strip">
        <div className="archive-metric-card">
          <div className="metric-icon-wrap icon-indigo">
            <Film size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">REPERTORY VAULT</span>
            <span className="metric-value font-mono">{movies.length} Master Prints</span>
          </div>
        </div>

        <div className="archive-metric-card">
          <div className="metric-icon-wrap icon-emerald">
            <Clock size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">DAILY PRESENTATIONS</span>
            <span className="metric-value font-mono">{totalShowtimes} Showtimes Scheduled</span>
          </div>
        </div>

        <div className="archive-metric-card">
          <div className="metric-icon-wrap icon-violet">
            <Layers size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">ACTIVE SOUNDSTAGES</span>
            <span className="metric-value font-mono">3 Luxury Auditoriums</span>
          </div>
        </div>

        <div className="archive-metric-card highlight-vault">
          <div className="metric-icon-wrap icon-amber">
            <Sparkles size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-label">PROJECTION STATUS</span>
            <span className="metric-value font-mono">100% 70mm Calibrated</span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Filter Bar */}
      <div className="films-controls-bar">
        {/* Left: Search Bar */}
        <div className="admin-search-wrap films-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search films, directors, soundstages..."
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

        {/* Center: Sleek Segmented Status Tabs */}
        <div className="films-segmented-tabs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`segmented-tab-btn ${statusFilter === 'ALL' ? 'is-active' : ''}`}
          >
            <span>All Prints</span>
            <span className="tab-count-pill">{movies.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Now Showing')}
            className={`segmented-tab-btn ${statusFilter === 'Now Showing' ? 'is-active' : ''}`}
          >
            <span className="tab-pulse-dot" />
            <span>Now Showing</span>
            <span className="tab-count-pill">{nowShowingCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Coming Soon')}
            className={`segmented-tab-btn ${statusFilter === 'Coming Soon' ? 'is-active' : ''}`}
          >
            <span>Coming Soon</span>
            <span className="tab-count-pill">{comingSoonCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Special Archive')}
            className={`segmented-tab-btn ${statusFilter === 'Special Archive' ? 'is-active' : ''}`}
          >
            <span>Archive</span>
            <span className="tab-count-pill">{archiveCount}</span>
          </button>
        </div>

        {/* Right: Actions (Restore & Upload) */}
        <div className="films-action-buttons">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="admin-topbar-action-btn film-upload-cta"
          >
            <Plus size={16} />
            <span>Upload New Film</span>
          </button>
        </div>
      </div>

      {/* 3. Films Grid / Loading / Empty States */}
      {loading ? (
        <div className="admin-loading-state">
          <div className="admin-spinner" />
          <span>Curating Repertory Archive...</span>
        </div>
      ) : filteredFilms.length === 0 ? (
        <div className="admin-empty-state">
          <div className="empty-icon-wrap">
            <Film size={40} className="gold-icon" />
          </div>
          <h3 className="admin-empty-title">No Matching Repertory Films</h3>
          <p className="admin-empty-desc">
            {searchQuery || statusFilter !== 'ALL'
              ? `No film presentations match your search "${searchQuery || statusFilter}".`
              : 'No films yet. Upload your first presentation to open it for booking.'}
          </p>
          <div className="admin-empty-actions">
            {searchQuery || statusFilter !== 'ALL' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="admin-restore-btn"
              >
                <span>Reset All Filters</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="admin-topbar-action-btn"
              >
                <Plus size={15} />
                <span>Upload First Film</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-films-grid">
          {filteredFilms.map((movie) => {
            const showtimesArr = Array.isArray(movie.showtimes)
              ? movie.showtimes
              : typeof movie.showtimes === 'string'
              ? movie.showtimes.split(',').map((s) => s.trim())
              : [movie.showtimes];

            const formatPrimary = (movie.format || '70MM DUAL LASER').split('•')[0].trim();
            const formatSub = (movie.format || '').includes('•')
              ? movie.format.split('•')[1].trim()
              : 'IMAX AUDIO';

            return (
              <div key={movie.id} className="admin-film-card">
                {/* 16:9 Cinematic Backdrop Preview */}
                <div className="admin-film-media">
                  <img
                    src={movie.backdrop || '/images/luxury_cinema_interior.jpg'}
                    alt={movie.title}
                    className="admin-film-img"
                    loading="lazy"
                  />
                  <div className="admin-film-scrim" />

                  {/* Top Floating Badges */}
                  <div className="film-media-top-strip">
                    <span
                      className={`film-status-pill ${
                        movie.status === 'Now Showing' ? 'is-showing' : 'is-coming'
                      }`}
                    >
                      <span className="status-dot-pulse" />
                      {movie.status || 'Now Showing'}
                    </span>

                    <span className="film-format-glass-badge">
                      {formatPrimary}
                    </span>
                  </div>

                  {/* Bottom Image Overlay Badges */}
                  <div className="film-media-bottom-strip">
                    <div className="film-rating-badge">
                      <span>{movie.rating || 'PG-13'}</span>
                    </div>
                    <div className="film-runtime-badge">
                      <Clock size={11} />
                      <span>{movie.runtime || '150 MIN'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body Details */}
                <div className="admin-film-info">
                  {/* Title & Format Specs */}
                  <div className="film-header-block">
                    <h3 className="film-card-title">{movie.title}</h3>
                    <div className="film-spec-pills">
                      <span className="spec-auditorium-pill">
                        {movie.auditorium.split('—')[0].trim()}
                      </span>
                      <span className="spec-audio-pill">{formatSub}</span>
                    </div>
                  </div>

                  {/* Director & Hall Details */}
                  <div className="film-meta-grid">
                    <div className="film-meta-cell">
                      <Video size={13} className="meta-icon" />
                      <span className="meta-text">Dir. {movie.director || 'Curated Masterpiece'}</span>
                    </div>
                  </div>

                  {/* Tagline */}
                  {movie.tagline && (
                    <p className="film-card-tagline">“{movie.tagline}”</p>
                  )}

                  {/* Showtimes Strip */}
                  <div className="film-showtimes-strip">
                    <div className="showtimes-header">
                      <span className="showtimes-label">DAILY SHOWTIMES:</span>
                      <span className="showtimes-count font-mono">
                        {showtimesArr.length} screenings
                        {movie.upcomingBookings > 0 && ` · ${movie.upcomingBookings} upcoming bookings`}
                      </span>
                    </div>
                    <div className="showtimes-tags-row">
                      {showtimesArr.map((t, idx) => (
                        <div key={idx} className="showtime-tag-bubble">
                          <Clock size={10} className="tag-clock-icon" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="admin-film-actions">
                    <button
                      type="button"
                      onClick={() => onOpenEditModal(movie)}
                      className="film-action-btn edit-btn"
                      title="Edit 70mm presentation details"
                    >
                      <Edit3 size={14} />
                      <span>Edit Film</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteMovie(movie)}
                      className="film-action-btn delete-btn"
                      disabled={movie.upcomingBookings > 0}
                      title={
                        movie.upcomingBookings > 0
                          ? 'Guests hold upcoming seats for this film. Set it to Coming Soon to stop new sales.'
                          : 'Remove film from the repertory'
                      }
                    >
                      <Trash2 size={14} />
                      <span>Withdraw</span>
                    </button>
                    <Link
                      to="/booking"
                      className="film-action-btn view-btn"
                      title="Reserve seats in client booking view"
                    >
                      <span>Reserve</span>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
