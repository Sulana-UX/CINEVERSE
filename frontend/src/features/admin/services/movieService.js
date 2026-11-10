import { supabase, isSupabaseConfigured } from '../../../lib/supabaseClient';

/**
 * Public film catalogue (read-only). The movies table allows anyone to read;
 * admins add, edit and remove films through the backend (see adminApi.js).
 */

const DEFAULT_BACKDROP = '/images/luxury_cinema_interior.jpg';

function normaliseShowtimes(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map((t) => t.trim()).filter(Boolean);
  return [];
}

function toMovie(row) {
  return {
    id: row.id,
    title: row.title,
    format: row.format,
    rating: row.rating,
    runtime: row.runtime,
    director: row.director,
    auditorium: row.auditorium,
    tagline: row.tagline,
    description: row.description,
    backdrop: row.backdrop_url || DEFAULT_BACKDROP,
    showtimes: normaliseShowtimes(row.showtimes).sort(),
    status: row.status || 'Now Showing',
  };
}

export const movieService = {
  /** @returns {Promise<{ data: object[], error: string|null }>} */
  async getAllMovies() {
    if (!isSupabaseConfigured) {
      return { data: [], error: 'Supabase is not configured.' };
    }
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return { data: [], error: error.message };
      return { data: (data || []).map(toMovie), error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  },
};
