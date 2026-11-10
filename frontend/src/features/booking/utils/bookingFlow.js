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
