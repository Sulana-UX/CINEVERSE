import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Info, Lock, LogIn, ShieldCheck, Sparkles, UserPlus, X } from 'lucide-react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { useAuth } from '../../auth/hooks/useAuth';
import { movieService } from '../../admin/services/movieService';
import { formatLKR } from '../../../utils/currency';
import BookingStepper from '../components/BookingStepper';
import ShowtimePicker from '../components/ShowtimePicker';
import SeatMap from '../components/SeatMap';
import ExtrasPicker from '../components/ExtrasPicker';
import BookingSummary from '../components/BookingSummary';
import { BOOKING_STEPS, computeTotals } from '../utils/bookingFlow';
import MobileCheckoutBar from '../components/MobileCheckoutBar';
import { bookingApi, redirectToCheckout } from '../services/bookingApi';
import {
  buildDateOptions,
  formatShowDate,
  formatShowTime,
  isShowOnSale,
  normaliseShowtimes,
} from '../utils/showDates';

const PENDING_KEY = 'cineverse_pending_booking';
const AVAILABILITY_POLL_MS = 15000;

const stepIndex = (id) => BOOKING_STEPS.findIndex((s) => s.id === id);

function firstOnSaleTime(movie, date, cutoff) {
  return normaliseShowtimes(movie?.showtimes).find((t) => isShowOnSale(date, t, cutoff)) || null;
}

