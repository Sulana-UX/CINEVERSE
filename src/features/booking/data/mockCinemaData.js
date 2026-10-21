/**
 * Curated Cinema Screening and Seating Data for CINEVERSE
 */

export const LUXURY_MOVIES = [
  {
    id: 'dune-2',
    title: 'DUNE: PART TWO',
    format: '70MM DUAL LASER • DOLBY ATMOS',
    rating: 'PG-13',
    runtime: '166 MIN',
    director: 'Denis Villeneuve',
    auditorium: 'Auditorium 01 — The Sovereign Soundstage',
    tagline: 'Long live the fighters.',
    backdrop: '/images/luxury_cinema_interior.jpg',
    description:
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between love and the fate of the universe.',
  },
  {
    id: 'oppenheimer',
    title: 'OPPENHEIMER',
    format: '70MM ULTRA PANAVISION • 6-TRACK STEREO',
    rating: 'R',
    runtime: '180 MIN',
    director: 'Christopher Nolan',
    auditorium: 'Auditorium 02 — The Director’s Loge',
    tagline: 'The world forever changes.',
    backdrop: '/images/luxury_cinema_details.jpg',
    description:
      'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb, rendered with unparalleled cinematic fidelity.',
  },
  {
    id: 'interstellar',
    title: 'INTERSTELLAR',
    format: '10TH ANNIVERSARY 70MM PRESENTATION',
    rating: 'PG-13',
    runtime: '169 MIN',
    director: 'Christopher Nolan',
    auditorium: 'Auditorium 03 — The Quantum Chamber',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    backdrop: '/images/luxury_cinema_interior.jpg',
    description:
      'A team of explorers travels through a wormhole in space in an attempt to ensure humanity’s survival, accompanied by Hans Zimmer’s legendary score in uncompressed acoustics.',
  },
];

export const SCREENING_DATES = [
  { day: 'TODAY', date: '21 OCT', full: 'Wednesday, Oct 21' },
  { day: 'THU', date: '22 OCT', full: 'Thursday, Oct 22' },
  { day: 'FRI', date: '23 OCT', full: 'Friday, Oct 23' },
  { day: 'SAT', date: '24 OCT', full: 'Saturday, Oct 24' },
  { day: 'SUN', date: '25 OCT', full: 'Sunday, Oct 25' },
];

export const SHOWTIMES = ['14:30', '17:45', '20:30', '23:00'];

export const SEAT_TIERS = {
  LOGE: {
    name: 'Royal Sovereign Loge',
    price: 48,
    color: '#D4AF37',
    description: 'Private balcony double recliner with champagne console',
  },
  PREMIER: {
    name: 'Premier Velvet Recliner',
    price: 36,
    color: '#F3E5AB',
    description: 'Motorized crimson plush recliner with personal tray',
  },
  ORCHESTRA: {
    name: 'Curated Orchestra Suite',
    price: 26,
    color: '#F5F1E8',
    description: 'Wide leather lounge seat with unobstructed view',
  },
};

/**
 * 6 rows of luxury seating (A-F), with 8 seats per row (split into 4 | aisle | 4)
 */
export const INITIAL_SEAT_GRID = [
  // Rows A-B: Orchestra
  { row: 'A', tier: 'ORCHESTRA', seats: [1, 2, 3, 4, 5, 6, 7, 8], reserved: [2, 7] },
  { row: 'B', tier: 'ORCHESTRA', seats: [1, 2, 3, 4, 5, 6, 7, 8], reserved: [3] },
  // Rows C-D: Premier
  { row: 'C', tier: 'PREMIER', seats: [1, 2, 3, 4, 5, 6, 7, 8], reserved: [4, 5] },
  { row: 'D', tier: 'PREMIER', seats: [1, 2, 3, 4, 5, 6, 7, 8], reserved: [] },
  // Rows E-F: Royal Sovereign Loge (Balcony)
  { row: 'E', tier: 'LOGE', seats: [1, 2, 3, 4, 5, 6, 7, 8], reserved: [1] },
  { row: 'F', tier: 'LOGE', seats: [1, 2, 3, 4, 5, 6, 7, 8], reserved: [4, 5] },
];

export const CONCIERGE_EXTRAS = [
  {
    id: 'extra-champagne',
    name: 'Dom Pérignon & White Truffle Popcorn',
    description: 'Chilled flute with warm popcorn tossed in Alba white truffle butter',
    price: 45,
    tag: 'SIGNATURE',
  },
  {
    id: 'extra-charcuterie',
    name: 'Artisan Charcuterie & Aged Formaggio',
    description: 'Prosciutto di Parma, artisanal cheeses, fig preserve & crackers',
    price: 32,
    tag: 'CONNOISSEUR',
  },
  {
    id: 'extra-chocolate',
    name: 'Valrhona Grand Cru Dark Ganache',
    description: 'Six hand-painted artisan chocolate truffles with gold leaf',
    price: 20,
    tag: 'SWEET',
  },
  {
    id: 'extra-sommelier',
    name: 'Private Sommelier Wine Pairing',
    description: 'Two glasses of vintage Bordeaux or Burgundy selected for the film',
    price: 28,
    tag: 'EXCLUSIVE',
  },
];
