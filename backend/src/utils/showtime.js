import { BOOKING_WINDOW_DAYS, SALES_CUTOFF_MINUTES } from '../config/booking.js';

// Sri Lanka is UTC+05:30 all year (no daylight saving).
const COLOMBO_OFFSET_MIN = 5 * 60 + 30;

/** "YYYY-MM-DD" for today in Colombo. */
export function colomboToday(now = new Date()) {
  const shifted = new Date(now.getTime() + COLOMBO_OFFSET_MIN * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/** UTC instant at which a show (Colombo local date + "HH:MM") starts. */
export function showStartsAt(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - COLOMBO_OFFSET_MIN * 60 * 1000);
}

export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Validate a requested show date/time. Returns an error message or null.
 */
export function validateShowSlot(dateStr, timeStr, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || '')) return 'Invalid screening date.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr || '')) return 'Invalid showtime.';

  const today = colomboToday(now);
  const lastDay = addDays(today, BOOKING_WINDOW_DAYS - 1);
  if (dateStr < today || dateStr > lastDay) {
    return `Bookings are open for the next ${BOOKING_WINDOW_DAYS} days only.`;
  }

  const cutoff = showStartsAt(dateStr, timeStr).getTime() - SALES_CUTOFF_MINUTES * 60 * 1000;
  if (now.getTime() > cutoff) return 'Sales for this showtime have closed.';
  return null;
}
