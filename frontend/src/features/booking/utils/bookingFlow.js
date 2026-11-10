export const BOOKING_STEPS = [
  { id: 'show', label: 'Film & Time' },
  { id: 'seats', label: 'Seats' },
  { id: 'extras', label: 'Extras' },
  { id: 'review', label: 'Review & Pay' },
];

export function computeTotals(selectedSeats, selectedExtras) {
  const seatsTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const extrasTotal = Object.values(selectedExtras).reduce((sum, e) => sum + e.price * e.quantity, 0);
  return { seatsTotal, extrasTotal, total: seatsTotal + extrasTotal };
}

/** "Auditorium 02 — The Director’s Loge" -> "02" */
export function hallNumber(auditorium) {
  const m = /Auditorium\s+(\d+)/i.exec(auditorium || '');
  return m ? m[1].padStart(2, '0') : null;
}

/** The seat plan for the hall a film plays in (each hall has its own). */
export function layoutForMovie(config, movie) {
  if (!config) return [];
  return config.layouts?.[hallNumber(movie?.auditorium)] || config.layout;
}
