import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { colomboToday } from '../utils/showtime.js';

/** Shared database reads for the admin API. */

export async function loadHalls() {
  const { data, error } = await supabaseAdmin.from('auditoriums').select('*').order('sort_order');
  if (error) throw error;
  return data;
}

export async function loadMovies() {
  const { data, error } = await supabaseAdmin.from('movies').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Confirmed bookings, optionally only shows on or after `fromDate`. */
export async function loadConfirmedBookings({ fromDate } = {}) {
  let query = supabaseAdmin.from('bookings').select('*').eq('status', 'confirmed').limit(5000);
  if (fromDate) query = query.gte('show_date', fromDate);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Upcoming paid or in-progress bookings for one film, so the admin cannot
 * pull a screening out from under guests who already hold seats.
 */
export async function loadUpcomingBookingsForMovie(movieId) {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, show_date, show_time, auditorium, status')
    .eq('movie_id', movieId)
    .in('status', ['pending', 'confirmed'])
    .gte('show_date', colomboToday());
  if (error) throw error;
  return data;
}
