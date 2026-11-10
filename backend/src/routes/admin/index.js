import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAdmin, requireUser } from '../../middleware/auth.js';
import auditoriumRoutes from './auditoriums.js';
import bookingRoutes from './bookings.js';
import conciergeRoutes from './concierge.js';
import movieRoutes from './movies.js';
import statsRoutes from './stats.js';

const router = Router();

router.use((_req, res, next) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured.' });
  return next();
});
// Every admin endpoint: signed in AND listed in public.admin_users.
router.use(requireUser, requireAdmin);

router.use('/bookings', bookingRoutes);
router.use('/movies', movieRoutes);
router.use('/auditoriums', auditoriumRoutes);
router.use('/concierge-orders', conciergeRoutes);
router.use('/stats', statsRoutes);

export default router;
