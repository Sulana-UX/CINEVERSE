import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { adminApi } from '../services/adminApi';
import { adminBookingsApi } from '../services/adminBookingsApi';
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
import AdminRefundsPanel from '../components/AdminRefundsPanel';

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

const DEFAULT_BACKDROP = '/images/luxury_cinema_interior.jpg';
const POLL_MS = 30000;
const MIN_TEMP = 17;
const MAX_TEMP = 26;

const emptyForm = (auditorium = '') => ({
  title: '',
  format: DEFAULT_FORMATS[0],
  rating: 'PG-13',
  runtime: '150 MIN',
  director: '',
  auditorium,
  tagline: '',
  description: '',
  backdrop: DEFAULT_BACKDROP,
  showtimes: ['14:30', '17:45'],
  status: 'Now Showing',
});

/** "9:30" -> "09:30"; returns null when it is not a valid 24-hour time. */
function normaliseTime(value) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

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

  // Core data, all loaded from the backend
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auditoriums, setAuditoriums] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Cloudinary Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const notifyTimer = useRef(null);

  // Showtimes Checkbox State
  const [availableShowtimes, setAvailableShowtimes] = useState(PRESET_SHOWTIMES);
  const [customTimeInput, setCustomTimeInput] = useState('');

  const [formData, setFormData] = useState(() => emptyForm());
  const [formErrors, setFormErrors] = useState({});

  const notify = useCallback((type, message, ms = 4500) => {
    clearTimeout(notifyTimer.current);
    setNotification({ type, message });
    notifyTimer.current = setTimeout(() => setNotification(null), ms);
  }, []);

  useEffect(() => () => clearTimeout(notifyTimer.current), []);

  const loadMovies = useCallback(async () => {
    try {
      setMovies(await adminApi.listMovies());
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Everything that changes while the cinema is open. */
  const loadLive = useCallback(async () => {
    const results = await Promise.allSettled([
      adminBookingsApi.list(),
      adminApi.listOrders(),
      adminApi.listAuditoriums(),
      adminApi.getStats(),
    ]);
    const [b, o, a, s] = results;
    if (b.status === 'fulfilled') setBookings(b.value);
    if (o.status === 'fulfilled') setOrders(o.value);
    if (a.status === 'fulfilled') setAuditoriums(a.value);
    if (s.status === 'fulfilled') setStats(s.value);
    const failed = results.find((r) => r.status === 'rejected');
    setLoadError(failed ? failed.reason.message : null);
  }, []);

  const reloadAll = useCallback(() => {
    loadMovies();
    loadLive();
  }, [loadMovies, loadLive]);

  useEffect(() => {
    // Initial load, then keep the live numbers fresh.
    const first = setTimeout(reloadAll, 0);
    const id = setInterval(loadLive, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [reloadAll, loadLive]);

  const hallLabels = auditoriums.map((a) => a.label);

  const handleOpenAddModal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setEditingMovieId(null);
    setAvailableShowtimes(PRESET_SHOWTIMES);
    setCustomTimeInput('');
    setFormData(emptyForm(hallLabels[0] || ''));
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (movie) => {
    setEditingMovieId(movie.id);
    setCustomTimeInput('');
    const movieTimes = Array.isArray(movie.showtimes) ? movie.showtimes : [];
    // Merge any custom times present in this film that aren't in preset
    setAvailableShowtimes(Array.from(new Set([...PRESET_SHOWTIMES, ...movieTimes])).sort());

    setFormData({
      title: movie.title,
      format: movie.format || '',
      rating: movie.rating || 'PG-13',
      runtime: movie.runtime || '',
      director: movie.director || '',
      auditorium: movie.auditorium,
      tagline: movie.tagline || '',
      description: movie.description || '',
      backdrop: movie.backdrop || DEFAULT_BACKDROP,
      showtimes: movieTimes,
      status: movie.status || 'Now Showing',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name] || formErrors.form) {
      setFormErrors((prev) => ({ ...prev, [name]: null, form: null }));
    }
  };

  const clearShowtimeError = () => {
    if (formErrors.showtimes) setFormErrors((prev) => ({ ...prev, showtimes: null }));
  };

  const handleToggleShowtime = (time) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.showtimes) ? prev.showtimes : [];
      const updated = current.includes(time) ? current.filter((t) => t !== time) : [...current, time].sort();
      return { ...prev, showtimes: updated };
    });
    clearShowtimeError();
  };

  const handleSelectPresetShowtimes = (presetKey) => {
    if (presetKey === 'prime') {
      setFormData((prev) => ({ ...prev, showtimes: ['14:30', '17:45', '21:15'] }));
    } else if (presetKey === 'all') {
      setFormData((prev) => ({ ...prev, showtimes: [...availableShowtimes] }));
    } else if (presetKey === 'clear') {
      setFormData((prev) => ({ ...prev, showtimes: [] }));
    }
    clearShowtimeError();
  };

  const handleAddCustomTime = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!customTimeInput.trim()) return;
    const cleanTime = normaliseTime(customTimeInput);
    if (!cleanTime) {
      setFormErrors((prev) => ({ ...prev, showtimes: 'Use 24-hour time, for example 18:30.' }));
      return;
    }
    if (!availableShowtimes.includes(cleanTime)) {
      setAvailableShowtimes((prev) => [...prev, cleanTime].sort());
    }
    setFormData((prev) => {
      const current = Array.isArray(prev.showtimes) ? prev.showtimes : [];
      return current.includes(cleanTime) ? prev : { ...prev, showtimes: [...current, cleanTime].sort() };
    });
    setCustomTimeInput('');
    clearShowtimeError();
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim()) {
      notify('warning', 'Poster upload needs VITE_CLOUDINARY_CLOUD_NAME in frontend/.env. You can paste an image link instead.', 6000);
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(15);
      const result = await uploadImageToCloudinary(file, {
        onProgress: (percent) => setUploadProgress(percent),
      });
      setFormData((prev) => ({ ...prev, backdrop: result.url }));
      if (formErrors.backdrop) setFormErrors((prev) => ({ ...prev, backdrop: null }));
      notify('success', 'Poster uploaded.');
    } catch (err) {
      notify('error', `Poster upload failed: ${err.message}`, 6000);
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const errors = {};
    if (!formData.title.trim()) errors.title = 'Film title is required.';
    if (!formData.runtime.trim()) errors.runtime = 'Runtime is required.';
    if (!formData.director.trim()) errors.director = 'Director is required.';
    if (!formData.auditorium) errors.auditorium = 'Choose an auditorium.';
    if (!formData.showtimes.length) errors.showtimes = 'Select at least one daily showtime.';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (editingMovieId) {
        await adminApi.updateMovie(editingMovieId, formData);
        notify('success', `“${formData.title}” has been updated.`);
      } else {
        await adminApi.createMovie(formData);
        notify('success', `“${formData.title}” is now in the CINEVERSE repertory.`);
      }
      setIsModalOpen(false);
      await loadMovies();
      loadLive();
    } catch (err) {
      // Server validation points at the field to fix; keep the form open.
      const field = err.data?.field;
      setFormErrors(field ? { [field]: err.message } : { form: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (movie) => {
    if (!window.confirm(`Remove “${movie.title}” from the repertory? This cannot be undone.`)) return;
    try {
      await adminApi.deleteMovie(movie.id);
      notify('success', `“${movie.title}” has been removed.`);
      await loadMovies();
      loadLive();
    } catch (err) {
      notify('error', err.message, 7000);
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
      notify('error', `Check-in not saved: ${err.message}`, 5000);
    }
  };

  // In-seat service order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    try {
      const saved = await adminApi.setOrderStatus(target.bookingId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? saved : o)));
    } catch (err) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? target : o)));
      notify('error', `Order not updated: ${err.message}`, 5000);
    }
  };

  /** Apply a hall change straight away, then keep what the server saved. */
  const updateHall = async (id, changes, successMessage) => {
    const before = auditoriums;
    setAuditoriums((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)));
    try {
      setAuditoriums(await adminApi.updateAuditorium(id, changes));
      if (successMessage) notify('success', successMessage, 3500);
    } catch (err) {
      setAuditoriums(before);
      notify('error', `Hall not updated: ${err.message}`, 5000);
    }
  };

  const hallById = (id) => auditoriums.find((a) => a.id === id);

  const handleUpdateHallStatus = (id, status) =>
    updateHall(id, { status }, `Auditorium ${hallById(id)?.number || ''} is now in “${status}” mode.`);

  const handleToggleProjector = (id) => updateHall(id, { projectorOn: !hallById(id)?.projectorOn });

  const handleSetLighting = (id, lightingPreset) => updateHall(id, { lightingPreset });

  const handleSetAudio = (id, audioPreset) => updateHall(id, { audioPreset });

  const handleAdjustTemp = (id, delta) => {
    const hall = hallById(id);
    if (!hall) return;
    const temperature = Math.min(MAX_TEMP, Math.max(MIN_TEMP, Math.round((hall.temperature + delta) * 10) / 10));
    if (temperature !== hall.temperature) updateHall(id, { temperature });
  };

  const handleEmergencyLighting = async () => {
    try {
      setAuditoriums(await adminApi.houseLights());
      notify('error', 'House lights are at 100% in every auditorium.', 6000);
    } catch (err) {
      notify('error', `House lights not changed: ${err.message}`, 6000);
    }
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

          {loadError && (
            <div className="admin-toast-banner toast-error" role="alert">
              <AlertTriangle size={18} />
              <span>Could not load dashboard data: {loadError}</span>
              <button type="button" className="toast-close" onClick={reloadAll}>
                Retry
              </button>
            </div>
          )}

          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <AdminOverviewTab
              stats={stats}
              bookings={bookings}
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
            />
          )}

          {/* TAB 3: GUEST RESERVATIONS */}
          {activeTab === 'bookings' && (
            <TabErrorBoundary tabName="Guest Reservations">
              <AdminRefundsPanel onNotify={notify} />
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
                      {!hallLabels.includes(formData.auditorium) && (
                        <option value={formData.auditorium}>
                          {formData.auditorium || 'Choose an auditorium'}
                        </option>
                      )}
                      {hallLabels.map((aud) => (
                        <option key={aud} value={aud}>
                          {aud}
                        </option>
                      ))}
                    </select>
                    {formErrors.auditorium && (
                      <span className="admin-field-error">{formErrors.auditorium}</span>
                    )}
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
                      className={`admin-input ${formErrors.runtime ? 'input-error' : ''}`}
                    />
                    {formErrors.runtime && (
                      <span className="admin-field-error">{formErrors.runtime}</span>
                    )}
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
                      className={`admin-input ${formErrors.backdrop ? 'input-error' : ''}`}
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

                  {formErrors.backdrop && (
                    <span className="admin-field-error">{formErrors.backdrop}</span>
                  )}

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

                {formErrors.form && (
                  <div className="admin-toast-banner toast-error" role="alert">
                    <AlertTriangle size={16} />
                    <span>{formErrors.form}</span>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="admin-modal-actions">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="admin-cancel-btn"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="admin-submit-btn" disabled={saving || uploadingImage}>
                    {saving && <Loader2 size={15} className="spin-loader" />}
                    <span>
                      {saving
                        ? 'Saving…'
                        : editingMovieId
                          ? 'Update Film Presentation'
                          : 'Publish Film to Cineverse'}
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
