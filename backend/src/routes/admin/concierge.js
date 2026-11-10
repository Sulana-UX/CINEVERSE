import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { addDays, colomboToday } from '../../utils/showtime.js';
import { loadConfirmedBookings } from '../../services/adminData.js';
import { auditoriumNumber } from '../../services/movieCatalog.js';

const router = Router();

const STATUSES = ['Pending', 'Preparing', 'Delivered'];
// Show orders from screenings this many days back, so late deliveries stay visible.
const LOOKBACK_DAYS = 1;

/** In-seat service orders are the extras on confirmed bookings. */
function toOrder(b) {
  const hall = auditoriumNumber(b.auditorium);
  return {
    id: b.ref_code,
    bookingId: b.id,
    guestName: b.guest_name,
    movieTitle: b.movie_title,
    auditorium: hall ? `Auditorium ${hall}` : b.auditorium || '',
    seat: (b.seats || []).join(', '),
    items: (b.addons || []).map((a) => ({ name: a.name, quantity: a.quantity, price: a.price })),
    total: b.addons_total,
    status: b.concierge_status,
    showDate: b.show_date,
    orderTime: b.show_time,
    checkedIn: b.checked_in,
    updatedAt: b.concierge_updated_at,
  };
}

/** GET /api/admin/concierge-orders: today's and upcoming orders, soonest first. */
router.get('/', async (_req, res, next) => {
  try {
    const bookings = await loadConfirmedBookings({ fromDate: addDays(colomboToday(), -LOOKBACK_DAYS) });
    const orders = bookings
      .filter((b) => Array.isArray(b.addons) && b.addons.length > 0)
      .sort((a, b) => `${a.show_date} ${a.show_time}`.localeCompare(`${b.show_date} ${b.show_time}`))
      .map(toOrder);
    return res.json({ orders });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /api/admin/concierge-orders/:bookingId  { status } */
router.patch('/:bookingId', async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown order status.' });

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ concierge_status: status, concierge_updated_at: new Date().toISOString() })
      .eq('id', req.params.bookingId)
      .eq('status', 'confirmed')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.addons?.length) return res.status(404).json({ error: 'Order not found.' });
    return res.json({ order: toOrder(data) });
  } catch (err) {
    return next(err);
  }
});

export default router;
