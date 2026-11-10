import { describe, expect, it } from 'vitest';
import { formatLKR } from '../utils/currency';
import {
  buildDateOptions,
  colomboToday,
  formatShowDate,
  formatShowTime,
  isShowOnSale,
  normaliseShowtimes,
} from '../features/booking/utils/showDates';
import { computeTotals, hallNumber, layoutForMovie } from '../features/booking/utils/bookingFlow';
import {
  validateEmail,
  validateLoginForm,
  validateNewPassword,
  validateRegisterForm,
} from '../features/auth/validation/authValidation';

describe('money', () => {
  it('formats rupees without decimals', () => {
    expect(formatLKR(4500)).toBe('Rs. 4,500');
    expect(formatLKR(1234567.6)).toBe('Rs. 1,234,568');
    expect(formatLKR(undefined)).toBe('Rs. 0');
  });
});

describe('show dates (Colombo time)', () => {
  it('uses UTC+05:30 for today', () => {
    expect(colomboToday(Date.parse('2026-11-10T18:29:00Z'))).toBe('2026-11-10');
    expect(colomboToday(Date.parse('2026-11-10T18:30:00Z'))).toBe('2026-11-11');
  });

  it('builds the date strip', () => {
    const days = buildDateOptions('2026-12-30', 3);
    expect(days.map((d) => d.value)).toEqual(['2026-12-30', '2026-12-31', '2027-01-01']);
    expect(days[0].weekday).toBe('Today');
    expect(days[1].weekday).toBe('Tomorrow');
  });

  it('formats dates and times', () => {
    expect(formatShowDate('2026-11-09')).toBe('Monday, 9 November 2026');
    expect(formatShowTime('00:05')).toBe('12:05 AM');
    expect(formatShowTime('12:00')).toBe('12:00 PM');
    expect(formatShowTime('20:30')).toBe('8:30 PM');
  });

  it('stops selling 15 minutes before the show', () => {
    const now = Date.parse('2026-11-10T13:44:00Z'); // 19:14 Colombo
    expect(isShowOnSale('2026-11-10', '19:30', 15, now)).toBe(true);
    expect(isShowOnSale('2026-11-10', '19:29', 15, now)).toBe(false);
  });

  it('cleans up showtime lists', () => {
    expect(normaliseShowtimes('20:30, 14:30,')).toEqual(['14:30', '20:30']);
    expect(normaliseShowtimes(null)).toEqual([]);
  });
});

describe('booking flow', () => {
  it('adds up seats and extras', () => {
    const totals = computeTotals([{ price: 2500 }, { price: 5000 }], { a: { price: 2200, quantity: 2 } });
    expect(totals).toEqual({ seatsTotal: 7500, extrasTotal: 4400, total: 11900 });
  });

  it('picks the seat plan of the film’s hall', () => {
    const config = { layout: ['default'], layouts: { '02': ['small hall'] } };
    expect(hallNumber('Auditorium 2 — The Director’s Loge')).toBe('02');
    expect(hallNumber('Somewhere else')).toBe(null);
    expect(layoutForMovie(config, { auditorium: 'Auditorium 02 — X' })).toEqual(['small hall']);
    expect(layoutForMovie(config, { auditorium: 'Auditorium 09 — Y' })).toEqual(['default']);
    expect(layoutForMovie(null, {})).toEqual([]);
  });
});

describe('auth forms', () => {
  it('checks emails', () => {
    expect(validateEmail('')).toMatch(/required/);
    expect(validateEmail('nope')).toMatch(/valid/);
    expect(validateEmail('a@b.co')).toBe(null);
  });

  it('applies the new-password rule (same as the backend)', () => {
    expect(validateNewPassword('abc12')).toMatch(/at least 8/);
    expect(validateNewPassword('abcdefgh')).toMatch(/letter and one number/);
    expect(validateNewPassword('a1'.repeat(37))).toMatch(/72/);
    expect(validateNewPassword('Cinema2026')).toBe(null);
  });

  it('only needs a password to sign in, so older accounts still work', () => {
    expect(validateLoginForm({ email: 'a@b.co', password: 'abc' }).isValid).toBe(true);
    expect(validateLoginForm({ email: 'a@b.co', password: '' }).errors.password).toMatch(/required/);
  });

  it('checks the whole sign-up form', () => {
    const r = validateRegisterForm({ fullName: 'A', email: 'x', password: 'Cinema2026', confirmPassword: 'Cinema2027' });
    expect(Object.keys(r.errors).sort()).toEqual(['confirmPassword', 'email', 'fullName']);
  });
});
