import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findScheduleClash, runtimeMinutes, validateMovieInput } from '../src/services/movieCatalog.js';
import { buildTodayShows, withLiveState } from '../src/services/hallSchedule.js';
import { buildDashboardStats } from '../src/services/adminStats.js';
import { HALLS, HALL_LABELS, bookingRow } from './helpers.js';

const film = (overrides = {}) => ({
  title: 'Film',
  director: 'Director',
  format: '70MM',
  rating: 'PG',
  runtime: '120 MIN',
  auditorium: HALL_LABELS[0],
  showtimes: ['14:00', '17:00'],
  status: 'Now Showing',
  ...overrides,
});

describe('film validation', () => {
  it('accepts a valid film and normalises it', () => {
    const row = validateMovieInput(film({ showtimes: ['17:00', '14:00'], runtime: '2h' }), HALL_LABELS);
    assert.deepEqual(row.showtimes, ['14:00', '17:00']);
    assert.equal(row.runtime, '120 MIN');
  });

  it('rejects missing fields, bad times, unknown halls and data: posters', () => {
    assert.throws(() => validateMovieInput(film({ title: ' ' }), HALL_LABELS), /title/);
    assert.throws(() => validateMovieInput(film({ showtimes: ['24:00'] }), HALL_LABELS), /valid time/);
    assert.throws(() => validateMovieInput(film({ auditorium: 'Hall X' }), HALL_LABELS), /auditorium/);
    assert.throws(() => validateMovieInput(film({ backdrop: 'data:image/png;base64,AA' }), HALL_LABELS), /https/);
  });

  it("rejects a film's own overlapping screenings", () => {
    assert.throws(() => validateMovieInput(film({ showtimes: ['14:00', '15:30'] }), HALL_LABELS), /overlap/);
  });

  it('finds clashes with other films in the same hall only', () => {
    const row = validateMovieInput(film(), HALL_LABELS);
    const other = { title: 'Other', status: 'Now Showing', runtime: '100 MIN', showtimes: ['15:00'] };
    assert.match(findScheduleClash(row, [{ ...other, auditorium: HALL_LABELS[0] }]), /clashes/);
    assert.equal(findScheduleClash(row, [{ ...other, auditorium: HALL_LABELS[1] }]), null);
    assert.equal(findScheduleClash(row, [{ ...other, auditorium: HALL_LABELS[0], status: 'Coming Soon' }]), null);
  });

  it('reads runtimes written in different ways', () => {
    assert.equal(runtimeMinutes('169 MIN'), 169);
    assert.equal(runtimeMinutes('2h 49m'), 169);
    assert.equal(runtimeMinutes(95), 95);
  });
});

describe('dashboard numbers', () => {
  // 15:00 in Colombo on 2026-11-10.
  const now = new Date('2026-11-10T09:30:00Z');
  const movies = [
    { id: 'm1', title: 'Film A', status: 'Now Showing', auditorium: HALL_LABELS[1], runtime: '120 MIN', showtimes: ['14:00', '17:00'] },
    { id: 'm2', title: 'Film B', status: 'Coming Soon', auditorium: HALL_LABELS[0], runtime: '120 MIN', showtimes: ['14:00'] },
  ];

  it("today's schedule knows what is playing", () => {
    const shows = buildTodayShows(movies, '2026-11-10', now);
    assert.equal(shows.get('02')[0].phase, 'Live');
    assert.equal(shows.get('02')[0].progress, 50);
    assert.equal(shows.has('01'), false, 'Coming Soon films are not scheduled');

    const halls = withLiveState(HALLS.map((h) => ({ ...h })), shows, new Map([['m1|14:00', 2]]));
    assert.equal(halls[1].currentFilm, 'Film A');
    assert.equal(halls[1].occupiedSeats, 2);
    assert.equal(halls[0].currentFilm, 'No screening scheduled');
  });

  it('KPIs and capacity use each hall’s own seat plan', () => {
    const bookings = [
      bookingRow({ movie_id: 'm1', show_date: '2026-11-10', show_time: '14:00', paid_at: '2026-11-10T03:00:00Z', addons: [{ name: 'x', quantity: 1 }], addons_total: 2200, total_amount: 9200 }),
      bookingRow({ movie_id: 'm1', show_date: '2026-11-11', show_time: '17:00', paid_at: '2026-11-09T12:00:00Z' }),
    ];
    const s = buildDashboardStats({ movies, halls: HALLS, bookings, now });
    assert.equal(s.kpis.totalGross, 16200);
    assert.equal(s.kpis.todayGross, 9200);
    assert.equal(s.kpis.yesterdayGross, 7000);
    assert.equal(s.kpis.capacityToday, 2 * 44, 'two screenings in the 44-seat hall');
    assert.equal(s.kpis.seatsSoldToday, 2);
    assert.equal(s.kpis.conciergeOpen, 1);
    assert.equal(s.hallOccupancy[1].capacity, 88);
    assert.equal(s.tierOccupancy.find((t) => t.id === 'PREMIER').capacity, 32);
    assert.equal(s.revenueWeek.at(-1).label, 'Today');
  });
});
