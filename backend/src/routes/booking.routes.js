import { randomInt } from 'node:crypto';
import { Router } from 'express';
import {
  BOOKABLE_STATUSES,
  BOOKING_WINDOW_DAYS,
  CURRENCY,
  EXTRAS,
  HOLD_MINUTES,
  MAX_SEATS_PER_BOOKING,
  SALES_CUTOFF_MINUTES,
  SEAT_LAYOUT,
  SEAT_TIERS,
  TIMEZONE,
} from '../config/booking.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { isAdmin, requireUser } from '../middleware/auth.js';
import { QuoteError, buildQuote } from '../services/pricing.js';
import { activeProvider, createCheckout } from '../services/payments/index.js';
import { findBookingByRef, releaseBooking, toClientBooking } from '../services/bookingService.js';
import { colomboToday, validateShowSlot } from '../utils/showtime.js';

const router = Router();

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newRefCode() {
  let s = '';
  for (let i = 0; i < 8; i += 1) s += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `CV-${s}`;
}

function normaliseShowtimes(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

async function loadMovie(movieId) {
  if (!movieId || typeof movieId !== 'string') return null;
  const { data, error } = await supabaseAdmin
    .from('movies')
    .select('*')
    .eq('id', movieId)
    .maybeSingle();
  if (error) return null; // e.g. malformed id
  return data;
}

function requireDb(_req, res, next) {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Booking is temporarily unavailable (database not configured).' });
  }
  return next();
}

/** GET /api/booking/config: layout, prices and rules for the booking UI. */
router.get('/config', (_req, res) => {
  res.json({
    currency: CURRENCY,
    timezone: TIMEZONE,
    today: colomboToday(),
    bookingWindowDays: BOOKING_WINDOW_DAYS,
    salesCutoffMinutes: SALES_CUTOFF_MINUTES,
    maxSeats: MAX_SEATS_PER_BOOKING,
    holdMinutes: HOLD_MINUTES,
    bookableStatuses: BOOKABLE_STATUSES,
    tiers: SEAT_TIERS,
    layout: SEAT_LAYOUT,
    extras: EXTRAS,
    paymentProvider: activeProvider(),
  });
});

/** GET /api/booking/availability?movieId=&date=YYYY-MM-DD&time=HH:MM */
router.get('/availability', requireDb, async (req, res, next) => {
  try {
    const { movieId, date, time } = req.query;
    if (!movieId || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}:\d{2}$/.test(time || '')) {
      return res.status(400).json({ error: 'movieId, date and time are required.' });
    }

    await supabaseAdmin.rpc('release_expired_holds');
    const { data, error } = await supabaseAdmin
      .from('booking_seats')
      .select('seat_id')
      .eq('movie_id', movieId)
      .eq('show_date', date)
      .eq('show_time', time);
    if (error) throw error;

    res.set('Cache-Control', 'no-store');
    return res.json({ taken: data.map((r) => r.seat_id) });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/booking/holds  (signed-in)
 * { movieId, date, time, seats: ["D5","D6"], addons: [{id, quantity}] }
 * Creates a pending booking holding the seats, and returns payment checkout details.
 */
router.post('/holds', requireDb, requireUser, async (req, res, next) => {
  try {
    const provider = activeProvider();
    if (!provider) {
      return res.status(503).json({ error: 'Online payment is not available right now.' });
    }

    const { movieId, date, time, seats, addons } = req.body || {};

    const movie = await loadMovie(movieId);
    if (!movie || !BOOKABLE_STATUSES.includes(movie.status)) {
      return res.status(400).json({ error: 'This film is not open for booking.' });
    }
    if (!normaliseShowtimes(movie.showtimes).includes(time)) {
      return res.status(400).json({ error: 'That showtime is not scheduled for this film.' });
    }
    const slotError = validateShowSlot(date, time);
    if (slotError) return res.status(400).json({ error: slotError });

    let quote;
    try {
      quote = buildQuote({ seats, addons });
    } catch (err) {
      if (err instanceof QuoteError) return res.status(400).json({ error: err.message });
      throw err;
    }

    const user = req.user;
    const guestName =
      String(user.user_metadata?.full_name || '').trim() || user.email.split('@')[0];

    const { data: booking, error } = await supabaseAdmin.rpc('create_booking_hold', {
      p_ref_code: newRefCode(),
      p_user_id: user.id,
      p_guest_name: guestName,
      p_guest_email: user.email,
      p_movie_id: String(movie.id),
      p_movie_title: movie.title,
      p_auditorium: movie.auditorium || null,
      p_format: movie.format || null,
      p_show_date: date,
      p_show_time: time,
      p_seats: quote.seats,
      p_seat_details: quote.seatDetails,
      p_addons: quote.addons,
      p_seats_total: quote.seatsTotal,
      p_addons_total: quote.addonsTotal,
      p_total: quote.total,
      p_hold_minutes: HOLD_MINUTES,
      p_provider: provider,
    });

    if (error) {
      if (String(error.message).includes('SEAT_TAKEN')) {
        return res.status(409).json({
          error: 'Sorry, one or more of those seats were just taken. Please choose again.',
          code: 'SEAT_TAKEN',
        });
      }
      throw error;
    }

    return res.status(201).json({
      booking: toClientBooking(booking),
      checkout: createCheckout(booking, user),
    });
  } catch (err) {
    return next(err);
  }
});

async function loadOwnedBooking(req, res) {
  const row = await findBookingByRef(String(req.params.ref || ''));
  if (!row) {
    res.status(404).json({ error: 'Booking not found.' });
    return null;
  }
  if (row.user_id !== req.user.id && !(await isAdmin(req.user.id))) {
    res.status(404).json({ error: 'Booking not found.' });
    return null;
  }
  return row;
}

/** GET /api/booking/mine  (signed-in): the patron's recent bookings. */
router.get('/mine', requireDb, requireUser, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('user_id', req.user.id)
      .in('status', ['confirmed', 'refund_required'])
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return res.json({ bookings: data.map(toClientBooking) });
  } catch (err) {
    return next(err);
  }
});

/** GET /api/booking/:ref  (owner or admin) */
router.get('/:ref', requireDb, requireUser, async (req, res, next) => {
  try {
    await supabaseAdmin.rpc('release_expired_holds');
    const row = await loadOwnedBooking(req, res);
    if (!row) return undefined;
    res.set('Cache-Control', 'no-store');
    return res.json({ booking: toClientBooking(row) });
  } catch (err) {
    return next(err);
  }
});

/** POST /api/booking/:ref/cancel  (owner): give up an unpaid hold. */
router.post('/:ref/cancel', requireDb, requireUser, async (req, res, next) => {
  try {
    const row = await loadOwnedBooking(req, res);
    if (!row) return undefined;
    if (row.status !== 'pending') {
      return res.json({ booking: toClientBooking(row) });
    }
    const updated = await releaseBooking(row, 'cancelled');
    return res.json({ booking: toClientBooking(updated) });
  } catch (err) {
    return next(err);
  }
});

export default router;
