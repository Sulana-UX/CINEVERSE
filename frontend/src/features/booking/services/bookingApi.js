import { apiGet, apiPost } from '../../../lib/apiClient';

export const bookingApi = {
  getConfig() {
    return apiGet('/api/booking/config');
  },

  async getTakenSeats({ movieId, date, time }) {
    const q = new URLSearchParams({ movieId, date, time });
    const { taken } = await apiGet(`/api/booking/availability?${q}`);
    return taken || [];
  },

  /** Hold seats and get payment checkout details. Requires sign-in. */
  createHold({ movieId, date, time, seats, addons }) {
    return apiPost('/api/booking/holds', { movieId, date, time, seats, addons }, { auth: true });
  },

  async getBooking(ref) {
    const { booking } = await apiGet(`/api/booking/${encodeURIComponent(ref)}`, { auth: true });
    return booking;
  },

  /** Release an unpaid seat hold. */
  async cancelBooking(ref) {
    const { booking } = await apiPost(`/api/booking/${encodeURIComponent(ref)}/cancel`, {}, { auth: true });
    return booking;
  },

  /** The signed-in guest's paid bookings (including cancelled ones). */
  async getMyBookings() {
    const { bookings } = await apiGet('/api/booking/mine', { auth: true });
    return bookings;
  },

  /**
   * Cancel a paid booking. `expectedRefund` is the amount shown to the guest;
   * if the refund has changed since, the server refuses with code REFUND_CHANGED.
   */
  async cancelPaidBooking(ref, expectedRefund) {
    const { booking } = await apiPost(
      `/api/booking/${encodeURIComponent(ref)}/cancel`,
      { expectedRefund },
      { auth: true }
    );
    return booking;
  },

  async completeDemoPayment(ref, outcome) {
    const { booking } = await apiPost('/api/payments/demo/complete', { ref, outcome }, { auth: true });
    return booking;
  },
};

/** Send the browser to the payment page returned by the backend. */
export function redirectToCheckout(checkout, navigate) {
  if (checkout.method === 'GET' && checkout.action.startsWith('/')) {
    navigate(checkout.action);
    return;
  }
  const form = document.createElement('form');
  form.method = checkout.method || 'POST';
  form.action = checkout.action;
  Object.entries(checkout.fields || {}).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}
