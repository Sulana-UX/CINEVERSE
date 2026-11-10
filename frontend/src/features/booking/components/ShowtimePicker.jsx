import React from 'react';
import { CalendarDays, Clock, Film } from 'lucide-react';
import { formatShowTime, isShowOnSale, normaliseShowtimes } from '../utils/showDates';

export default function ShowtimePicker({
  movies,
  movie,
  onSelectMovie,
  dates,
  date,
  onSelectDate,
  time,
  onSelectTime,
  cutoffMinutes,
}) {
  const times = normaliseShowtimes(movie?.showtimes);

  return (
    <div className="bk-panel bk-show-picker">
      <section className="bk-section">
        <h2 className="bk-section-title">
          <Film size={16} /> Choose your film
        </h2>
        <div className="bk-movie-list">
          {movies.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMovie(m)}
              className={`bk-movie-option ${movie?.id === m.id ? 'is-on' : ''}`}
              aria-pressed={movie?.id === m.id}
            >
              <span className="bk-movie-thumb">
                <img src={m.backdrop || '/images/luxury_cinema_interior.jpg'} alt="" loading="lazy" />
              </span>
              <span className="bk-movie-text">
                <span className="bk-movie-title">{m.title}</span>
                <span className="bk-movie-meta">
                  {[m.rating, m.runtime].filter(Boolean).join(' · ')}
                </span>
                <span className="bk-movie-aud">{m.auditorium}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="bk-section">
        <h2 className="bk-section-title">
          <CalendarDays size={16} /> Choose a date
        </h2>
        <div className="bk-date-list" role="radiogroup" aria-label="Screening date">
          {dates.map((d) => (
            <button
              key={d.value}
              type="button"
              role="radio"
              aria-checked={date === d.value}
              onClick={() => onSelectDate(d.value)}
              className={`bk-date-chip ${date === d.value ? 'is-on' : ''}`}
            >
              <span className="bk-date-weekday">{d.weekday}</span>
              <span className="bk-date-day">{d.day}</span>
              <span className="bk-date-month">{d.month}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bk-section">
        <h2 className="bk-section-title">
          <Clock size={16} /> Choose a showtime
        </h2>
        {times.length === 0 ? (
          <p className="bk-muted">No showtimes are scheduled for this film yet.</p>
        ) : (
          <div className="bk-time-list" role="radiogroup" aria-label="Showtime">
            {times.map((t) => {
              const onSale = date ? isShowOnSale(date, t, cutoffMinutes) : false;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={time === t}
                  disabled={!onSale}
                  onClick={() => onSelectTime(t)}
                  className={`bk-time-chip ${time === t ? 'is-on' : ''}`}
                  title={onSale ? undefined : 'Sales closed for this showtime'}
                >
                  <span className="bk-time-main">{formatShowTime(t)}</span>
                  <span className="bk-time-sub">{onSale ? movie?.format?.split('•')[0]?.trim() || '70MM' : 'Closed'}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
