/**
 * Shared fixtures for backend tests. Tests never touch the real database:
 * run them with `npm test` (no .env is loaded), so supabaseAdmin is null.
 */

/** A confirmed bookings-table row; override any column. */
export function bookingRow(overrides = {}) {
  return {
    id: 'b1',
    ref_code: 'CV-TEST0001',
    status: 'confirmed',
    user_id: 'u1',
    guest_name: 'Test Guest',
    guest_email: 'guest@example.com',
    movie_id: 'm1',
    movie_title: 'Test Film',
    auditorium: 'Auditorium 02 — The Director’s Loge',
    format: '70MM',
    show_date: '2026-11-12',
    show_time: '19:30',
    seats: ['C1', 'C2'],
    seat_details: [
      { id: 'C1', tier: 'PREMIER', tierName: 'Premier Velvet Recliner', price: 3500 },
      { id: 'C2', tier: 'PREMIER', tierName: 'Premier Velvet Recliner', price: 3500 },
    ],
    addons: [],
    seats_total: 7000,
    addons_total: 0,
    total_amount: 7000,
    currency: 'LKR',
    paid_at: '2026-11-10T04:00:00Z',
    checked_in: false,
    concierge_status: 'Pending',
    ...overrides,
  };
}

export const HALLS = [
  { id: 'aud-01', number: '01', name: 'The Sovereign Soundstage', format: 'F1' },
  { id: 'aud-02', number: '02', name: 'The Director’s Loge', format: 'F2' },
  { id: 'aud-03', number: '03', name: 'The Quantum Chamber', format: 'F3' },
];

export const HALL_LABELS = HALLS.map((h) => `Auditorium ${h.number} — ${h.name}`);
