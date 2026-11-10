import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { sendMail } from './mailer.js';
import { ticketEmail } from '../templates/ticketEmail.js';
import { cancellationEmail } from '../templates/cancellationEmail.js';
import { quoteCancellation } from './cancellation.js';

/** Shape a DB row for API responses (no internal ids beyond what the UI needs). */
export function toClientBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    refCode: row.ref_code,
    status: row.status,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    movieId: row.movie_id,
    movieTitle: row.movie_title,
    auditorium: row.auditorium,
    format: row.format,
    showDate: row.show_date,
    showTime: row.show_time,
    seats: row.seats,
    seatDetails: row.seat_details,
    addons: row.addons,
    seatsTotal: row.seats_total,
    addonsTotal: row.addons_total,
    totalAmount: row.total_amount,
    currency: row.currency,
    holdExpiresAt: row.hold_expires_at,
    paidAt: row.paid_at,
    checkedIn: row.checked_in,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at ?? null,
    cancelledBy: row.cancelled_by ?? null,
    refundAmount: row.refund_amount ?? null,
    refundStatus: row.refund_status ?? null,
    refundedAt: row.refunded_at ?? null,
  };
}

/** Booking for its owner, with whether (and for how much) it can be cancelled now. */
export function toOwnerBooking(row, now = new Date()) {
  const booking = toClientBooking(row);
  return booking ? { ...booking, cancellation: quoteCancellation(row, now) } : null;
}

export async function findBookingByRef(refCode) {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('ref_code', refCode)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function formatShowDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

async function sendTicket(row) {
  const { subject, html } = ticketEmail({
    refCode: row.ref_code,
    guestName: row.guest_name,
    movie: { title: row.movie_title, format: row.format, auditorium: row.auditorium },
    date: formatShowDate(row.show_date),
    showDate: row.show_date,
    time: row.show_time,
    seats: row.seats,
    seatDetails: row.seat_details,
    addons: row.addons,
    totalAmount: row.total_amount,
    currency: row.currency,
  });
  const result = await sendMail({ to: row.guest_email, subject, html });
  if (!result.sent) console.warn(`[booking] ticket email for ${row.ref_code} not sent:`, result.error);
}

/**
 * Mark a booking as paid. Sends the e-ticket the first time it becomes confirmed.
 */
export async function confirmBookingPayment(row, provider, reference) {
  const wasConfirmed = row.status === 'confirmed';
  const { data, error } = await supabaseAdmin.rpc('confirm_booking_payment', {
    p_booking_id: row.id,
    p_provider: provider,
    p_reference: reference,
  });
  if (error) throw error;

  if (!wasConfirmed && data.status === 'confirmed') {
    await sendTicket(data);
  }
  if (data.status === 'refund_required') {
    console.error(`[booking] ${data.ref_code} was paid after its seats were re-sold: REFUND REQUIRED`);
    if (!data.refund_status) {
      const { data: owed, error: owedError } = await supabaseAdmin
        .from('bookings')
        .update({ refund_status: 'pending', refund_amount: data.total_amount, updated_at: new Date().toISOString() })
        .eq('id', data.id)
        .select('*')
        .single();
      if (owedError) throw owedError;
      return owed;
    }
  }
  return data;
}

export async function releaseBooking(row, status) {
  const { data, error } = await supabaseAdmin.rpc('release_booking', {
    p_booking_id: row.id,
    p_status: status,
  });
  if (error) throw error;
  return data;
}

export class CancellationError extends Error {
  constructor(message, code, quote) {
    super(message);
    this.code = code;
    this.quote = quote;
  }
}

/**
 * Cancel a confirmed booking under the cancellation rules.
 * @param {object} row  bookings row
 * @param {{ by: 'guest'|'staff', expectedRefund?: number }} options
 *   expectedRefund: the amount the guest was shown; if the rules now give a
 *   different amount (e.g. the 24-hour line just passed) nothing is cancelled.
 */
export async function cancelPaidBooking(row, { by, expectedRefund } = {}) {
  const quote = quoteCancellation(row);
  if (!quote.allowed) throw new CancellationError(quote.reason, 'NOT_CANCELLABLE', quote);
  if (expectedRefund !== undefined && Number(expectedRefund) !== quote.refundAmount) {
    throw new CancellationError(
      `The refund for this booking is now Rs. ${quote.refundAmount.toLocaleString('en-LK')} (${quote.refundPercent}%). Please review and confirm again.`,
      'REFUND_CHANGED',
      quote
    );
  }

  const { data, error } = await supabaseAdmin.rpc('cancel_paid_booking', {
    p_booking_id: row.id,
    p_refund_amount: quote.refundAmount,
    p_cancelled_by: by,
  });
  if (error) {
    const known = ['NOT_CANCELLABLE', 'ALREADY_CHECKED_IN', 'NOT_FOUND'].find((c) => error.message?.includes(c));
    if (known) throw new CancellationError('This booking can no longer be cancelled.', known, quote);
    throw error;
  }

  let cancelled = data;
  // Demo payments move no money, so there is nothing for staff to pay back.
  if (cancelled.payment_provider === 'demo' && cancelled.refund_status === 'pending') {
    const { data: done, error: doneError } = await supabaseAdmin
      .from('bookings')
      .update({ refund_status: 'refunded', refunded_at: new Date().toISOString(), refund_reference: 'DEMO' })
      .eq('id', cancelled.id)
      .select('*')
      .single();
    if (doneError) throw doneError;
    cancelled = done;
  }

  const { subject, html } = cancellationEmail({
    refCode: cancelled.ref_code,
    guestName: cancelled.guest_name,
    movieTitle: cancelled.movie_title,
    date: formatShowDate(cancelled.show_date),
    time: cancelled.show_time,
    seats: cancelled.seats,
    totalAmount: cancelled.total_amount,
    refundAmount: cancelled.refund_amount,
    refundPercent: quote.refundPercent,
    refundDone: cancelled.refund_status === 'refunded',
  });
  const mail = await sendMail({ to: cancelled.guest_email, subject, html });
  if (!mail.sent) console.warn(`[booking] cancellation email for ${cancelled.ref_code} not sent:`, mail.error);

  return cancelled;
}
