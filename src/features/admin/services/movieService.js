import { supabase, isSupabaseConfigured } from '../../../lib/supabaseClient';
import { LUXURY_MOVIES } from '../../booking/data/mockCinemaData';

/**
 * Movie Management Service
 * Supports live Supabase CRUD with local fallback for offline development.
 */

// Local fallback cache in memory/localStorage so admin changes persist even before DB table setup
const LOCAL_STORAGE_KEY = 'cineverse_admin_movies';

function getLocalMovies() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // fallback
  }
  return LUXURY_MOVIES;
}

function saveLocalMovies(movies) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(movies));
  } catch {
    // fallback
  }
}

export const movieService = {
  /**
   * Fetch all movies from Supabase or local store
   */
  async getAllMovies() {
    if (!isSupabaseConfigured) {
      return { data: getLocalMovies(), error: null };
    }

    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[movieService] Supabase movies table not found or empty, falling back to local list:', error.message);
        return { data: getLocalMovies(), error: null };
      }

      if (data && data.length > 0) {
        // Map Supabase snake_case to frontend camelCase
        const mapped = data.map((item) => ({
          id: item.id,
          title: item.title,
          format: item.format,
          rating: item.rating,
          runtime: item.runtime,
          director: item.director,
          auditorium: item.auditorium,
          tagline: item.tagline,
          description: item.description,
          backdrop: item.backdrop_url || '/images/luxury_cinema_interior.jpg',
          showtimes: item.showtimes || ['14:30', '18:00', '21:15'],
          status: item.status || 'Now Showing',
        }));
        return { data: mapped, error: null };
      }

      return { data: getLocalMovies(), error: null };
    } catch (err) {
      return { data: getLocalMovies(), error: err.message };
    }
  },

  /**
   * Create a new movie
   */
  async createMovie(movie) {
    const newMovie = {
      ...movie,
      id: movie.id || `movie-${Date.now()}`,
    };

    // Always update local storage first so changes appear instantly
    const current = getLocalMovies();
    const updated = [newMovie, ...current.filter((m) => m.id !== newMovie.id)];
    saveLocalMovies(updated);

    if (!isSupabaseConfigured) {
      return { data: newMovie, error: null };
    }

    try {
      const { data, error } = await supabase.from('movies').insert([
        {
          title: movie.title.trim(),
          format: movie.format.trim(),
          rating: movie.rating,
          runtime: movie.runtime.trim(),
          director: movie.director?.trim(),
          auditorium: movie.auditorium,
          tagline: movie.tagline?.trim(),
          description: movie.description?.trim(),
          backdrop_url: movie.backdrop,
          showtimes: movie.showtimes,
          status: movie.status || 'Now Showing',
        },
      ]).select();

      if (error) {
        console.warn('[movieService] Supabase insert warning (persisted locally):', error.message);
        return { data: newMovie, error: null };
      }

      return { data: data?.[0] || newMovie, error: null };
    } catch {
      return { data: newMovie, error: null };
    }
  },

  /**
   * Update an existing movie
   */
  async updateMovie(id, updates) {
    const current = getLocalMovies();
    const updated = current.map((m) => (m.id === id ? { ...m, ...updates } : m));
    saveLocalMovies(updated);

    if (!isSupabaseConfigured) {
      return { error: null };
    }

    try {
      await supabase
        .from('movies')
        .update({
          title: updates.title,
          format: updates.format,
          rating: updates.rating,
          runtime: updates.runtime,
          director: updates.director,
          auditorium: updates.auditorium,
          tagline: updates.tagline,
          description: updates.description,
          backdrop_url: updates.backdrop,
          showtimes: updates.showtimes,
          status: updates.status,
        })
        .eq('id', id);

      return { error: null };
    } catch {
      return { error: null };
    }
  },

  /**
   * Delete a movie
   */
  async deleteMovie(id) {
    const current = getLocalMovies();
    const filtered = current.filter((m) => m.id !== id);
    saveLocalMovies(filtered);

    if (!isSupabaseConfigured) {
      return { error: null };
    }

    try {
      await supabase.from('movies').delete().eq('id', id);
      return { error: null };
    } catch {
      return { error: null };
    }
  },
};
