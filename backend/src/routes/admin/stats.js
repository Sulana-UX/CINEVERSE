import { Router } from 'express';
import { loadConfirmedBookings, loadHalls, loadMovies } from '../../services/adminData.js';
import { buildDashboardStats } from '../../services/adminStats.js';

const router = Router();

/** GET /api/admin/stats: numbers and charts for the overview tab. */
router.get('/', async (_req, res, next) => {
  try {
    const [movies, halls, bookings] = await Promise.all([loadMovies(), loadHalls(), loadConfirmedBookings()]);
    return res.json(buildDashboardStats({ movies, halls, bookings }));
  } catch (err) {
    return next(err);
  }
});

export default router;
