/**
 * Admin Data Service for CINEVERSE Concierge Dashboard
 * Handles reservations, concierge orders, auditorium stats, and executive metrics
 */

const LOCAL_STORAGE_BOOKINGS_KEY = 'cineverse_admin_bookings';
const LOCAL_STORAGE_CONCIERGE_KEY = 'cineverse_admin_concierge_orders';

const INITIAL_BOOKINGS = [
  {
    id: 'BK-78921',
    guestName: 'Eleanor Vance',
    guestEmail: 'eleanor.vance@sovereign.io',
    movieTitle: 'DUNE: PART TWO',
    format: '70MM DUAL LASER',
    auditorium: 'Auditorium 01 — The Sovereign Soundstage',
    showtime: '20:30',
    date: 'Wednesday, Oct 21',
    seats: ['A1', 'A2'],
    tier: 'Royal Sovereign Loge',
    totalAmount: 184.00,
    addons: ['Dom Pérignon Vintage Champagne (x1)', 'Artisanal Charcuterie & Fromage (x1)'],
    status: 'Confirmed',
    checkedIn: true,
    bookedAt: '2026-10-21T09:15:00Z',
  },
  {
    id: 'BK-78922',
    guestName: 'Marcus Sterling',
    guestEmail: 'm.sterling@mayfair.co.uk',
    movieTitle: 'OPPENHEIMER',
    format: '70MM ULTRA PANAVISION',
    auditorium: 'Auditorium 02 — The Director’s Loge',
    showtime: '17:45',
    date: 'Wednesday, Oct 21',
    seats: ['B3', 'B4', 'B5'],
    tier: 'Premier Velvet Recliner',
    totalAmount: 156.00,
    addons: ['Black Truffle Glaze Popcorn (x2)'],
    status: 'Confirmed',
    checkedIn: false,
    bookedAt: '2026-10-21T10:30:00Z',
  },
  {
    id: 'BK-78923',
    guestName: 'Siddharth Roy',
    guestEmail: 'siddharth@luxuryrepertory.com',
    movieTitle: 'INTERSTELLAR',
    format: '10TH ANNIVERSARY 70MM',
    auditorium: 'Auditorium 03 — The Quantum Chamber',
    showtime: '20:30',
    date: 'Wednesday, Oct 21',
    seats: ['A4'],
    tier: 'Royal Sovereign Loge',
    totalAmount: 213.00,
    addons: ['Sommelier Curated Grand Cru (x1)', 'White Truffle Infused Warm Nuts (x1)'],
    status: 'Confirmed',
    checkedIn: true,
    bookedAt: '2026-10-21T11:05:00Z',
  },
  {
    id: 'BK-78924',
    guestName: 'Lady Genevieve Beaufort',
    guestEmail: 'g.beaufort@kensington.org',
    movieTitle: 'DUNE: PART TWO',
    format: '70MM DUAL LASER',
    auditorium: 'Auditorium 01 — The Sovereign Soundstage',
    showtime: '17:45',
    date: 'Wednesday, Oct 21',
    seats: ['C2', 'C3'],
    tier: 'Premier Velvet Recliner',
    totalAmount: 117.00,
    addons: ['Artisanal Charcuterie & Fromage (x1)'],
    status: 'Confirmed',
    checkedIn: false,
    bookedAt: '2026-10-21T12:40:00Z',
  },
  {
    id: 'BK-78925',
    guestName: 'Julian Croft',
    guestEmail: 'julian.croft@arch.design',
    movieTitle: 'OPPENHEIMER',
    format: '70MM ULTRA PANAVISION',
    auditorium: 'Auditorium 02 — The Director’s Loge',
    showtime: '20:30',
    date: 'Wednesday, Oct 21',
    seats: ['D1', 'D2', 'D3', 'D4'],
    tier: 'Orchestra Club Recliner',
    totalAmount: 152.00,
    addons: ['Black Truffle Glaze Popcorn (x2)', 'Pellegrino Sparkling Reserve (x2)'],
    status: 'Confirmed',
    checkedIn: false,
    bookedAt: '2026-10-21T13:20:00Z',
  },
];

