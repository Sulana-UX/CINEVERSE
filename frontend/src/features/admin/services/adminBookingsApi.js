import { apiGet, apiPost } from '../../../lib/apiClient';
import { formatShowDate, formatShowTime } from '../../booking/utils/showDates';

/** Convert an API booking into the shape the admin tables already render. */
function toAdminBooking(b) {
  return {
    id: b.refCode,
    dbId: b.id,
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    movieTitle: b.movieTitle,
    format: b.format,
    auditorium: b.auditorium,
    showtime: b.showTime,
    time: b.showTime,
    timeLabel: formatShowTime(b.showTime),
    showDate: b.showDate,
    date: { full: formatShowDate(b.showDate) },
    seats: b.seats,
    seatsDisplay: b.seats,
    tier: b.seatDetails?.[0]?.tierName || '',
    totalAmount: b.totalAmount,
    currency: b.currency,
    addons: (b.addons || []).map((a) => ({ name: a.name, quantity: a.quantity })),
    status: b.status === 'refund_required' ? 'Refund required' : 'Confirmed',
    checkedIn: b.checkedIn,
    bookedAt: b.createdAt,
  };
}

export const adminBookingsApi = {
  async list() {
    const { bookings } = await apiGet('/api/admin/bookings', { auth: true });
    return bookings.map(toAdminBooking);
  },

  async setCheckIn(dbId, checkedIn) {
    const { booking } = await apiPost(`/api/admin/bookings/${dbId}/check-in`, { checkedIn }, { auth: true });
    return toAdminBooking(booking);
  },
};

/** Dashboard KPIs from real bookings plus the (still local) concierge orders. */
export function computeDashboardMetrics(bookings, orders, auditoriums = []) {
  const ticketRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const conciergeRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalSeatsBooked = bookings.reduce((n, b) => n + (Array.isArray(b.seats) ? b.seats.length : 0), 0);
  const capacity = auditoriums.reduce((n, a) => n + (a.totalSeats || 0), 0);

  return {
    totalGross: ticketRevenue + conciergeRevenue,
    ticketRevenue,
    totalBookings: bookings.length,
    totalSeatsBooked,
    checkedInCount: bookings.filter((b) => b.checkedIn).length,
    conciergeOrdersCount: orders.length,
    occupancyRate: capacity ? Math.min(100, Math.round((totalSeatsBooked / capacity) * 100)) : 0,
  };
}
