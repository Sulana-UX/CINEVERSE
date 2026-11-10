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
 * Rows from the screen (A) to the back (H). `aisleAfter` splits a row into
 * left / right blocks. Seat ids are `${row}${number}`, e.g. "D7".
 */
export const SEAT_LAYOUT = [
  { row: 'A', tier: 'ORCHESTRA', seats: 10, aisleAfter: 5 },
  { row: 'B', tier: 'ORCHESTRA', seats: 10, aisleAfter: 5 },
  { row: 'C', tier: 'ORCHESTRA', seats: 10, aisleAfter: 5 },
  { row: 'D', tier: 'PREMIER', seats: 10, aisleAfter: 5 },
  { row: 'E', tier: 'PREMIER', seats: 10, aisleAfter: 5 },
  { row: 'F', tier: 'PREMIER', seats: 10, aisleAfter: 5 },
  { row: 'G', tier: 'LOGE', seats: 8, aisleAfter: 4 },
  { row: 'H', tier: 'LOGE', seats: 8, aisleAfter: 4 },
];

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

const seatIndex = new Map();
for (const r of SEAT_LAYOUT) {
  for (let n = 1; n <= r.seats; n += 1) {
    seatIndex.set(`${r.row}${n}`, { id: `${r.row}${n}`, row: r.row, number: n, tier: r.tier });
  }
}

export function getSeat(seatId) {
  return seatIndex.get(seatId) || null;
}

export function getExtra(extraId) {
  return EXTRAS.find((e) => e.id === extraId) || null;
}

export const TOTAL_SEATS = seatIndex.size;
