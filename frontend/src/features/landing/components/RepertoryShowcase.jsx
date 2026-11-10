import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Clock, Video, Sparkles, ArrowRight, Ticket } from 'lucide-react';
import { movieService } from '../../admin/services/movieService';

export default function RepertoryShowcase() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    async function fetchRepertory() {
      const { data } = await movieService.getAllMovies();
      if (isMounted) {
        setMovies(data || []);
        setLoading(false);
      }
    }
    fetchRepertory();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMovies = movies.filter((m) => {
    if (filter === 'ALL') return true;
    return m.status === filter;
  });

  const handleBookMovie = (movie) => {
    navigate(`/booking?movie=${movie.id}`);
  };

  return (
    <section id="films" className="repertory-section">
      <div className="container">
        {/* Section Header */}
        <div className="repertory-header">
          <div className="repertory-eyebrow">
            <Sparkles size={14} className="gold-icon" />
            <span>ARCHITECTURAL 70MM REPERTORY</span>
          </div>
          <h2 className="repertory-title">Masterpieces on the Grand Canvas.</h2>
          <p className="repertory-subtitle">
            Curated historical epics and modern visual triumphs presented on 70mm dual laser
            and mechanical archival film stock with uncompressed spatial acoustics.
          </p>

          {/* Filter Chips */}
          <div className="repertory-filter-bar">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`repertory-filter-chip ${filter === 'ALL' ? 'active' : ''}`}
            >
              All Presentations ({movies.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('Now Showing')}
              className={`repertory-filter-chip ${filter === 'Now Showing' ? 'active' : ''}`}
            >
              Now Showing ({movies.filter((m) => m.status === 'Now Showing').length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('Coming Soon')}
              className={`repertory-filter-chip ${filter === 'Coming Soon' ? 'active' : ''}`}
            >
              Coming Soon ({movies.filter((m) => m.status === 'Coming Soon').length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('Special Archive')}
              className={`repertory-filter-chip ${filter === 'Special Archive' ? 'active' : ''}`}
            >
              Special Archive ({movies.filter((m) => m.status === 'Special Archive').length})
            </button>
          </div>
        </div>

        {/* Films Showcase Grid */}
        {loading ? (
          <div className="repertory-loading-state">
            <div className="repertory-spinner" />
            <span>Loading Repertory Archive...</span>
          </div>
        ) : (
          <div className="repertory-films-grid">
            {filteredMovies.length === 0 && (
              <p className="repertory-empty">No presentations in this category yet.</p>
            )}
            {filteredMovies.map((movie) => (
              <div key={movie.id} className="showcase-film-card">
                {/* Media Container with Cloudinary CDN Image */}
                <div className="showcase-media">
                  {/* Blurred copy fills the frame so any poster ratio shows in full */}
                  <img
                    src={movie.backdrop || '/images/luxury_cinema_interior.jpg'}
                    alt=""
                    aria-hidden="true"
                    className="showcase-img-ambient"
                    loading="lazy"
                  />
                  <img
                    src={movie.backdrop || '/images/luxury_cinema_interior.jpg'}
                    alt={`${movie.title} poster`}
                    className="showcase-img"
                    loading="lazy"
                  />
                  <div className="showcase-gradient-overlay" />
                  <div className="showcase-badges-top">
                    <span
                      className={`showcase-status-badge status-${(movie.status || '')
                        .toLowerCase()
                        .replace(/\s+/g, '-')}`}
                    >
                      <span className="status-dot" />
                      {movie.status}
                    </span>
                    <span className="showcase-rating-badge">{movie.rating}</span>
                  </div>
                </div>

                {/* Film Information */}
                <div className="showcase-body">
                  <span className="showcase-auditorium">{movie.auditorium}</span>
                  <h3 className="showcase-title">{movie.title}</h3>

                  <div className="showcase-meta-row">
                    <span className="meta-item">
                      <Clock size={13} />
                      {movie.runtime}
                    </span>
                    <span className="meta-item">
                      <Video size={13} />
                      Dir. {movie.director || 'Curated'}
                    </span>
                  </div>

                  {movie.format && (
                    <span className="showcase-format-tag">{movie.format}</span>
                  )}

                  {movie.tagline && (
                    <p className="showcase-tagline">“{movie.tagline}”</p>
                  )}

                  {/* Showtimes Strip */}
                  <div className="showcase-showtimes-wrap">
                    <span className="showtimes-label">DAILY PRESENTATIONS:</span>
                    <div className="showtimes-row">
                      {(Array.isArray(movie.showtimes) ? movie.showtimes : [movie.showtimes]).map(
                        (time, i) => (
                          <span key={i} className="showcase-time-pill">
                            {time}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Action Button: Reserve Seats */}
                  <div className="showcase-card-footer">
                    <button
                      type="button"
                      onClick={() => handleBookMovie(movie)}
                      className="showcase-reserve-btn"
                    >
                      <Ticket size={16} />
                      <span>RESERVE SEATS</span>
                      <ArrowRight size={14} className="btn-arrow" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Banner */}
        <div className="repertory-bottom-banner">
          <div className="banner-left">
            <Film size={22} className="gold-icon" />
            <div>
              <h4 className="banner-title">Private Soundstage Screenings & VIP Loges</h4>
              <p className="banner-desc">
                Book sovereign recliners with in-seat sommelier champagne delivery.
              </p>
            </div>
          </div>
          <Link to="/booking" className="banner-cta-btn">
            <span>Explore All Soundstages</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
