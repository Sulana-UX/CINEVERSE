import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
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
import { useAuth } from '../../auth/hooks/useAuth';

export default function BookingPage() {
  const { user } = useAuth();

  const [moviesList, setMoviesList] = useState(LUXURY_MOVIES);
  const [activeMovie, setActiveMovie] = useState(LUXURY_MOVIES[0]);
  const [activeDate, setActiveDate] = useState(SCREENING_DATES[0]);
  const [activeTime, setActiveTime] = useState(SHOWTIMES[2]); // 20:30
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Load latest repertory movies from service
  useEffect(() => {
    async function loadRepertory() {
      const { data } = await movieService.getAllMovies();
      if (data && data.length > 0) {
        setMoviesList(data);
        setActiveMovie(data[0]);
      }
    }
    loadRepertory();
  }, []);

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

  // Confirm reservation
  const handleConfirmBooking = () => {
    if (selectedSeats.length === 0) return;

    const refNumber = Math.floor(1000 + Math.random() * 9000);
    const bookingPayload = {
      refCode: `CV-${refNumber}-LUXE`,
      movie: activeMovie,
      date: activeDate,
      time: activeTime,
      seats: selectedSeats,
      addons: Object.values(selectedAddons).filter((a) => a.quantity > 0),
      guestName: user?.user_metadata?.full_name || user?.email || 'Valued Patron',
      timestamp: new Date().toISOString(),
    };

    setConfirmedBooking(bookingPayload);
  };

  const handleCloseModal = () => {
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

      {/* Royal Digital Cinema Pass Modal */}
      {confirmedBooking && (
        <DigitalTicketModal
          booking={confirmedBooking}
          onClose={handleCloseModal}
        />
      )}

      {/* Global Luxury Footer */}
      <Footer />
    </div>
  );
}
