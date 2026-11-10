import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAdmin, requireUser } from '../middleware/auth.js';
import { toClientBooking } from '../services/bookingService.js';

const router = Router();

router.use((_req, res, next) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured.' });
  return next();
});
router.use(requireUser, requireAdmin);

/** GET /api/admin/bookings: paid reservations, newest first. */
router.get('/bookings', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .in('status', ['confirmed', 'refund_required'])
      .order('show_date', { ascending: false })
      .order('show_time', { ascending: false })
      .limit(500);
    if (error) throw error;
    return res.json({ bookings: data.map(toClientBooking) });
  } catch (err) {
    return next(err);
  }
});

/** POST /api/admin/bookings/:id/check-in  { checkedIn: boolean } */
router.post('/bookings/:id/check-in', async (req, res, next) => {
  try {
    const checkedIn = Boolean(req.body?.checkedIn);
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({
        checked_in: checkedIn,
        checked_in_at: checkedIn ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('status', 'confirmed')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Confirmed booking not found.' });
    return res.json({ booking: toClientBooking(data) });
  } catch (err) {
    return next(err);
  }
});

export default router;
