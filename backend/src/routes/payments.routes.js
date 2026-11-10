import express, { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireUser } from '../middleware/auth.js';
import { isDemoPaymentsEnabled } from '../services/payments/index.js';
import { verifyPayHereNotification } from '../services/payments/payhere.js';
import {
  confirmBookingPayment,
  findBookingByRef,
  releaseBooking,
  toClientBooking,
} from '../services/bookingService.js';

const router = Router();

/**
 * POST /api/payments/payhere/notify
 * Server-to-server callback from PayHere (application/x-www-form-urlencoded).
 * This is the ONLY place a PayHere payment can confirm a booking.
 */
router.post(
  '/payhere/notify',
  express.urlencoded({ extended: false, limit: '20kb' }),
  async (req, res) => {
    try {
      const n = verifyPayHereNotification(req.body);
      if (!n.valid) {
        console.warn('[payhere] rejected notification with invalid signature');
        return res.status(400).send('invalid signature');
      }

      const row = supabaseAdmin ? await findBookingByRef(n.orderId) : null;
      if (!row) return res.status(404).send('unknown order');

      if (n.statusCode === 2) {
        const amountOk = Number(n.amount).toFixed(2) === Number(row.total_amount).toFixed(2);
        if (!amountOk || n.currency !== row.currency) {
          console.error(`[payhere] amount/currency mismatch for ${row.ref_code}`);
          return res.status(400).send('amount mismatch');
        }
        await confirmBookingPayment(row, 'payhere', n.paymentId);
      } else if (n.statusCode === -1) {
        await releaseBooking(row, 'cancelled');
      } else if (n.statusCode === -2) {
        await releaseBooking(row, 'failed');
      }
      // 0 = pending: keep the hold, PayHere will notify again.

      return res.status(200).send('ok');
    } catch (err) {
      console.error('[payhere] notify error:', err.message);
      return res.status(500).send('error');
    }
  }
);

/**
 * POST /api/payments/demo/complete  { ref, outcome: "success" | "cancel" }
 * Development-only stand-in for a real gateway. Disabled in production.
 */
router.post('/demo/complete', requireUser, async (req, res, next) => {
  try {
    if (!isDemoPaymentsEnabled()) {
      return res.status(404).json({ error: 'Not found' });
    }
    const { ref, outcome } = req.body || {};
    const row = await findBookingByRef(String(ref || ''));
    if (!row || row.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    let updated = row;
    if (outcome === 'success') {
      if (row.status === 'pending' && new Date(row.hold_expires_at) < new Date()) {
        updated = await releaseBooking(row, 'failed');
        return res.status(410).json({
          error: 'Your seat hold expired before payment completed.',
          booking: toClientBooking(updated),
        });
      }
      updated = await confirmBookingPayment(row, 'demo', `DEMO-${Date.now()}`);
    } else {
      updated = await releaseBooking(row, 'cancelled');
    }
    return res.json({ booking: toClientBooking(updated) });
  } catch (err) {
    return next(err);
  }
});

export default router;
