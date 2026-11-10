import { BOOKABLE_STATUSES, SEAT_LAYOUT, SEAT_TIERS } from '../config/booking.js';
import { showStartsAt } from '../utils/showtime.js';
import { auditoriumLabel, auditoriumNumber, normaliseShowtimes, runtimeMinutes } from './movieCatalog.js';

/** Every hall uses the same seat plan. */
export const SEATS_PER_SHOW = SEAT_LAYOUT.reduce((n, row) => n + row.seats, 0);

export const TIER_CAPACITY = Object.fromEntries(
  Object.keys(SEAT_TIERS).map((key) => [
    key,
    SEAT_LAYOUT.filter((row) => row.tier === key).reduce((n, row) => n + row.seats, 0),
  ])
);

export function toClientAuditorium(row) {
  return {
    id: row.id,
    number: row.number,
    name: row.name,
    label: auditoriumLabel(row),
    format: row.format,
    projection: row.projection,
    sound: row.sound,
    status: row.status,
    projectorOn: row.projector_on,
    audioPreset: row.audio_preset,
    lightingPreset: row.lighting_preset,
    temperature: Number(row.temperature),
    totalSeats: SEATS_PER_SHOW,
    updatedAt: row.updated_at,
  };
}

/**
 * Today's screenings, grouped by hall.
 * @returns {Map<string, Array<{movieId, film, time, start, end, phase, progress}>>} hall number -> shows by time
 */
export function buildTodayShows(movies, today, now = new Date()) {
  const byHall = new Map();
  for (const movie of movies) {
    if (!BOOKABLE_STATUSES.includes(movie.status)) continue;
    const hall = auditoriumNumber(movie.auditorium);
    if (!hall) continue;
    const length = runtimeMinutes(movie.runtime);

    for (const time of normaliseShowtimes(movie.showtimes)) {
      if (!/^\d{2}:\d{2}$/.test(time)) continue;
      const start = showStartsAt(today, time);
      const end = new Date(start.getTime() + length * 60 * 1000);
      let phase = 'Scheduled';
      if (now >= end) phase = 'Completed';
      else if (now >= start) phase = 'Live';
      const progress = phase === 'Live' ? Math.round(((now - start) / (end - start)) * 100) : phase === 'Completed' ? 100 : 0;

      if (!byHall.has(hall)) byHall.set(hall, []);
      byHall.get(hall).push({ movieId: movie.id, film: movie.title, format: movie.format, time, start, end, phase, progress });
    }
  }
  for (const shows of byHall.values()) shows.sort((a, b) => a.start - b.start);
  return byHall;
}

/**
 * Add live facts to each hall: what is playing, the next show and its seats sold.
 * @param {Map<string, number>} seatsSold  key `${movieId}|${time}` -> seats sold today
 */
export function withLiveState(halls, todayShows, seatsSold) {
  return halls.map((hall) => {
    const shows = todayShows.get(hall.number) || [];
    const live = shows.find((s) => s.phase === 'Live');
    const next = shows.find((s) => s.phase === 'Scheduled');
    const focus = live || next || null;
    return {
      ...hall,
      currentFilm: focus ? focus.film : 'No screening scheduled',
      nextShowtime: next ? next.time : '—',
      screeningProgress: live ? live.progress : 0,
      occupiedSeats: focus ? seatsSold.get(`${focus.movieId}|${focus.time}`) || 0 : 0,
      showsToday: shows.length,
    };
  });
}
