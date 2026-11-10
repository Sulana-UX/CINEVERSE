/**
 * Booking catalogue: seat layout, tier prices and in-seat extras (LKR).
 * This is the single source of truth for prices. The frontend reads it from
 * GET /api/booking/config, and every quote is recalculated here, so a price
 * sent from the browser is never trusted.
 */

export const CURRENCY = 'LKR';
export const TIMEZONE = 'Asia/Colombo';
export const MAX_SEATS_PER_BOOKING = 8;
export const HOLD_MINUTES = 10;
export const BOOKING_WINDOW_DAYS = 7;
// Stop selling a show this many minutes before it starts.
export const SALES_CUTOFF_MINUTES = 15;
// Movie statuses that can be booked.
export const BOOKABLE_STATUSES = ['Now Showing', 'Special Archive'];

export const SEAT_TIERS = {
  ORCHESTRA: {
    name: 'Orchestra Suite',
    price: 2500,
    description: 'Wide leather lounge seat with an unobstructed view',
  },
  PREMIER: {
    name: 'Premier Velvet Recliner',
    price: 3500,
    description: 'Motorised plush recliner with a personal tray',
  },
  LOGE: {
    name: 'Royal Sovereign Loge',
    price: 5000,
    description: 'Rear balcony double-width recliner with champagne console',
  },
};

/**
 * Seat plans. Rows run from the screen (A) to the back. `aisleAfter` splits a
 * row into left / right blocks. Seat ids are `${row}${number}`, e.g. "D7".
 */
const rows = (letters, tier, seats, aisleAfter) =>
  letters.split('').map((row) => ({ row, tier, seats, aisleAfter }));

/** Used by any hall without its own plan below. 76 seats. */
export const SEAT_LAYOUT = [
  ...rows('ABC', 'ORCHESTRA', 10, 5),
  ...rows('DEF', 'PREMIER', 10, 5),
  ...rows('GH', 'LOGE', 8, 4),
];

/** Each hall's plan, keyed by auditorium number ("01" = "Auditorium 01 — ..."). */
export const HALL_LAYOUTS = {
  // The Sovereign Soundstage: the flagship, largest hall. 100 seats.
  '01': [...rows('ABCD', 'ORCHESTRA', 12, 6), ...rows('EFG', 'PREMIER', 12, 6), ...rows('HI', 'LOGE', 8, 4)],
  // The Director's Loge: small and private. 44 seats.
  '02': [...rows('AB', 'ORCHESTRA', 8, 4), ...rows('CD', 'PREMIER', 8, 4), ...rows('EF', 'LOGE', 6, 3)],
  // The Quantum Chamber. 76 seats.
  '03': SEAT_LAYOUT,
};

/** The seat plan for a hall number ("02"), falling back to SEAT_LAYOUT. */
export function layoutFor(hallNumber) {
  return HALL_LAYOUTS[hallNumber] || SEAT_LAYOUT;
}

export const EXTRAS = [
  {
    id: 'extra-champagne',
    name: 'Champagne & White Truffle Popcorn',
    description: 'Chilled flute with warm popcorn tossed in white truffle butter',
    price: 6500,
    tag: 'SIGNATURE',
  },
  {
    id: 'extra-charcuterie',
    name: 'Artisan Charcuterie & Aged Cheese',
    description: 'Cured meats, artisanal cheeses, fig preserve and crackers',
    price: 4800,
    tag: 'CONNOISSEUR',
  },
  {
    id: 'extra-chocolate',
    name: 'Grand Cru Dark Chocolate Truffles',
    description: 'Six hand-painted chocolate truffles finished with gold leaf',
    price: 2200,
    tag: 'SWEET',
  },
  {
    id: 'extra-mocktail',
    name: 'Signature Mocktail Pairing',
    description: 'Two handcrafted mocktails paired with the film by our bar team',
    price: 2800,
    tag: 'EXCLUSIVE',
  },
];

const seatIndexes = new Map();
function seatIndexFor(layout) {
  if (!seatIndexes.has(layout)) {
    const index = new Map();
    for (const r of layout) {
      for (let n = 1; n <= r.seats; n += 1) {
        index.set(`${r.row}${n}`, { id: `${r.row}${n}`, row: r.row, number: n, tier: r.tier });
      }
    }
    seatIndexes.set(layout, index);
  }
  return seatIndexes.get(layout);
}

/** A seat in a hall's plan, or null if that hall has no such seat. */
export function getSeat(seatId, hallNumber) {
  return seatIndexFor(layoutFor(hallNumber)).get(seatId) || null;
}

/** Seats in one screening of a hall. */
export function seatCount(hallNumber) {
  return seatIndexFor(layoutFor(hallNumber)).size;
}

/** Seats per tier in one screening of a hall, e.g. { ORCHESTRA: 48, PREMIER: 36, LOGE: 16 }. */
export function tierCapacity(hallNumber) {
  const counts = Object.fromEntries(Object.keys(SEAT_TIERS).map((k) => [k, 0]));
  for (const r of layoutFor(hallNumber)) counts[r.tier] += r.seats;
  return counts;
}

export function getExtra(extraId) {
  return EXTRAS.find((e) => e.id === extraId) || null;
}


/**
 * Cancelling a PAID booking. Rules are checked in order; the first one whose
 * `minHoursBefore` the guest still meets decides the refund. Closer to the show
 * than the last rule, the booking can no longer be cancelled.
 * Checked-in bookings can never be cancelled.
 */
export const CANCELLATION_RULES = [
  { minHoursBefore: 24, refundPercent: 100 },
  { minHoursBefore: 2, refundPercent: 50 },
];
