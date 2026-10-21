import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Sparkles, Lock, LogIn, UserPlus, X } from 'lucide-react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import BookingHeader from '../components/BookingHeader';
import SeatMap from '../components/SeatMap';
import ConciergeAddons from '../components/ConciergeAddons';
import BookingSummaryBar from '../components/BookingSummaryBar';
import DigitalTicketModal from '../components/DigitalTicketModal';
import {
  LUXURY_MOVIES,
  SCREENING_DATES,
  SHOWTIMES,
  INITIAL_SEAT_GRID,
} from '../data/mockCinemaData';
import { movieService } from '../../admin/services/movieService';
import { adminDataService } from '../../admin/services/adminDataService';
import { useAuth } from '../../auth/hooks/useAuth';

const PENDING_BOOKING_KEY = 'cineverse_pending_booking';

export default function BookingPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [moviesList, setMoviesList] = useState(LUXURY_MOVIES);
  const [activeMovie, setActiveMovie] = useState(LUXURY_MOVIES[0]);
  const [activeDate, setActiveDate] = useState(SCREENING_DATES[0]);
  const [activeTime, setActiveTime] = useState(SHOWTIMES[2]); // 20:30
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load latest repertory movies from service & support URL query ?movie=<id>
  useEffect(() => {
    let isMounted = true;
    async function loadRepertory() {
      const { data } = await movieService.getAllMovies();
      if (!isMounted) return;

      const loadedMovies = data && data.length > 0 ? data : LUXURY_MOVIES;
      setMoviesList(loadedMovies);

      let chosenMovie = loadedMovies[0];
      const movieIdParam = searchParams.get('movie');
      if (movieIdParam) {
        const found = loadedMovies.find((m) => String(m.id) === String(movieIdParam));
        if (found) {
          chosenMovie = found;
        }
      }
      setActiveMovie(chosenMovie);

      // Sync activeTime with the chosen movie's configured showtimes
      const times = Array.isArray(chosenMovie.showtimes) && chosenMovie.showtimes.length > 0
        ? chosenMovie.showtimes
        : (typeof chosenMovie.showtimes === 'string' && chosenMovie.showtimes.trim()
            ? chosenMovie.showtimes.split(',').map((s) => s.trim()).filter(Boolean)
            : SHOWTIMES);
      if (times.length > 0) {
        setActiveTime((prev) => (times.includes(prev) ? prev : times[0]));
      }
    }
    loadRepertory();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // Restore pending booking from session if user just logged in / registered
  useEffect(() => {
    try {
      const savedPending = sessionStorage.getItem(PENDING_BOOKING_KEY);
      if (savedPending) {
        const parsed = JSON.parse(savedPending);
        if (parsed.movieId && moviesList.length > 0) {
          const matchMovie = moviesList.find((m) => String(m.id) === String(parsed.movieId));
          if (matchMovie) {
            setActiveMovie(matchMovie);
            const times = Array.isArray(matchMovie.showtimes) && matchMovie.showtimes.length > 0
              ? matchMovie.showtimes
              : SHOWTIMES;
            if (times.length > 0 && parsed.time && times.includes(parsed.time)) {
              setActiveTime(parsed.time);
            }
          }
        }
        if (parsed.time && !parsed.movieId) setActiveTime(parsed.time);
        if (parsed.addons) setSelectedAddons(parsed.addons);
        if (Array.isArray(parsed.seats) && parsed.seats.length > 0) {
          setSelectedSeats(parsed.seats);
        }
        // Once restored, clear pending key
        sessionStorage.removeItem(PENDING_BOOKING_KEY);
      }
    } catch {
      // ignore parsing error
    }
  }, [moviesList]);

  // Seat toggle handler
  const handleToggleSeat = (seatObj) => {
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seatObj.id);
      if (exists) {
        return prev.filter((s) => s.id !== seatObj.id);
      }
      return [...prev, seatObj];
    });
  };

  const handleRemoveSeat = (seatId) => {
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
  };

  const handleUpdateAddonQuantity = (addon, quantity) => {
    setSelectedAddons((prev) => {
      if (quantity <= 0) {
        const copy = { ...prev };
        delete copy[addon.id];
        return copy;
      }
      return {
        ...prev,
        [addon.id]: {
          ...addon,
          quantity,
        },
      };
    });
  };

  // Movie switch handler
  const handleSelectMovie = (movie) => {
    setActiveMovie(movie);
    setSelectedSeats([]);

    const movieTimes = Array.isArray(movie.showtimes) && movie.showtimes.length > 0
      ? movie.showtimes
      : (typeof movie.showtimes === 'string' && movie.showtimes.trim()
          ? movie.showtimes.split(',').map((s) => s.trim()).filter(Boolean)
          : SHOWTIMES);
    if (movieTimes.length > 0) {
      setActiveTime((prev) => (movieTimes.includes(prev) ? prev : movieTimes[0]));
    }
  };

  // Date switch handler
  const handleSelectDate = (date) => {
    setActiveDate(date);
    setSelectedSeats([]);
  };

  // Showtime switch handler
  const handleSelectTime = (time) => {
    setActiveTime(time);
    setSelectedSeats([]);
  };

  // Save pending session state before navigating to auth
  const cachePendingReservation = () => {
    try {
      const pendingData = {
        movieId: activeMovie?.id,
        time: activeTime,
        seats: selectedSeats,
        addons: selectedAddons,
      };
      sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(pendingData));
    } catch {
      // fallback
    }
  };

  const handleNavigateToLogin = () => {
    cachePendingReservation();
    setShowAuthModal(false);
    navigate('/login', {
      state: {
        from: location.pathname + location.search,
        message: `Please sign in to secure your reservation for "${activeMovie.title}".`,
      },
    });
  };

  const handleNavigateToRegister = () => {
    cachePendingReservation();
    setShowAuthModal(false);
    navigate('/register', {
      state: {
        from: location.pathname + location.search,
      },
    });
  };

  // Confirm reservation
  const handleConfirmBooking = () => {
    if (selectedSeats.length === 0) return;

    // MANDATORY AUTHENTICATION CHECK
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const refNumber = Math.floor(1000 + Math.random() * 9000);
    const seatsTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
    const addonsTotal = Object.values(selectedAddons).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalAmount = seatsTotal + addonsTotal;

    const bookingPayload = {
      id: `BK-${refNumber}`,
      refCode: `CV-${refNumber}-LUXE`,
      movie: activeMovie,
      movieTitle: activeMovie.title,
      format: activeMovie.format,
      auditorium: activeMovie.auditorium,
      date: activeDate,
      time: activeTime,
      seats: selectedSeats,
      seatsDisplay: selectedSeats.map((s) => s.id),
      tier: selectedSeats[0]?.tierName || 'Royal Sovereign Loge',
      totalAmount,
      addons: Object.values(selectedAddons)
        .filter((a) => a.quantity > 0)
        .map((a) => `${a.name} (x${a.quantity})`),
      guestName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Valued Patron',
      guestEmail: user?.email || 'patron@cineverse.com',
      status: 'Confirmed',
      checkedIn: false,
      bookedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    // Save to admin dashboard data store
    adminDataService.addBooking(bookingPayload);

    // Display digital cinema ticket pass
    setConfirmedBooking(bookingPayload);
  };

  const handleCloseTicketModal = () => {
    setConfirmedBooking(null);
    setSelectedSeats([]);
    setSelectedAddons({});
  };

  return (
    <div className="booking-page-root">
      {/* Global Navbar */}
      <Navbar />

      <main className="booking-main-content">
        <div className="container">
          {/* Top Breadcrumb & Title */}
          <div className="booking-top-navigation">
            <Link to="/" className="booking-back-link">
              <ArrowLeft size={15} />
              <span>Return to Cinema Sanctuary</span>
            </Link>
            <div className="booking-title-lockup">
              <span className="booking-eyebrow">
                <Sparkles size={13} className="gold-icon" />
                <span>EXCLUSIVE AUDITORIUM SELECTION</span>
              </span>
              <h1 className="booking-page-heading">Reserve Your Private Loge</h1>
            </div>
          </div>

          {/* Booking Flow Header (Movie, Date, Showtime) */}
          <BookingHeader
            movies={moviesList}
            activeMovie={activeMovie}
            onSelectMovie={handleSelectMovie}
            activeDate={activeDate}
            onSelectDate={handleSelectDate}
            activeTime={activeTime}
            onSelectTime={handleSelectTime}
          />

          {/* Main Booking Two-Column Grid: Seating Chart & Summary Panel */}
          <div className="booking-experience-grid">
            {/* Left Column: Interactive Seat Chart & Concierge Extras */}
            <div className="booking-stage-column">
              <SeatMap
                seatGrid={INITIAL_SEAT_GRID}
                selectedSeats={selectedSeats}
                onToggleSeat={handleToggleSeat}
              />

              {/* Concierge In-Seat Dining Extras */}
              <ConciergeAddons
                selectedAddons={selectedAddons}
                onUpdateAddonQuantity={handleUpdateAddonQuantity}
              />
            </div>

            {/* Right Column: Sticky Summary & Checkout Panel */}
            <div className="booking-sidebar-column">
              <BookingSummaryBar
                movie={activeMovie}
                date={activeDate}
                time={activeTime}
                selectedSeats={selectedSeats}
                onRemoveSeat={handleRemoveSeat}
                selectedAddons={selectedAddons}
                onConfirmBooking={handleConfirmBooking}
                user={user}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mandatory Authentication Modal for Unauthenticated Patrons */}
      {showAuthModal &&
        typeof document !== 'undefined' &&
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

              <h3 className="booking-auth-title">CINEVERSE Patron Sign-In Required</h3>
              <p className="booking-auth-subtitle">
                To safeguard your sovereign seat reservations and issue your encrypted royal pass,
                reservations require an authenticated CINEVERSE member account.
              </p>

              {/* Reservation summary preview */}
              <div className="booking-auth-recap">
                <span className="booking-auth-recap-movie">{activeMovie.title}</span>
                <span className="booking-auth-recap-detail">
                  {activeMovie.auditorium} • {activeDate.full} at {activeTime}
                </span>
                <span className="booking-auth-recap-detail">
                  Reserved Seats: {selectedSeats.map((s) => s.id).join(', ')} ({selectedSeats.length} Recliners)
                </span>
              </div>

              {/* Action Buttons */}
              <div className="booking-auth-actions">
                <button
                  type="button"
                  onClick={handleNavigateToLogin}
                  className="booking-auth-btn-primary"
                >
                  <LogIn size={16} />
                  <span>SIGN IN TO CONFIRM RESERVATION</span>
                </button>

                <button
                  type="button"
                  onClick={handleNavigateToRegister}
                  className="booking-auth-btn-secondary"
                >
                  <UserPlus size={16} />
                  <span>JOIN THE ARCHIVE (CREATE ACCOUNT)</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Royal Digital Cinema Pass Modal */}
      {confirmedBooking && (
        <DigitalTicketModal
          booking={confirmedBooking}
          onClose={handleCloseTicketModal}
        />
      )}

      {/* Global Luxury Footer */}
      <Footer />
    </div>
  );
}