const INITIAL_CONCIERGE_ORDERS = [
  {
    id: 'ORD-101',
    bookingId: 'BK-78921',
    guestName: 'Eleanor Vance',
    auditorium: 'Auditorium 01',
    seat: 'Loge A1-A2',
    items: [
      { name: 'Dom Pérignon Vintage 2013', quantity: 1, price: 380 },
      { name: 'Artisanal Charcuterie & Fromage', quantity: 1, price: 45 },
    ],
    total: 425,
    status: 'Delivered',
    orderTime: '19:45',
  },
  {
    id: 'ORD-102',
    bookingId: 'BK-78922',
    guestName: 'Marcus Sterling',
    auditorium: 'Auditorium 02',
    seat: 'Velvet B3-B5',
    items: [
      { name: 'Black Truffle Glaze Popcorn', quantity: 2, price: 24 },
    ],
    total: 48,
    status: 'Preparing',
    orderTime: '20:10',
  },
  {
    id: 'ORD-103',
    bookingId: 'BK-78923',
    guestName: 'Siddharth Roy',
    auditorium: 'Auditorium 03',
    seat: 'Loge A4',
    items: [
      { name: 'Sommelier Curated Grand Cru', quantity: 1, price: 165 },
      { name: 'White Truffle Infused Warm Nuts', quantity: 1, price: 28 },
    ],
    total: 193,
    status: 'Pending',
    orderTime: '20:25',
  },
];

export const adminDataService = {
  /**
   * Fetch all bookings
   */
  getBookings() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_BOOKINGS;
  },

  /**
   * Add a new confirmed reservation from the patron booking portal
   */
  addBooking(newBooking) {
    const current = this.getBookings();
    const updated = [newBooking, ...current];
    try {
      localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
    } catch {
      // fallback
    }
    return updated;
  },

  /**
   * Toggle ticket check-in status
   */
  toggleCheckIn(bookingId) {
    const current = this.getBookings();
    const updated = current.map((b) =>
      b.id === bookingId ? { ...b, checkedIn: !b.checkedIn } : b
    );
    try {
      localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
    } catch {
      // fallback
    }
    return updated;
  },

  /**
   * Fetch all concierge orders
   */
  getConciergeOrders() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CONCIERGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_CONCIERGE_ORDERS;
  },

  /**
   * Update concierge order status ('Pending' | 'Preparing' | 'Delivered')
   */
  updateOrderStatus(orderId, newStatus) {
    const current = this.getConciergeOrders();
    const updated = current.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    try {
      localStorage.setItem(LOCAL_STORAGE_CONCIERGE_KEY, JSON.stringify(updated));
    } catch {
      // fallback
    }
    return updated;
  },

  /**
   * Get Auditoriums Data with live capacity
   */
  getAuditoriums() {
    return [
      {
        id: 'aud-01',
        number: '01',
        name: 'The Sovereign Soundstage',
        format: '70MM DUAL LASER • DOLBY ATMOS',
        projection: 'Christie CP4450-RGB Pure Laser 70mm Architecture',
        sound: '64-Channel Dolby Atmos Spatial Soundstage',
        totalSeats: 48,
        occupiedSeats: 42,
        currentFilm: 'DUNE: PART TWO',
        nextShowtime: '20:30',
        status: 'Optimal Performance',
      },
      {
        id: 'aud-02',
        number: '02',
        name: 'The Director’s Loge',
        format: '70MM ULTRA PANAVISION • 6-TRACK STEREO',
        projection: 'Restored 70mm Kinoton Mechanical Archival Projector',
        sound: 'Discrete 6-Track Magnetic Sound Reproduction',
        totalSeats: 36,
        occupiedSeats: 29,
        currentFilm: 'OPPENHEIMER',
        nextShowtime: '17:45',
        status: 'Optimal Performance',
      },
      {
        id: 'aud-03',
        number: '03',
        name: 'The Quantum Chamber',
        format: '10TH ANNIVERSARY 70MM PRESENTATION',
        projection: 'Barco 4K Laser with 70mm High-Luminance Lens Array',
        sound: 'Custom Acoustics with Dual Sub-Bass Arrays',
        totalSeats: 42,
        occupiedSeats: 34,
        currentFilm: 'INTERSTELLAR',
        nextShowtime: '20:30',
        status: 'Active Screening',
      },
    ];
  },

  /**
   * Calculate executive dashboard KPI metrics
   */
  getDashboardMetrics() {
    const bookings = this.getBookings();
    const concierge = this.getConciergeOrders();

    const ticketRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const conciergeRevenue = concierge.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalGross = ticketRevenue + conciergeRevenue;

    const totalSeatsBooked = bookings.reduce(
      (count, b) => count + (Array.isArray(b.seats) ? b.seats.length : 1),
      0
    );

    const checkedInCount = bookings.filter((b) => b.checkedIn).length;

    return {
      totalGross: Math.round(totalGross * 100) / 100,
      totalBookings: bookings.length,
      totalSeatsBooked,
      checkedInCount,
      conciergeOrdersCount: concierge.length,
      occupancyRate: 86, // percentage
    };
  },
};
