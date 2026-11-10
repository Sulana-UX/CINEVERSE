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

/** Money owed back to guests, and refunds paid in the last 30 days. */
export const adminRefundsApi = {
  async list() {
    const { refunds } = await apiGet('/api/admin/bookings/refunds', { auth: true });
    return refunds;
  },
  async markRefunded(id, reference) {
    const { booking } = await apiPost(`/api/admin/bookings/${id}/refund`, { reference }, { auth: true });
    return booking;
  },
};
