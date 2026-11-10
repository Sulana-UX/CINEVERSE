import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Film,
  Plus,
  CheckCircle2,
  X,
  Upload,
  Loader2,
  RotateCcw,
  Check,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { movieService } from '../services/movieService';
import { adminDataService } from '../services/adminDataService';
import { adminBookingsApi, computeDashboardMetrics } from '../services/adminBookingsApi';
import { uploadImageToCloudinary } from '../../../lib/cloudinary';

// Executive Dashboard Components
import AdminSidebar from '../components/AdminSidebar';
import AdminTopBar from '../components/AdminTopBar';
import AdminOverviewTab from '../components/AdminOverviewTab';
import AdminFilmsTab from '../components/AdminFilmsTab';
import AdminBookingsTab from '../components/AdminBookingsTab';
import AdminAuditoriumsTab from '../components/AdminAuditoriumsTab';
import AdminConciergeTab from '../components/AdminConciergeTab';
import TabErrorBoundary from '../components/TabErrorBoundary';

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

const PRESET_SHOWTIMES = [
  '11:00',
  '13:30',
  '14:30',
  '16:00',
  '17:45',
  '19:15',
  '20:30',
  '21:15',
  '22:30',
  '23:00',
];

export default function AdminFilmsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('cineverse.admin.sidebarCollapsed') === '1';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cineverse.admin.sidebarCollapsed', next ? '1' : '0');
      } catch {
        /* storage unavailable: keep in-memory state only */
      }
      return next;
    });
  };

  // Ctrl/Cmd + B toggles the sidebar rail on desktop
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
        e.preventDefault();
        toggleSidebarCollapsed();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Core Data
  const [movies, setMovies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsError, setBookingsError] = useState(null);
  const [orders, setOrders] = useState(() => adminDataService.getConciergeOrders());
  const [auditoriums, setAuditoriums] = useState(() => adminDataService.getAuditoriums());
  const [loading, setLoading] = useState(true);

  // Cloudinary Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Showtimes Checkbox State
  const [availableShowtimes, setAvailableShowtimes] = useState(PRESET_SHOWTIMES);
  const [customTimeInput, setCustomTimeInput] = useState('');

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
    showtimes: ['14:30', '17:45', '20:30'],
    status: 'Now Showing',
  });

  const [formErrors, setFormErrors] = useState({});


  // Paid bookings come from the database via the backend.
  const loadBookings = async () => {
    try {
      setBookings(await adminBookingsApi.list());
      setBookingsError(null);
    } catch (err) {
      setBookingsError(err.message);
    }
  };

  useEffect(() => {
    loadBookings();
    const id = setInterval(loadBookings, 30000);
    return () => clearInterval(id);
  }, []);

  const metrics = useMemo(
    () => computeDashboardMetrics(bookings, orders, auditoriums),
    [bookings, orders, auditoriums]
  );

  // Load initial repertory movies
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

  const refreshMovies = async () => {
    const { data } = await movieService.getAllMovies();
    setMovies(data || []);
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
    setAvailableShowtimes(PRESET_SHOWTIMES);
    setCustomTimeInput('');
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
      showtimes: ['14:30', '17:45', '20:30'],
      status: 'Now Showing',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (movie) => {
    setEditingMovieId(movie.id);
    setCustomTimeInput('');

    const movieTimes = Array.isArray(movie.showtimes)
      ? movie.showtimes
      : (typeof movie.showtimes === 'string'
          ? movie.showtimes.split(',').map((t) => t.trim()).filter(Boolean)
          : ['14:30', '17:45', '20:30']);

    // Merge any custom times present in this film that aren't in preset
    const mergedTimes = Array.from(new Set([...PRESET_SHOWTIMES, ...movieTimes])).sort();
    setAvailableShowtimes(mergedTimes);

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
      showtimes: movieTimes,
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

  const handleToggleShowtime = (time) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.showtimes) ? prev.showtimes : [];
      const exists = current.includes(time);
      const updated = exists
        ? current.filter((t) => t !== time)
        : [...current, time].sort();
      return { ...prev, showtimes: updated };
    });
    if (formErrors.showtimes) {
      setFormErrors((prev) => ({ ...prev, showtimes: null }));
    }
  };

  const handleSelectPresetShowtimes = (presetKey) => {
    if (presetKey === 'prime') {
      setFormData((prev) => ({ ...prev, showtimes: ['14:30', '17:45', '20:30', '21:15'] }));
    } else if (presetKey === 'all') {
      setFormData((prev) => ({ ...prev, showtimes: [...availableShowtimes] }));
    } else if (presetKey === 'clear') {
      setFormData((prev) => ({ ...prev, showtimes: [] }));
    }
    if (formErrors.showtimes) {
      setFormErrors((prev) => ({ ...prev, showtimes: null }));
    }
  };

  const handleAddCustomTime = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanTime = customTimeInput.trim();
    if (!cleanTime) return;

    if (!availableShowtimes.includes(cleanTime)) {
      setAvailableShowtimes((prev) => [...prev, cleanTime].sort());
    }

    setFormData((prev) => {
      const current = Array.isArray(prev.showtimes) ? prev.showtimes : [];
      if (!current.includes(cleanTime)) {
        return { ...prev, showtimes: [...current, cleanTime].sort() };
      }
      return prev;
    });

    setCustomTimeInput('');
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

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
        setNotification({
          type: 'error',
          message: `Cloudinary upload failed: ${err.message}`,
        });

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

    const errors = {};
    if (!formData.title.trim()) errors.title = 'Film title is required.';
    if (!formData.runtime.trim()) errors.runtime = 'Runtime is required.';
    if (!formData.director.trim()) errors.director = 'Director is required.';

    const showtimesArray = Array.isArray(formData.showtimes)
      ? formData.showtimes
      : (typeof formData.showtimes === 'string'
          ? formData.showtimes.split(',').map((t) => t.trim()).filter(Boolean)
          : []);

    if (showtimesArray.length === 0) {
      errors.showtimes = 'Please select at least one daily showtime for this presentation.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const moviePayload = {
      ...formData,
      showtimes: showtimesArray,
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
    await refreshMovies();

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
      await refreshMovies();

      setTimeout(() => {
        setNotification(null);
      }, 4500);
    }
  };

  // Toggle check-in on booking
  const handleToggleCheckIn = async (bookingRef) => {
    const target = bookings.find((b) => b.id === bookingRef);
    if (!target) return;
    // Optimistic update, rolled back if the server refuses.
    setBookings((prev) => prev.map((b) => (b.id === bookingRef ? { ...b, checkedIn: !b.checkedIn } : b)));
    try {
      const saved = await adminBookingsApi.setCheckIn(target.dbId, !target.checkedIn);
      setBookings((prev) => prev.map((b) => (b.id === bookingRef ? saved : b)));
    } catch (err) {
      setBookings((prev) => prev.map((b) => (b.id === bookingRef ? target : b)));
      setNotification({ type: 'error', message: `Check-in not saved: ${err.message}` });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Update concierge order status
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    const updated = adminDataService.updateOrderStatus(orderId, newStatus);
    setOrders(updated);
  };

  // Soundstage / Auditorium Interactive Controls
  const handleUpdateHallStatus = (id, status) => {
    const updated = adminDataService.setHallStatus(id, status);
    setAuditoriums(updated);
    setNotification({
      type: 'success',
      message: `Auditorium ${id.replace('aud-', '')} switched to "${status}" mode.`,
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleProjector = (id) => {
    const updated = adminDataService.toggleProjectorPower(id);
    setAuditoriums(updated);
  };

  const handleSetLighting = (id, preset) => {
    const updated = adminDataService.setHallLighting(id, preset);
    setAuditoriums(updated);
  };

  const handleSetAudio = (id, preset) => {
    const updated = adminDataService.setHallAudioPreset(id, preset);
    setAuditoriums(updated);
  };

  const handleAdjustTemp = (id, delta) => {
    const updated = adminDataService.adjustHallTemperature(id, delta);
    setAuditoriums(updated);
  };

  const handleEmergencyLighting = () => {
    const updated = adminDataService.triggerEmergencyLightingAll();
    setAuditoriums(updated);
    setNotification({
      type: 'error',
      message: '🚨 EMERGENCY: 100% Full House Lighting activated across all soundstages!',
    });
    setTimeout(() => setNotification(null), 5000);
  };


  return (
    <div className="admin-dashboard-layout">
      {/* 1. Left Executive Navigation Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        mobileOpen={mobileSidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobileSidebarOpen(false);
        }}
      />

      {mobileSidebarOpen && (
        <div
          className="admin-sidebar-scrim"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. Main Executive Viewport */}
      <div className="admin-main-viewport">
        {/* Top Bar with Live Cinema Clock & Global + Upload Button */}
        <AdminTopBar
          activeTab={activeTab}
          onOpenUploadModal={handleOpenAddModal}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        />

        {/* Tab Viewport Body */}
        <div className="admin-tab-body">
          {/* Toast Notification Banner */}
          {notification && (
            <div
              className={`admin-toast-banner ${
                notification.type === 'error'
                  ? 'toast-error'
                  : notification.type === 'warning'
                    ? 'toast-warning'
                    : ''
              }`}
              role={notification.type === 'error' ? 'alert' : 'status'}
            >
              {notification.type === 'error' || notification.type === 'warning' ? (
                <AlertTriangle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
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

          {bookingsError && (activeTab === 'overview' || activeTab === 'bookings') && (
            <div className="admin-toast-banner toast-error" role="alert">
              <AlertTriangle size={18} />
              <span>Could not load bookings from the server: {bookingsError}</span>
              <button type="button" className="toast-close" onClick={loadBookings}>
                Retry
              </button>
            </div>
          )}

          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <AdminOverviewTab
              metrics={metrics}
              bookings={bookings}
              movies={movies}
              onNavigateTab={setActiveTab}
              onOpenUploadModal={handleOpenAddModal}
            />
          )}

          {/* TAB 2: REPERTORY FILM ARCHIVE */}
          {activeTab === 'films' && (
            <AdminFilmsTab
              movies={movies}
              loading={loading}
              onOpenAddModal={handleOpenAddModal}
              onOpenEditModal={handleOpenEditModal}
              onDeleteMovie={handleDelete}
              onRestoreDefaults={handleRestoreDefaults}
            />
          )}

          {/* TAB 3: GUEST RESERVATIONS */}
          {activeTab === 'bookings' && (
            <TabErrorBoundary tabName="Guest Reservations">
              <AdminBookingsTab
                bookings={bookings}
                onToggleCheckIn={handleToggleCheckIn}
              />
            </TabErrorBoundary>
          )}

          {/* TAB 4: SOUNDSTAGES & AUDITORIUMS */}
          {activeTab === 'auditoriums' && (
            <AdminAuditoriumsTab
              auditoriums={auditoriums}
              onUpdateHallStatus={handleUpdateHallStatus}
              onToggleProjector={handleToggleProjector}
              onSetLighting={handleSetLighting}
              onSetAudio={handleSetAudio}
              onAdjustTemp={handleAdjustTemp}
              onEmergencyLighting={handleEmergencyLighting}
            />
          )}

          {/* TAB 5: VIP CONCIERGE BAR */}
          {activeTab === 'concierge' && (
            <AdminConciergeTab
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}
        </div>
      </div>

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
                  Publish a 70mm presentation to CINEVERSE with Cloudinary CDN imagery and acoustic specifications.
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
                      title={uploadingImage ? 'Uploading to Cloudinary...' : 'Upload Image from Computer'}
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

                {/* Row 5: Tagline */}
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
                    placeholder="e.g. Beyond the edge of existence."
                    className="admin-input"
                  />
                </div>

                {/* Row 6: Daily Showtimes Checkboxes Suite */}
                <div className="admin-field-group admin-showtimes-group">
                  <div className="admin-showtimes-header">
                    <div className="admin-showtimes-label-wrap">
                      <label className="admin-label" style={{ marginBottom: 0 }}>
                        Daily Repertory Showtimes
                      </label>
                      <span className="admin-showtimes-count-badge">
                        {(Array.isArray(formData.showtimes) ? formData.showtimes.length : 0)} Selected
                      </span>
                    </div>

                    {/* Quick action preset buttons */}
                    <div className="showtime-quick-actions">
                      <button
                        type="button"
                        onClick={() => handleSelectPresetShowtimes('prime')}
                        className="quick-preset-btn"
                        title="Select common prime evening slots (14:30, 17:45, 20:30, 21:15)"
                      >
                        <Sparkles size={11} className="quick-btn-icon" />
                        <span>Prime Slots</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPresetShowtimes('all')}
                        className="quick-preset-btn"
                        title="Select all available time slots"
                      >
                        <Check size={11} strokeWidth={2.5} className="quick-btn-icon" />
                        <span>Select All</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPresetShowtimes('clear')}
                        className="quick-preset-btn clear-btn"
                        title="Clear all selected showtimes"
                      >
                        <RotateCcw size={10} className="quick-btn-icon" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkbox Grid */}
                  <div className="admin-showtimes-grid">
                    {availableShowtimes.map((time) => {
                      const isChecked = Array.isArray(formData.showtimes) && formData.showtimes.includes(time);
                      return (
                        <label
                          key={time}
                          className={`showtime-checkbox-pill ${isChecked ? 'is-selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleShowtime(time)}
                            className="showtime-hidden-checkbox"
                          />
                          <span className="showtime-custom-checkbox">
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span className="showtime-pill-text">{time}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Add Custom Showtime Row */}
                  <div className="admin-custom-time-row">
                    <span className="custom-time-hint">Need a custom screening time?</span>
                    <div className="custom-time-box">
                      <input
                        type="text"
                        value={customTimeInput}
                        onChange={(e) => setCustomTimeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomTime();
                          }
                        }}
                        placeholder="e.g. 18:30"
                        className="admin-input custom-time-input"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTime}
                        className="custom-time-add-btn"
                      >
                        <Plus size={13} />
                        <span>Add Slot</span>
                      </button>
                    </div>
                  </div>

                  {formErrors.showtimes && (
                    <span className="admin-field-error" style={{ marginTop: '0.5rem', color: 'var(--adm-danger-text)', fontSize: '0.75rem', fontWeight: 600 }}>
                      {formErrors.showtimes}
                    </span>
                  )}
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
                    Cancel
                  </button>
                  <button type="submit" className="admin-submit-btn">
                    <span>
                      {editingMovieId ? 'Update Film Presentation' : 'Publish Film to Cineverse'}
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