export default function BookingPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const topRef = useRef(null);

  const [config, setConfig] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [movies, setMovies] = useState([]);

  const [movie, setMovie] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedExtras, setSelectedExtras] = useState({});

  const [takenSeats, setTakenSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);

  const [step, setStep] = useState('show');
  const [maxReached, setMaxReached] = useState(0);
  const [notice, setNotice] = useState(null); // { type: 'error' | 'info', text }
  const [paying, setPaying] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const dates = useMemo(
    () => (config ? buildDateOptions(config.today, config.bookingWindowDays) : []),
    [config]
  );
  const cutoff = config?.salesCutoffMinutes ?? 15;
  const { total } = computeTotals(selectedSeats, selectedExtras);

  // ------------------------------------------------------------ initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cfg, moviesRes] = await Promise.all([bookingApi.getConfig(), movieService.getAllMovies()]);
        if (!alive) return;
        const bookable = (moviesRes.data || []).filter((m) =>
          (cfg.bookableStatuses || []).includes(m.status)
        );
        setConfig(cfg);
        setMovies(bookable);

        // Restore a booking that was in progress before sign-in.
        let pending = null;
        try {
          pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
          sessionStorage.removeItem(PENDING_KEY);
        } catch {
          pending = null;
        }

        const wantedId = pending?.movieId || searchParams.get('movie');
        const initialMovie = bookable.find((m) => String(m.id) === String(wantedId)) || bookable[0] || null;
        const dateOptions = buildDateOptions(cfg.today, cfg.bookingWindowDays);
        const initialDate =
          dateOptions.find((d) => d.value === pending?.date)?.value || dateOptions[0]?.value || null;

        setMovie(initialMovie);
        setDate(initialDate);
        if (initialMovie && initialDate) {
          const pendingTimeOk =
            pending?.time &&
            normaliseShowtimes(initialMovie.showtimes).includes(pending.time) &&
            isShowOnSale(initialDate, pending.time, cfg.salesCutoffMinutes);
          setTime(pendingTimeOk ? pending.time : firstOnSaleTime(initialMovie, initialDate, cfg.salesCutoffMinutes));
        }

        if (pending && initialMovie && String(initialMovie.id) === String(pending.movieId)) {
          setSelectedSeats(Array.isArray(pending.seats) ? pending.seats : []);
          setSelectedExtras(pending.extras || {});
          if (pending.step) {
            setStep(pending.step);
            setMaxReached(stepIndex(pending.step));
          }
        }
      } catch (err) {
        if (alive) setLoadError(err.message || 'Booking is unavailable right now.');
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------ availability
  const refreshAvailability = useCallback(async () => {
    if (!movie || !date || !time) return [];
    setSeatsLoading(true);
    try {
      const taken = await bookingApi.getTakenSeats({ movieId: movie.id, date, time });
      setTakenSeats(taken);
      const takenSet = new Set(taken);
      setSelectedSeats((prev) => {
        const lost = prev.filter((s) => takenSet.has(s.id));
        if (lost.length > 0) {
          setNotice({
            type: 'error',
            text: `Seat${lost.length > 1 ? 's' : ''} ${lost.map((s) => s.id).join(', ')} ${
              lost.length > 1 ? 'were' : 'was'
            } just booked by someone else and removed from your selection.`,
          });
          return prev.filter((s) => !takenSet.has(s.id));
        }
        return prev;
      });
      return taken;
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
      return [];
    } finally {
      setSeatsLoading(false);
    }
  }, [movie, date, time]);

  // New show picked: load its booked seats.
  useEffect(() => {
    setTakenSeats([]);
    refreshAvailability();
  }, [refreshAvailability]);

  // While choosing seats or paying, keep availability fresh.
  useEffect(() => {
    if (step !== 'seats' && step !== 'review') return undefined;
    refreshAvailability();
    const id = setInterval(refreshAvailability, AVAILABILITY_POLL_MS);
    return () => clearInterval(id);
  }, [step, refreshAvailability]);

  // ------------------------------------------------------------ navigation
  const goTo = (id) => {
    setStep(id);
    setMaxReached((m) => Math.max(m, stepIndex(id)));
    setNotice(null);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const resetSelection = () => {
    setSelectedSeats([]);
    setMaxReached((m) => Math.min(m, stepIndex('seats')));
  };

  const handleSelectMovie = (m) => {
    setMovie(m);
    setTime(date ? firstOnSaleTime(m, date, cutoff) : null);
    resetSelection();
  };

  const handleSelectDate = (d) => {
    setDate(d);
    setTime((t) => (t && isShowOnSale(d, t, cutoff) && normaliseShowtimes(movie?.showtimes).includes(t) ? t : firstOnSaleTime(movie, d, cutoff)));
    resetSelection();
  };

  const handleSelectTime = (t) => {
    setTime(t);
    resetSelection();
  };

  const handleToggleSeat = (seat) => {
    setNotice(null);
    setSelectedSeats((prev) => {
      if (prev.some((s) => s.id === seat.id)) return prev.filter((s) => s.id !== seat.id);
      if (prev.length >= (config?.maxSeats || 8)) {
        setNotice({ type: 'info', text: `You can book up to ${config?.maxSeats || 8} seats at a time.` });
        return prev;
      }
      const tier = config.tiers[seat.tier];
      const next = [...prev, { ...seat, tierName: tier.name, price: tier.price }];
      return next.sort((a, b) => a.row.localeCompare(b.row) || a.number - b.number);
    });
  };

  const handleRemoveSeat = (seatId) => setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));

  const handleExtraQuantity = (extra, quantity) => {
    setSelectedExtras((prev) => {
      const copy = { ...prev };
      if (quantity <= 0) delete copy[extra.id];
      else copy[extra.id] = { ...extra, quantity };
      return copy;
    });
  };

  // ------------------------------------------------------------ payment
  const cachePending = () => {
    try {
      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify({ movieId: movie?.id, date, time, seats: selectedSeats, extras: selectedExtras, step: 'review' })
      );
    } catch {
      /* storage unavailable */
    }
  };

  const goToAuth = (path) => {
    cachePending();
    setShowAuthModal(false);
    navigate(path, {
      state: {
        from: location.pathname + location.search,
        message: `Please sign in to complete your booking for "${movie?.title}".`,
      },
    });
  };

  const handlePay = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setPaying(true);
    setNotice(null);
    try {
      const { checkout } = await bookingApi.createHold({
        movieId: movie.id,
        date,
        time,
        seats: selectedSeats.map((s) => s.id),
        addons: Object.values(selectedExtras).map((e) => ({ id: e.id, quantity: e.quantity })),
      });
      redirectToCheckout(checkout, navigate);
    } catch (err) {
      setPaying(false);
      if (err.status === 401) {
        setShowAuthModal(true);
      } else if (err.code === 'SEAT_TAKEN') {
        await refreshAvailability();
        goTo('seats');
        setNotice({ type: 'error', text: err.message });
      } else {
        setNotice({ type: 'error', text: err.message });
      }
    }
  };

  // ------------------------------------------------------------ step action
  const showOk = Boolean(movie && date && time && isShowOnSale(date, time, cutoff));
  const action = (() => {
    switch (step) {
      case 'show':
        return {
          label: 'Choose seats',
          disabled: !showOk,
          hint: showOk ? null : 'Pick a film, date and showtime.',
          onClick: () => goTo('seats'),
        };
      case 'seats':
        return {
          label: 'Continue',
          disabled: selectedSeats.length === 0,
          hint: selectedSeats.length === 0 ? `Select up to ${config?.maxSeats || 8} seats.` : null,
          onClick: () => goTo('extras'),
        };
      case 'extras':
        return {
          label: Object.keys(selectedExtras).length ? 'Review booking' : 'Skip to review',
          shortLabel: 'Review',
          onClick: () => goTo('review'),
        };
      case 'review':
        return {
          label: `Pay ${formatLKR(total)}`,
          shortLabel: `Pay ${formatLKR(total)}`,
          locked: true,
          busy: paying,
          disabled: selectedSeats.length === 0 || !showOk,
          hint: isAuthenticated ? null : "You'll sign in before paying.",
          onClick: handlePay,
        };
      default:
        return null;
    }
  })();

  // ------------------------------------------------------------ render
  const renderStep = () => {
    if (step === 'show') {
      return (
        <ShowtimePicker
          movies={movies}
          movie={movie}
          onSelectMovie={handleSelectMovie}
          dates={dates}
          date={date}
          onSelectDate={handleSelectDate}
          time={time}
          onSelectTime={handleSelectTime}
          cutoffMinutes={cutoff}
        />
      );
    }
    if (step === 'seats') {
      return (
        <div className="bk-panel">
          <div className="bk-seat-header">
            <div>
              <h2 className="bk-section-title">Select your seats</h2>
              <p className="bk-muted bk-small">
                {movie?.title} · {formatShowDate(date)} · {formatShowTime(time)}
              </p>
            </div>
            <span className="bk-seat-count">
              {selectedSeats.length} / {config.maxSeats} selected
            </span>
          </div>
          <SeatMap
            layout={config.layout}
            tiers={config.tiers}
            takenSeats={takenSeats}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
            loading={seatsLoading && takenSeats.length === 0}
          />
        </div>
      );
    }
    if (step === 'extras') {
      return <ExtrasPicker extras={config.extras} selected={selectedExtras} onChangeQuantity={handleExtraQuantity} />;
    }
    return (
      <div className="bk-panel bk-review">
        <h2 className="bk-section-title">Review your booking</h2>

        <dl className="bk-review-list">
          <div>
            <dt>Film</dt>
            <dd>
              {movie?.title}
              <button type="button" className="bk-link" onClick={() => goTo('show')}>Change</button>
            </dd>
          </div>
          <div>
            <dt>When</dt>
            <dd>
              {formatShowDate(date)} · {formatShowTime(time)}
              <button type="button" className="bk-link" onClick={() => goTo('show')}>Change</button>
            </dd>
          </div>
          <div>
            <dt>Seats</dt>
            <dd>
              {selectedSeats.map((s) => s.id).join(', ')}
              <button type="button" className="bk-link" onClick={() => goTo('seats')}>Change</button>
            </dd>
          </div>
          <div>
            <dt>Extras</dt>
            <dd>
              {Object.values(selectedExtras).length
                ? Object.values(selectedExtras).map((e) => `${e.name} × ${e.quantity}`).join(', ')
                : 'None'}
              <button type="button" className="bk-link" onClick={() => goTo('extras')}>Change</button>
            </dd>
          </div>
          {isAuthenticated && (
            <div>
              <dt>Ticket sent to</dt>
              <dd>{user?.email}</dd>
            </div>
          )}
        </dl>

        <div className="bk-pay-note">
          <ShieldCheck size={18} />
          <div>
            <strong>Secure payment{config.paymentProvider === 'payhere' ? ' with PayHere' : ''}</strong>
            <p>
              Your seats are held for {config.holdMinutes} minutes while you pay. The booking is confirmed and
              your e-ticket is emailed only after the payment succeeds.
            </p>
          </div>
        </div>
        {config.paymentProvider === 'demo' && (
          <p className="bk-demo-note">
            <Info size={14} /> Test mode: no real money is charged.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="booking-page-root">
      <Navbar />

      <main className="bk-main">
        <div className="container">
          <div className="bk-page-head" ref={topRef}>
            <Link to="/" className="booking-back-link">
              <ArrowLeft size={15} />
              <span>Back to home</span>
            </Link>
            <span className="booking-eyebrow">
              <Sparkles size={13} className="gold-icon" />
              <span>RESERVE YOUR SEATS</span>
            </span>
            <h1 className="booking-page-heading">Book Tickets</h1>
          </div>

          {loadError ? (
            <div className="bk-panel bk-error-panel">
              <AlertTriangle size={22} />
              <div>
                <h2>Booking is unavailable right now</h2>
                <p>{loadError}</p>
              </div>
            </div>
          ) : !config ? (
            <div className="bk-panel bk-loading">
              <span className="bk-loader" /> Loading showtimes…
            </div>
          ) : movies.length === 0 ? (
            <div className="bk-panel bk-error-panel">
              <Info size={22} />
              <div>
                <h2>No films are open for booking</h2>
                <p>Please check back soon for new showtimes.</p>
              </div>
            </div>
          ) : (
            <>
              <BookingStepper current={step} maxReached={maxReached} onGoTo={goTo} />

              {notice && (
                <div className={`bk-notice is-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
                  {notice.type === 'error' ? <AlertTriangle size={16} /> : <Info size={16} />}
                  <span>{notice.text}</span>
                  <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="bk-layout">
                <div className="bk-content">{renderStep()}</div>
                <div className="bk-side">
                  <BookingSummary
                    movie={movie}
                    date={date}
                    time={time}
                    selectedSeats={selectedSeats}
                    selectedExtras={selectedExtras}
                    onRemoveSeat={step === 'review' ? null : handleRemoveSeat}
                    action={action}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {config && movies.length > 0 && (
        <MobileCheckoutBar selectedSeats={selectedSeats} total={total} action={action} />
      )}

      {showAuthModal &&
        createPortal(
          <div
            className="booking-auth-modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAuthModal(false);
            }}
          >
            <div className="booking-auth-modal-card">
              <button
                type="button"
                className="booking-auth-modal-close"
                onClick={() => setShowAuthModal(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
              <div className="booking-auth-icon-badge">
                <Lock size={24} />
              </div>
              <h3 className="booking-auth-title">Sign in to pay</h3>
              <p className="booking-auth-subtitle">
                Your e-ticket is linked to your CINEVERSE account. Your selection is saved and will be waiting
                when you come back.
              </p>
              <div className="booking-auth-recap">
                <span className="booking-auth-recap-movie">{movie?.title}</span>
                <span className="booking-auth-recap-detail">
                  {formatShowDate(date)} · {formatShowTime(time)}
                </span>
                <span className="booking-auth-recap-detail">
                  Seats {selectedSeats.map((s) => s.id).join(', ')} · {formatLKR(total)}
                </span>
              </div>
              <div className="booking-auth-actions">
                <button type="button" onClick={() => goToAuth('/login')} className="booking-auth-btn-primary">
                  <LogIn size={16} />
                  <span>SIGN IN</span>
                </button>
                <button type="button" onClick={() => goToAuth('/register')} className="booking-auth-btn-secondary">
                  <UserPlus size={16} />
                  <span>CREATE ACCOUNT</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <Footer />
    </div>
  );
}
