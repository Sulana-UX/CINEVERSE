import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../../../lib/apiClient';

/**
 * Admin dashboard data. Every call goes through the backend, which checks
 * the signed-in user is an admin before reading or changing anything.
 */
const auth = { auth: true };

export const adminApi = {
  // Films
  async listMovies() {
    const { movies } = await apiGet('/api/admin/movies', auth);
    return movies;
  },
  async createMovie(movie) {
    const { movie: saved } = await apiPost('/api/admin/movies', movie, auth);
    return saved;
  },
  async updateMovie(id, movie) {
    const { movie: saved } = await apiPut(`/api/admin/movies/${id}`, movie, auth);
    return saved;
  },
  deleteMovie(id) {
    return apiDelete(`/api/admin/movies/${id}`, auth);
  },

  // Auditoriums: each change returns the refreshed list.
  async listAuditoriums() {
    const { auditoriums } = await apiGet('/api/admin/auditoriums', auth);
    return auditoriums;
  },
  async updateAuditorium(id, changes) {
    const { auditoriums } = await apiPatch(`/api/admin/auditoriums/${id}`, changes, auth);
    return auditoriums;
  },
  async houseLights() {
    const { auditoriums } = await apiPost('/api/admin/auditoriums/house-lights', {}, auth);
    return auditoriums;
  },

  // In-seat service orders
  async listOrders() {
    const { orders } = await apiGet('/api/admin/concierge-orders', auth);
    return orders;
  },
  async setOrderStatus(bookingId, status) {
    const { order } = await apiPatch(`/api/admin/concierge-orders/${bookingId}`, { status }, auth);
    return order;
  },

  // Overview numbers and charts
  getStats() {
    return apiGet('/api/admin/stats', auth);
  },
};
