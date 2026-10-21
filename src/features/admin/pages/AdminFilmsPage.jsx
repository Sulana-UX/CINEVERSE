import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Film,
  Plus,
  Trash2,
  Edit3,
  ArrowLeft,
  Sparkles,
  Clock,
  Video,
  CheckCircle2,
  X,
  ExternalLink,
  Upload,
  Loader2,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { movieService } from '../services/movieService';
import { uploadImageToCloudinary } from '../../../lib/cloudinary';
import { useAuth } from '../../auth/hooks/useAuth';

const DEFAULT_AUDITORIUMS = [
  'Auditorium 01 — The Sovereign Soundstage',
  'Auditorium 02 — The Director’s Loge',
  'Auditorium 03 — The Quantum Chamber',
];

const DEFAULT_FORMATS = [
  '70MM DUAL LASER • DOLBY ATMOS',
  '70MM ULTRA PANAVISION • 6-TRACK STEREO',
  '10TH ANNIVERSARY 70MM PRESENTATION',
  'IMAX LASER 3D • IMMERSIVE ACOUSTICS',
  '35MM RESTORED ARCHIVAL PRINT',
];

export default function AdminFilmsPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cloudinary Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    format: DEFAULT_FORMATS[0],
    rating: 'PG-13',
    runtime: '150 MIN',
    director: '',
    auditorium: DEFAULT_AUDITORIUMS[0],
    tagline: '',
    description: '',
    backdrop: '/images/luxury_cinema_interior.jpg',
    showtimes: '14:30, 18:00, 21:15',
    status: 'Now Showing',
  });

  const [formErrors, setFormErrors] = useState({});

  // Load movies on mount
  useEffect(() => {
    let isMounted = true;
    movieService.getAllMovies().then(({ data }) => {
      if (isMounted) {
        setMovies(data || []);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const loadMovies = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    const { data } = await movieService.getAllMovies();
    setMovies(data || []);
    setLoading(false);
  };

  const { logout } = useAuth();

  const handleAdminLogout = async () => {
    await logout();
  };

  const handleRestoreDefaults = () => {
    const defaults = movieService.resetToDefaultCatalog();
    setMovies(defaults);
    setNotification({
      type: 'success',
      message: 'Default 70mm repertory catalog restored successfully!',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAddModal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setEditingMovieId(null);
    setFormData({
      title: '',
      format: DEFAULT_FORMATS[0],
      rating: 'PG-13',
      runtime: '150 MIN',
      director: '',
      auditorium: DEFAULT_AUDITORIUMS[0],
      tagline: '',
      description: '',
      backdrop: '/images/luxury_cinema_interior.jpg',
      showtimes: '14:30, 18:00, 21:15',
      status: 'Now Showing',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (movie) => {
    setEditingMovieId(movie.id);
    setFormData({
      title: movie.title,
      format: movie.format,
      rating: movie.rating,
      runtime: movie.runtime,
      director: movie.director || '',
      auditorium: movie.auditorium,
      tagline: movie.tagline || '',
      description: movie.description || '',
      backdrop: movie.backdrop || '/images/luxury_cinema_interior.jpg',
      showtimes: Array.isArray(movie.showtimes) ? movie.showtimes.join(', ') : movie.showtimes,
      status: movie.status || 'Now Showing',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    // If Cloudinary cloud name is configured, upload directly to Cloudinary CDN
    if (cloudName && cloudName.trim()) {
      try {
        setUploadingImage(true);
        setUploadProgress(15);

        const result = await uploadImageToCloudinary(file, {
          onProgress: (percent) => setUploadProgress(percent),
        });

        setFormData((prev) => ({ ...prev, backdrop: result.url }));
        setNotification({
          type: 'success',
          message: 'Poster uploaded to Cloudinary CDN! Image URL ready.',
        });
        setTimeout(() => setNotification(null), 4000);
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        setNotification({
          type: 'error',
          message: `Cloudinary upload failed: ${err.message}`,
        });

        // Local fallback for preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({ ...prev, backdrop: reader.result }));
        };
        reader.readAsDataURL(file);
      } finally {
        setUploadingImage(false);
        setUploadProgress(0);
      }
    } else {
      // Cloud name not yet configured: provide local preview and notification
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, backdrop: reader.result }));
      };
      reader.readAsDataURL(file);

      setNotification({
        type: 'warning',
        message: 'Cloudinary Cloud Name is not configured in .env yet. Using local preview.',
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic Validation
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Film title is required.';
    if (!formData.runtime.trim()) errors.runtime = 'Runtime is required.';
    if (!formData.director.trim()) errors.director = 'Director is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const showtimesArray = formData.showtimes
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const moviePayload = {
      ...formData,
      showtimes: showtimesArray.length > 0 ? showtimesArray : ['14:30', '18:00', '21:15'],
    };

    if (editingMovieId) {
      await movieService.updateMovie(editingMovieId, moviePayload);
      setNotification({
        type: 'success',
        message: `“${formData.title}” has been successfully updated.`,
      });
    } else {
      await movieService.createMovie(moviePayload);
      setNotification({
        type: 'success',
        message: `“${formData.title}” has been published to CINEVERSE repertory!`,
      });
    }

    setIsModalOpen(false);
    await loadMovies();

    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleDelete = async (movie) => {
    if (window.confirm(`Are you certain you wish to withdraw “${movie.title}” from repertory?`)) {
      await movieService.deleteMovie(movie.id);
      setNotification({
        type: 'success',
        message: `“${movie.title}” has been removed from repertory.`,
      });
      await loadMovies();

      setTimeout(() => {
        setNotification(null);
      }, 4500);
    }
  };

  return (
    <div className="admin-page-root">
      {/* Admin Top Navigation */}
      <header className="admin-header-bar">
        <div className="container">
          <div className="admin-header-inner">
            <div className="admin-header-left">
              <Link to="/" className="admin-back-btn">
                <ArrowLeft size={16} />
                <span>Return to Cinema</span>
              </Link>
              <div className="admin-brand-wrap">
                <Film size={20} className="gold-icon" />
                <span className="admin-brand-title">CINEVERSE</span>
                <span className="admin-portal-badge">ADMIN CONCIERGE</span>
              </div>
            </div>

            <div className="admin-header-right">
              <Link to="/booking" className="admin-view-booking-link">
                <span>View Public Booking</span>
                <ExternalLink size={14} />
              </Link>
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="admin-restore-btn"
                title="Restore default 70mm repertory catalog"
                style={{ padding: '0.65rem 0.95rem', fontSize: '0.72rem' }}
              >
                <RotateCcw size={13} />
                <span>Default Catalog</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="admin-primary-btn"
              >
                <Plus size={16} />
                <span>UPLOAD NEW FILM</span>
              </button>
              <button
                type="button"
                onClick={handleAdminLogout}
                className="admin-logout-btn"
                title="Sign out of Admin session"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="admin-main">
        <div className="container">
          {/* Toast Notification */}
          {notification && (
            <div className="admin-toast-banner" role="status">
              <CheckCircle2 size={18} className="gold-icon" />
              <span>{notification.message}</span>
              <button
                type="button"
                className="toast-close"
                onClick={() => setNotification(null)}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Admin Stats Strip */}
          <div className="admin-stats-strip">
            <div className="admin-stat-card">
              <span className="stat-label">TOTAL REPERTORY FILMS</span>
              <span className="stat-number">{movies.length}</span>
            </div>
            <div className="admin-stat-card">
              <span className="stat-label">NOW SHOWING</span>
              <span className="stat-number gold-stat">
                {movies.filter((m) => m.status === 'Now Showing').length}
              </span>
            </div>
            <div className="admin-stat-card">
              <span className="stat-label">AUDITORIUM SOUNDSTAGES</span>
              <span className="stat-number">03</span>
            </div>
          </div>

          {/* Film Library Section */}
          <div className="admin-section-header">
            <div className="section-title-wrap">
              <Sparkles size={16} className="gold-icon" />
              <h2 className="admin-section-title">Repertory Film Archive</h2>
            </div>
            <p className="admin-section-subtitle">
              Manage architectural screenings, 70mm presentations, and showtimes displayed across CINEVERSE.
            </p>
          </div>

          {/* Movies Cards Grid / Empty State */}
          {loading ? (
            <div className="admin-loading-state">
              <div className="admin-spinner" />
              <span>Loading Repertory Archive...</span>
            </div>
          ) : movies.length === 0 ? (
            <div className="admin-empty-state">
              <Film size={44} className="gold-icon admin-empty-icon" />
              <h3 className="admin-empty-title">No Repertory Films in Archive</h3>
              <p className="admin-empty-desc">
                Your cinema library is currently empty. Upload your first 70mm presentation or restore the default repertory catalog.
              </p>
              <div className="admin-empty-actions">
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="admin-primary-btn"
                >
                  <Plus size={16} />
                  <span>UPLOAD FIRST FILM</span>
                </button>
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  className="admin-restore-btn"
                >
                  <RotateCcw size={15} />
                  <span>RESTORE DEFAULT CATALOG</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-films-grid">
              {movies.map((movie) => (
                <div key={movie.id} className="admin-film-card">
                  {/* Backdrop Preview */}
                  <div className="admin-film-media">
                    <img
                      src={movie.backdrop || '/images/luxury_cinema_interior.jpg'}
                      alt={movie.title}
                      className="admin-film-img"
                    />
                    <div className="admin-film-overlay" />
                    <span className="admin-status-pill">{movie.status}</span>
                    <span className="admin-format-tag">{movie.format.split('•')[0]}</span>
                  </div>

                  {/* Card Content */}
                  <div className="admin-film-info">
                    <div className="film-info-top">
                      <h3 className="film-card-title">{movie.title}</h3>
                      <span className="film-card-rating">{movie.rating}</span>
                    </div>

                    <p className="film-card-auditorium">{movie.auditorium}</p>

                    <div className="film-card-meta">
                      <span className="meta-item">
                        <Clock size={13} />
                        {movie.runtime}
                      </span>
                      <span className="meta-item">
                        <Video size={13} />
                        Dir. {movie.director || 'Curated'}
                      </span>
                    </div>

                    {movie.tagline && (
                      <p className="film-card-tagline">“{movie.tagline}”</p>
                    )}

                    {/* Showtimes tags */}
                    <div className="film-showtimes-strip">
                      <span className="showtimes-label">SHOWTIMES:</span>
                      <div className="showtimes-tags">
                        {(Array.isArray(movie.showtimes) ? movie.showtimes : [movie.showtimes]).map(
                          (t, i) => (
                            <span key={i} className="showtime-tag">
                              {t}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="film-card-actions">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(movie)}
                        className="film-action-btn edit-btn"
                        title="Edit Film"
                      >
                        <Edit3 size={15} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(movie)}
                        className="film-action-btn delete-btn"
                        title="Delete Film"
                      >
                        <Trash2 size={15} />
                        <span>Withdraw</span>
                      </button>
                      <Link
                        to="/booking"
                        className="film-action-btn view-btn"
                        title="Book This Film"
                      >
                        <span>Reserve</span>
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* =========================================================================
          UPLOAD & EDIT FILM MODAL (Rendered via Portal to document.body)
          ========================================================================= */}
      {isModalOpen &&
        createPortal(
          <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-card">
            <button
              type="button"
              className="admin-modal-close"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className="admin-modal-header">
              <div className="modal-icon-badge">
                <Film size={22} className="gold-icon" />
              </div>
              <h3 className="admin-modal-title">
                {editingMovieId ? 'Edit Repertory Film' : 'Upload New Cinema Presentation'}
              </h3>
              <p className="admin-modal-subtitle">
                Publish a 70mm presentation to CINEVERSE with format, showtimes, and imagery.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="admin-modal-form">
              {/* Row 1: Title & Director */}
              <div className="form-row two-cols">
                <div className="admin-field-group">
                  <label className="admin-label" htmlFor="film-title">
                    Film Title *
                  </label>
                  <input
                    type="text"
                    id="film-title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. GLADIATOR II"
                    className={`admin-input ${formErrors.title ? 'input-error' : ''}`}
                    required
                  />
                  {formErrors.title && (
                    <span className="admin-field-error">{formErrors.title}</span>
                  )}
                </div>

                <div className="admin-field-group">
                  <label className="admin-label" htmlFor="film-director">
                    Director *
                  </label>
                  <input
                    type="text"
                    id="film-director"
                    name="director"
                    value={formData.director}
                    onChange={handleChange}
                    placeholder="e.g. Ridley Scott"
                    className={`admin-input ${formErrors.director ? 'input-error' : ''}`}
                    required
                  />
                  {formErrors.director && (
                    <span className="admin-field-error">{formErrors.director}</span>
                  )}
                </div>
              </div>

              {/* Row 2: Format & Auditorium */}
              <div className="form-row two-cols">
                <div className="admin-field-group">
                  <label className="admin-label" htmlFor="film-format">
                    Projection & Sound Format
                  </label>
                  <input
                    list="format-presets"
                    id="film-format"
                    name="format"
                    value={formData.format}
                    onChange={handleChange}
                    placeholder="70MM DUAL LASER • DOLBY ATMOS"
                    className="admin-input"
                  />
                  <datalist id="format-presets">
                    {DEFAULT_FORMATS.map((fmt, i) => (
                      <option key={i} value={fmt} />
                    ))}
                  </datalist>
                </div>

                <div className="admin-field-group">
                  <label className="admin-label" htmlFor="film-auditorium">
                    Auditorium Soundstage
                  </label>
                  <select
                    id="film-auditorium"
                    name="auditorium"
                    value={formData.auditorium}
                    onChange={handleChange}
                    className="admin-input admin-select"
                  >
                    {DEFAULT_AUDITORIUMS.map((aud, i) => (
                      <option key={i} value={aud}>
                        {aud}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Rating, Runtime, Status */}
              <div className="form-row three-cols">
                <div className="admin-field-group">
                  <label className="admin-label" htmlFor="film-rating">
                    Age Rating
                  </label>
                  <select
                    id="film-rating"
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    className="admin-input admin-select"
                  >
                    <option value="G">G — General</option>
                    <option value="PG">PG — Parental Guidance</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R — Restricted</option>
                    <option value="NC-17">NC-17</option>
                  </select>
                </div>

                <div className="admin-field-group">
                  <label className="admin-label" htmlFor="film-runtime">
                    Runtime
                  </label>
                  <input
                    type="text"
                    id="film-runtime"
                    name="runtime"
                    value={formData.runtime}
                    onChange={handleChange}
                    placeholder="e.g. 155 MIN"
                    className="admin-input"
                  />
                </div>

                <div className="admin-field-group">
                  <label className="admin-label" htmlFor="film-status">
                    Repertory Status
                  </label>
                  <select
                    id="film-status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="admin-input admin-select"
                  >
                    <option value="Now Showing">Now Showing</option>
                    <option value="Coming Soon">Coming Soon</option>
                    <option value="Special Archive">Special Archive</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Backdrop Image (Cloudinary CDN or Direct URL) */}
              <div className="admin-field-group">
                <label className="admin-label">
                  Backdrop Poster / Photograph (Cloudinary CDN)
                </label>
                <div className="admin-image-input-wrap">
                  <input
                    type="text"
                    name="backdrop"
                    value={formData.backdrop}
                    onChange={handleChange}
                    placeholder="https://res.cloudinary.com/... or /images/..."
                    className="admin-input"
                  />
                  <label
                    className={`admin-file-upload-btn ${uploadingImage ? 'is-uploading' : ''}`}
                    title={uploadingImage ? 'Uploading...' : 'Upload Image to Cloudinary'}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 size={14} className="spin-loader" />
                        <span>Uploading {uploadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Upload Poster</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {uploadingImage && (
                  <div className="cloudinary-progress-bar">
                    <div
                      className="cloudinary-progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {/* Live Preview */}
                {formData.backdrop && (
                  <div className="admin-image-preview">
                    <img
                      src={formData.backdrop}
                      alt="Preview"
                      className="preview-img"
                    />
                    <div className="preview-meta">
                      <span className="preview-label">Live Visual Preview</span>
                      {formData.backdrop.includes('cloudinary.com') && (
                        <span className="cloudinary-badge">Cloudinary CDN Synced</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 5: Tagline & Showtimes */}
              <div className="form-row two-cols">
                <div className="admin-field-group">
                  <label className="admin-label" htmlFor="film-tagline">
                    Tagline
                  </label>
                  <input
                    type="text"
                    id="film-tagline"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    placeholder="e.g. What we do in life echoes in eternity."
                    className="admin-input"
                  />
                </div>

                <div className="admin-field-group">
                  <label className="admin-label" htmlFor="film-showtimes">
                    Daily Showtimes (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="film-showtimes"
                    name="showtimes"
                    value={formData.showtimes}
                    onChange={handleChange}
                    placeholder="14:30, 18:00, 21:15"
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Row 6: Synopsis */}
              <div className="admin-field-group">
                <label className="admin-label" htmlFor="film-description">
                  Film Synopsis
                </label>
                <textarea
                  id="film-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter a captivating overview of the cinematic experience..."
                  className="admin-input admin-textarea"
                />
              </div>

              {/* Modal Actions */}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="admin-cancel-btn"
                >
                  CANCEL
                </button>
                <button type="submit" className="admin-submit-btn">
                  <span>
                    {editingMovieId ? 'UPDATE FILM PRESENTATION' : 'PUBLISH FILM TO CINEVERSE'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
