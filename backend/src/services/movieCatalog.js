import { BOOKABLE_STATUSES } from '../config/booking.js';

export const MOVIE_STATUSES = ['Now Showing', 'Coming Soon', 'Special Archive'];
export const MOVIE_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
export const MAX_SHOWTIMES = 12;
// Minutes between the end of one screening and the next in the same hall.
export const TURNOVER_MINUTES = 15;
const DEFAULT_RUNTIME_MIN = 150;
const DEFAULT_BACKDROP = '/images/luxury_cinema_interior.jpg';

export class MovieInputError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

/** "169 MIN" / "2h 49m" / 169 -> 169 */
export function runtimeMinutes(runtime) {
  if (typeof runtime === 'number') return runtime;
  const text = String(runtime || '');
  const hm = /(\d+)\s*h(?:ours?)?\s*(\d+)?/i.exec(text);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2] || 0);
  const n = /(\d+)/.exec(text);
  return n ? Number(n[1]) : DEFAULT_RUNTIME_MIN;
}

/** "Auditorium 02 — The Director’s Loge" -> "02" */
export function auditoriumNumber(label) {
  const m = /Auditorium\s+(\d+)/i.exec(label || '');
  return m ? m[1].padStart(2, '0') : null;
}

export const auditoriumLabel = (hall) => `Auditorium ${hall.number} — ${hall.name}`;

export function normaliseShowtimes(value) {
  if (Array.isArray(value)) return value.map((t) => String(t).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((t) => t.trim()).filter(Boolean);
  return [];
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function toClientMovie(row) {
  return {
    id: row.id,
    title: row.title,
    format: row.format,
    rating: row.rating,
    runtime: row.runtime,
    director: row.director,
    auditorium: row.auditorium,
    tagline: row.tagline,
    description: row.description,
    backdrop: row.backdrop_url || DEFAULT_BACKDROP,
    showtimes: normaliseShowtimes(row.showtimes).sort(),
    status: row.status || 'Now Showing',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function text(value, field, label, { required = false, max }) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (required && !v) throw new MovieInputError(`${label} is required.`, field);
  if (v.length > max) throw new MovieInputError(`${label} must be ${max} characters or fewer.`, field);
  return v;
}

/**
 * Validate a film from the admin form and return the database row to save.
 * @param {object} input  body from the browser
 * @param {string[]} hallLabels  valid auditorium labels
 */
export function validateMovieInput(input, hallLabels) {
  if (!input || typeof input !== 'object') throw new MovieInputError('Invalid film details.');

  const title = text(input.title, 'title', 'Film title', { required: true, max: 120 });
  const director = text(input.director, 'director', 'Director', { required: true, max: 80 });
  const format = text(input.format, 'format', 'Format', { max: 80 });
  const tagline = text(input.tagline, 'tagline', 'Tagline', { max: 160 });
  const description = text(input.description, 'description', 'Synopsis', { max: 2000 });

  const rating = MOVIE_RATINGS.includes(input.rating) ? input.rating : null;
  if (!rating) throw new MovieInputError('Choose an age rating.', 'rating');

  const status = MOVIE_STATUSES.includes(input.status) ? input.status : null;
  if (!status) throw new MovieInputError('Choose a status.', 'status');

  const minutes = runtimeMinutes(input.runtime);
  if (!/\d/.test(String(input.runtime || '')) || minutes < 30 || minutes > 400) {
    throw new MovieInputError('Runtime must be between 30 and 400 minutes, e.g. "150 MIN".', 'runtime');
  }

  const auditorium = typeof input.auditorium === 'string' ? input.auditorium.trim() : '';
  if (!hallLabels.includes(auditorium)) throw new MovieInputError('Choose an auditorium.', 'auditorium');

  const backdrop = typeof input.backdrop === 'string' ? input.backdrop.trim() : '';
  if (backdrop && !/^https:\/\/[^\s]+$/i.test(backdrop) && !/^\/images\/[\w./-]+$/.test(backdrop)) {
    throw new MovieInputError('Poster must be an https:// image link (for example from Cloudinary).', 'backdrop');
  }
  if (backdrop.length > 500) throw new MovieInputError('Poster link is too long.', 'backdrop');

  const showtimes = [...new Set(normaliseShowtimes(input.showtimes))].sort();
  if (showtimes.length === 0) throw new MovieInputError('Select at least one showtime.', 'showtimes');
  if (showtimes.length > MAX_SHOWTIMES) {
    throw new MovieInputError(`A film can have at most ${MAX_SHOWTIMES} daily showtimes.`, 'showtimes');
  }
  const bad = showtimes.find((t) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t));
  if (bad) throw new MovieInputError(`"${bad}" is not a valid time. Use 24-hour HH:MM, e.g. 18:30.`, 'showtimes');

  // A film's own screenings must not overlap each other in its hall.
  for (let i = 1; i < showtimes.length; i += 1) {
    if (toMinutes(showtimes[i]) - toMinutes(showtimes[i - 1]) < minutes + TURNOVER_MINUTES) {
      throw new MovieInputError(
        `${showtimes[i - 1]} and ${showtimes[i]} overlap: the film runs ${minutes} min plus ${TURNOVER_MINUTES} min to turn the hall around.`,
        'showtimes'
      );
    }
  }

  return {
    title,
    director,
    format,
    rating,
    runtime: `${minutes} MIN`,
    auditorium,
    tagline,
    description,
    backdrop_url: backdrop || DEFAULT_BACKDROP,
    showtimes,
    status,
  };
}

/**
 * Find a screening of another scheduled film in the same hall that overlaps this one.
 * Only films that are on sale (BOOKABLE_STATUSES) occupy the hall.
 * @returns {string|null} message describing the clash
 */
export function findScheduleClash(candidate, otherMovies) {
  if (!BOOKABLE_STATUSES.includes(candidate.status)) return null;
  const hall = auditoriumNumber(candidate.auditorium);
  const len = runtimeMinutes(candidate.runtime);

  for (const other of otherMovies) {
    if (!BOOKABLE_STATUSES.includes(other.status) || auditoriumNumber(other.auditorium) !== hall) continue;
    const otherLen = runtimeMinutes(other.runtime);
    for (const a of candidate.showtimes) {
      for (const b of normaliseShowtimes(other.showtimes)) {
        const aStart = toMinutes(a);
        const bStart = toMinutes(b);
        const clash =
          aStart < bStart + otherLen + TURNOVER_MINUTES && bStart < aStart + len + TURNOVER_MINUTES;
        if (clash) {
          return `${a} clashes with "${other.title}" at ${b} in the same auditorium.`;
        }
      }
    }
  }
  return null;
}
