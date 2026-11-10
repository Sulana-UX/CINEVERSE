import { MAX_SEATS_PER_BOOKING, SEAT_TIERS, getExtra, getSeat } from '../config/booking.js';

export class QuoteError extends Error {}

/**
 * Validate the requested seats / extras and price them from the server catalogue.
 * @param {{ seats: string[], addons?: Array<{id: string, quantity: number}>, hall?: string }} input
 *   hall: auditorium number ("02"); seats are checked against that hall's plan.
 */
export function buildQuote({ seats, addons = [], hall }) {
  if (!Array.isArray(seats) || seats.length === 0) {
    throw new QuoteError('Please choose at least one seat.');
  }

  const uniqueSeats = [...new Set(seats.map((s) => String(s).trim().toUpperCase()))];
  if (uniqueSeats.length > MAX_SEATS_PER_BOOKING) {
    throw new QuoteError(`You can book up to ${MAX_SEATS_PER_BOOKING} seats at a time.`);
  }

  const seatDetails = uniqueSeats.map((id) => {
    const seat = getSeat(id, hall);
    if (!seat) throw new QuoteError(`Seat ${id} does not exist.`);
    const tier = SEAT_TIERS[seat.tier];
    return { id: seat.id, tier: seat.tier, tierName: tier.name, price: tier.price };
  });

  if (!Array.isArray(addons)) throw new QuoteError('Invalid extras.');
  const addonLines = [];
  for (const item of addons) {
    const extra = getExtra(item?.id);
    const quantity = Number(item?.quantity);
    if (!extra) throw new QuoteError('Unknown extra selected.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new QuoteError(`Invalid quantity for ${extra.name}.`);
    }
    addonLines.push({ id: extra.id, name: extra.name, price: extra.price, quantity });
  }

  const seatsTotal = seatDetails.reduce((sum, s) => sum + s.price, 0);
  const addonsTotal = addonLines.reduce((sum, a) => sum + a.price * a.quantity, 0);

  return {
    seats: seatDetails.map((s) => s.id),
    seatDetails,
    addons: addonLines,
    seatsTotal,
    addonsTotal,
    total: seatsTotal + addonsTotal,
  };
}
