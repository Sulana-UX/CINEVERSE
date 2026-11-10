import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { colomboToday } from '../../utils/showtime.js';
import { loadHalls, loadMovies, loadUpcomingBookingsForMovie } from '../../services/adminData.js';
import {
  MovieInputError,
  auditoriumLabel,
  findScheduleClash,
  toClientMovie,
  validateMovieInput,
} from '../../services/movieCatalog.js';

const router = Router();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function inputError(res, err) {
  return res.status(400).json({ error: err.message, field: err.field || null });
}

/** Validate the body and check it does not clash with other films' screenings. */
async function prepareMovie(body, excludeId) {
  const [halls, movies] = await Promise.all([loadHalls(), loadMovies()]);
  const row = validateMovieInput(body, halls.map(auditoriumLabel));
  const clash = findScheduleClash(row, movies.filter((m) => m.id !== excludeId));
  if (clash) throw new MovieInputError(clash, 'showtimes');
  return row;
}

/** GET /api/admin/movies: every film, with how many upcoming bookings it has. */
router.get('/', async (_req, res, next) => {
  try {
    const movies = await loadMovies();
    const { data: upcoming, error } = await supabaseAdmin
      .from('bookings')
      .select('movie_id')
      .in('status', ['pending', 'confirmed'])
      .gte('show_date', colomboToday());
    if (error) throw error;

    const counts = new Map();
    for (const b of upcoming) counts.set(b.movie_id, (counts.get(b.movie_id) || 0) + 1);
    return res.json({
      movies: movies.map((m) => ({ ...toClientMovie(m), upcomingBookings: counts.get(String(m.id)) || 0 })),
    });
  } catch (err) {
    return next(err);
  }
});

/** POST /api/admin/movies */
router.post('/', async (req, res, next) => {
  try {
    const row = await prepareMovie(req.body);
    const { data, error } = await supabaseAdmin.from('movies').insert(row).select('*').single();
    if (error) throw error;
    return res.status(201).json({ movie: { ...toClientMovie(data), upcomingBookings: 0 } });
  } catch (err) {
    if (err instanceof MovieInputError) return inputError(res, err);
    return next(err);
  }
});

/** PUT /api/admin/movies/:id */
router.put('/:id', async (req, res, next) => {
  try {
    if (!UUID.test(req.params.id)) return res.status(404).json({ error: 'Film not found.' });
    const { data: existing, error: findError } = await supabaseAdmin
      .from('movies')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return res.status(404).json({ error: 'Film not found.' });

    const row = await prepareMovie(req.body, existing.id);

    // Guests who already hold seats keep their screening and hall.
    const upcoming = await loadUpcomingBookingsForMovie(existing.id);
    if (upcoming.length) {
      const removed = upcoming.find((b) => !row.showtimes.includes(b.show_time));
      if (removed) {
        return res.status(409).json({
          error: `Guests have booked the ${removed.show_time} screening on ${removed.show_date}. Keep that showtime until those screenings have passed.`,
          field: 'showtimes',
        });
      }
      if (row.auditorium !== existing.auditorium) {
        return res.status(409).json({
          error: `This film has ${upcoming.length} upcoming booking(s) in ${existing.auditorium}. The auditorium cannot change until they have passed.`,
          field: 'auditorium',
        });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('movies')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw error;
    return res.json({ movie: { ...toClientMovie(data), upcomingBookings: upcoming.length } });
  } catch (err) {
    if (err instanceof MovieInputError) return inputError(res, err);
    return next(err);
  }
});

/** DELETE /api/admin/movies/:id: refused while guests hold upcoming seats. */
router.delete('/:id', async (req, res, next) => {
  try {
    if (!UUID.test(req.params.id)) return res.status(404).json({ error: 'Film not found.' });
    const upcoming = await loadUpcomingBookingsForMovie(req.params.id);
    if (upcoming.length) {
      return res.status(409).json({
        error: `This film has ${upcoming.length} upcoming booking(s). Set it to "Coming Soon" to stop new sales, and remove it after those screenings.`,
      });
    }
    const { data, error } = await supabaseAdmin.from('movies').delete().eq('id', req.params.id).select('id');
    if (error) throw error;
    if (!data.length) return res.status(404).json({ error: 'Film not found.' });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

export default router;
