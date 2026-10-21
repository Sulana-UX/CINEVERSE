import React from 'react';
import { Clock, Calendar, Sparkles } from 'lucide-react';
import { LUXURY_MOVIES, SCREENING_DATES, SHOWTIMES } from '../data/mockCinemaData';

export default function BookingHeader({
  activeMovie,
  onSelectMovie,
  activeDate,
  onSelectDate,
  activeTime,
  onSelectTime,
  movies = LUXURY_MOVIES,
}) {
  return (
    <div className="booking-header-section">
      {/* Movie Selector Strip */}
      <div className="booking-movie-strip">
        <span className="booking-strip-eyebrow">
          <Sparkles size={14} className="gold-icon" />
          <span>CURATED 70MM REPERTORY PROGRAMME</span>
        </span>

        <div className="booking-movie-tabs">
          {movies.map((movie) => (
            <button
              key={movie.id}
              type="button"
              onClick={() => onSelectMovie(movie)}
              className={`booking-movie-tab ${activeMovie.id === movie.id ? 'active' : ''}`}
            >
              <span className="movie-tab-title">{movie.title}</span>
              <span className="movie-tab-format">{movie.format.split('•')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Movie Info Card */}
      <div className="booking-active-movie-card">
        <div className="active-movie-meta">
          <div className="active-movie-badges">
            <span className="badge-format">{activeMovie.format}</span>
            <span className="badge-runtime">
              <Clock size={12} />
              {activeMovie.runtime}
            </span>
            <span className="badge-rating">{activeMovie.rating}</span>
          </div>

          <h1 className="active-movie-title">{activeMovie.title}</h1>
          <p className="active-movie-auditorium">{activeMovie.auditorium}</p>
          <p className="active-movie-tagline">“{activeMovie.tagline}”</p>
        </div>
      </div>

      {/* Date & Showtime Selector */}
      <div className="booking-schedule-bar">
        {/* Date Selector */}
        <div className="schedule-group">
          <span className="schedule-label">
            <Calendar size={14} />
            <span>Select Screening Date</span>
          </span>
          <div className="date-pills-row">
            {SCREENING_DATES.map((item) => (
              <button
                key={item.date}
                type="button"
                onClick={() => onSelectDate(item)}
                className={`date-pill ${activeDate.date === item.date ? 'active' : ''}`}
              >
                <span className="pill-day">{item.day}</span>
                <span className="pill-date">{item.date}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Selector */}
        <div className="schedule-group">
          <span className="schedule-label">
            <Clock size={14} />
            <span>Select Showtime</span>
          </span>
          <div className="time-pills-row">
            {SHOWTIMES.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => onSelectTime(time)}
                className={`time-pill ${activeTime === time ? 'active' : ''}`}
              >
                <span className="time-text">{time}</span>
                <span className="time-sub">PRIME</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
