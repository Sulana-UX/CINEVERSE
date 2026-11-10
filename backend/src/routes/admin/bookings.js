import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import {
  CancellationError,
  cancelPaidBooking,
  toClientBooking,
  toOwnerBooking,
} from '../../services/bookingService.js';

const router = Router();

/** GET /api/admin/bookings: paid reservations, newest show first. */
router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .in('status', ['confirmed', 'refund_required'])
      .order('show_date', { ascending: false })
      .order('show_time', { ascending: false })
      .limit(500);
    if (error) throw error;
    // Include what the guest rules would refund now, for the staff cancel dialog.
    const now = new Date();
    return res.json({ bookings: data.map((row) => toOwnerBooking(row, now)) });
  } catch (err) {
    return next(err);
  }
});

/** GET /api/admin/bookings/refunds: money owed to guests, plus refunds paid in the last 30 days. */
router.get('/refunds', async (_req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .or(`refund_status.eq.pending,and(refund_status.eq.refunded,refunded_at.gte.${since})`)
      .order('updated_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return res.json({ refunds: data.map(toClientBooking) });
  } catch (err) {
    return next(err);
  }
});

/** POST /api/admin/bookings/:id/refund  { reference? }: staff paid the refund back. */
router.post('/:id/refund', async (req, res, next) => {
  try {
    const reference = typeof req.body?.reference === 'string' ? req.body.reference.trim().slice(0, 120) : '';
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({
        refund_status: 'refunded',
        refunded_at: new Date().toISOString(),
        refund_reference: reference || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('refund_status', 'pending')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'No pending refund for this booking.' });
    console.info(`[admin] refund for ${data.ref_code} marked paid by ${req.user.id}`);
    return res.json({ booking: toClientBooking(data) });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/admin/bookings/:id/cancel  { refund: 'policy'|'full'|'none', reason }
 * Staff cancel a paid booking for a guest (e.g. over the phone). Staff can do this
 * at any time before door check-in, and choose the refund:
 *   policy: what the guest would get by cancelling themselves now (0 inside 2 hours)
 *   full:   everything back (e.g. the cinema cancelled the screening)
 *   none:   nothing back
 */
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const choice = req.body?.refund;
    if (!['policy', 'full', 'none'].includes(choice)) {
      return res.status(400).json({ error: 'Choose a refund option.' });
    }
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length < 3 || reason.length > 300) {
      return res.status(400).json({ error: 'Add a short reason (3 to 300 characters). The guest sees it in their email.' });
    }

    const { data: row, error } = await supabaseAdmin.from('bookings').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!row) return res.status(404).json({ error: 'Booking not found.' });

    const policy = toOwnerBooking(row).cancellation;
    const refundAmount = choice === 'full' ? row.total_amount : choice === 'none' ? 0 : policy.allowed ? policy.refundAmount : 0;

    const cancelled = await cancelPaidBooking(row, { by: 'staff', refundAmount, reason });
    console.info(`[admin] ${cancelled.ref_code} cancelled by ${req.user.id}, refund ${refundAmount} (${choice})`);
    return res.json({ booking: toClientBooking(cancelled) });
  } catch (err) {
    if (err instanceof CancellationError) return res.status(409).json({ error: err.message, code: err.code });
    return next(err);
  }
});

/** POST /api/admin/bookings/:id/check-in  { checkedIn: boolean } */
router.post('/:id/check-in', async (req, res, next) => {
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
    return res.json({ booking: toOwnerBooking(data) });
  } catch (err) {
    return next(err);
  }
});

export default router;
