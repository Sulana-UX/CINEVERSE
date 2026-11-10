import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { sendMail } from './mailer.js';
import { ticketEmail } from '../templates/ticketEmail.js';

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
  };
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
