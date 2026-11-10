import { BOOKABLE_STATUSES, SEAT_TIERS } from '../config/booking.js';
import { addDays, colomboToday } from '../utils/showtime.js';
import { auditoriumNumber } from './movieCatalog.js';
import { SEATS_PER_SHOW, TIER_CAPACITY, buildTodayShows } from './hallSchedule.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekday = (dateStr) => WEEKDAYS[new Date(`${dateStr}T00:00:00Z`).getUTCDay()];
const seatCount = (b) => (Array.isArray(b.seats) ? b.seats.length : 0);
const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

/**
 * Everything the admin overview shows, computed from real data.
 * @param {{ movies: object[], halls: object[], bookings: object[], now?: Date }} input
 *   bookings: confirmed bookings (database rows)
 */
export function buildDashboardStats({ movies, halls, bookings, now = new Date() }) {
  const today = colomboToday(now);
  const yesterday = addDays(today, -1);
  const paidOn = (b) => (b.paid_at ? colomboToday(new Date(b.paid_at)) : null);

  // ---- headline numbers
  const ticketRevenue = bookings.reduce((s, b) => s + b.seats_total, 0);
  const conciergeRevenue = bookings.reduce((s, b) => s + b.addons_total, 0);
  const grossOn = (day) => bookings.filter((b) => paidOn(b) === day).reduce((s, b) => s + b.total_amount, 0);
  const todayGross = grossOn(today);
  const yesterdayGross = grossOn(yesterday);

  const todayShows = buildTodayShows(movies, today, now);
  const showCount = [...todayShows.values()].reduce((n, shows) => n + shows.length, 0);
  const todaysBookings = bookings.filter((b) => b.show_date === today);
  const seatsSoldToday = todaysBookings.reduce((n, b) => n + seatCount(b), 0);
  const capacityToday = showCount * SEATS_PER_SHOW;

  const openConcierge = bookings.filter(
    (b) => b.show_date >= today && Array.isArray(b.addons) && b.addons.length > 0 && b.concierge_status !== 'Delivered'
  ).length;

  // ---- revenue chart: today's screenings
  const soldByShow = new Map();
  for (const b of todaysBookings) {
    const key = `${b.movie_id}|${b.show_time}`;
    const cur = soldByShow.get(key) || { tickets: 0, dining: 0, seats: 0 };
    cur.tickets += b.seats_total;
    cur.dining += b.addons_total;
    cur.seats += seatCount(b);
    soldByShow.set(key, cur);
  }
  const hallName = new Map(halls.map((h) => [h.number, h.name]));
  const revenueToday = [...todayShows.entries()]
    .flatMap(([hall, shows]) =>
      shows.map((s) => {
        const sold = soldByShow.get(`${s.movieId}|${s.time}`) || { tickets: 0, dining: 0, seats: 0 };
        return { label: s.time, film: s.film, hall: hallName.get(hall) || `Auditorium ${hall}`, ...sold };
      })
    )
    .sort((a, b) => a.label.localeCompare(b.label));

  // ---- revenue chart: last 7 days of sales
  const revenueWeek = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = addDays(today, -i);
    const sold = bookings.filter((b) => paidOn(b) === day);
    revenueWeek.push({
      label: i === 0 ? 'Today' : weekday(day),
      date: day,
      film: 'All films',
      hall: 'All halls',
      tickets: sold.reduce((s, b) => s + b.seats_total, 0),
      dining: sold.reduce((s, b) => s + b.addons_total, 0),
      seats: sold.reduce((n, b) => n + seatCount(b), 0),
    });
  }

  // ---- occupancy today, by hall and by seat tier
  const hallOccupancy = halls.map((h) => {
    const shows = todayShows.get(h.number) || [];
    const sold = todaysBookings.filter((b) => auditoriumNumber(b.auditorium) === h.number);
    return {
      id: h.id,
      name: h.name,
      format: h.format,
      occupied: sold.reduce((n, b) => n + seatCount(b), 0),
      capacity: shows.length * SEATS_PER_SHOW,
      gross: sold.reduce((s, b) => s + b.total_amount, 0),
      shows: shows.length,
    };
  });

  const tierOccupancy = Object.entries(SEAT_TIERS).map(([key, tier]) => {
    let occupied = 0;
    let gross = 0;
    for (const b of todaysBookings) {
      for (const seat of b.seat_details || []) {
        if (seat.tier === key) {
          occupied += 1;
          gross += seat.price;
        }
      }
    }
    return { id: key, name: tier.name, price: tier.price, occupied, capacity: showCount * TIER_CAPACITY[key], gross };
  });

  // ---- today's timeline per hall
  const timeline = halls.map((h) => {
    const shows = todayShows.get(h.number) || [];
    return {
      id: h.id,
      auditorium: `Auditorium ${h.number} — ${h.name}`,
      format: h.format,
      films: [...new Set(shows.map((s) => s.film))],
      showtimes: shows.map((s) => ({ time: s.time, film: s.film, status: s.phase, progress: s.progress })),
    };
  });

  return {
    today,
    generatedAt: now.toISOString(),
    kpis: {
      totalGross: ticketRevenue + conciergeRevenue,
      ticketRevenue,
      conciergeRevenue,
      totalBookings: bookings.length,
      seatsSold: bookings.reduce((n, b) => n + seatCount(b), 0),
      checkedInToday: todaysBookings.filter((b) => b.checked_in).length,
      bookingsToday: todaysBookings.length,
      todayGross,
      yesterdayGross,
      grossChangePct: yesterdayGross ? Math.round(((todayGross - yesterdayGross) / yesterdayGross) * 100) : null,
      seatsSoldToday,
      capacityToday,
      occupancyToday: pct(seatsSoldToday, capacityToday),
      activeFilms: movies.filter((m) => BOOKABLE_STATUSES.includes(m.status)).length,
      totalFilms: movies.length,
      halls: halls.length,
      showsToday: showCount,
      conciergeOpen: openConcierge,
    },
    revenueToday,
    revenueWeek,
    hallOccupancy,
    tierOccupancy,
    timeline,
  };
}
