import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, colomboToday, showStartsAt, validateShowSlot } from '../src/utils/showtime.js';
import { quoteCancellation } from '../src/services/cancellation.js';
import { bookingRow } from './helpers.js';

describe('Colombo time', () => {
  it('today follows UTC+05:30', () => {
    assert.equal(colomboToday(new Date('2026-11-10T18:29:00Z')), '2026-11-10');
    assert.equal(colomboToday(new Date('2026-11-10T18:30:00Z')), '2026-11-11');
  });

  it('a show time converts to the right instant', () => {
    assert.equal(showStartsAt('2026-11-12', '19:30').toISOString(), '2026-11-12T14:00:00.000Z');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  });

  it('validates the booking window and sales cutoff', () => {
    const now = new Date('2026-11-10T06:30:00Z'); // 12:00 in Colombo
    assert.equal(validateShowSlot('2026-11-10', '18:00', now), null);
    assert.match(validateShowSlot('2026-11-10', '12:10', now), /closed/);
    assert.match(validateShowSlot('2026-11-09', '18:00', now), /next 7 days/);
    assert.match(validateShowSlot('2026-11-17', '18:00', now), /next 7 days/);
    assert.match(validateShowSlot('2026-11-10', '25:00', now), /Invalid showtime/);
  });
});

describe('cancellation rules', () => {
  // Show starts 2026-11-12 19:30 Colombo = 14:00Z.
  const at = (iso, row = bookingRow()) => quoteCancellation(row, new Date(iso));

  it('full refund up to 24 hours before', () => {
    const q = at('2026-11-11T14:00:00Z');
    assert.equal(q.refundPercent, 100);
    assert.equal(q.refundAmount, 7000);
  });

  it('half refund between 24 and 2 hours, rounded down', () => {
    const q = at('2026-11-11T14:00:01Z', bookingRow({ total_amount: 9999 }));
    assert.equal(q.refundPercent, 50);
    assert.equal(q.refundAmount, 4999);
  });

  it('no cancelling inside 2 hours, after the start, after check-in, or when not confirmed', () => {
    assert.equal(at('2026-11-12T12:00:00Z').allowed, true);
    assert.equal(at('2026-11-12T12:00:01Z').allowed, false);
    assert.match(at('2026-11-12T15:00:00Z').reason, /started/);
    assert.equal(at('2026-11-01T00:00:00Z', bookingRow({ checked_in: true })).allowed, false);
    assert.equal(at('2026-11-01T00:00:00Z', bookingRow({ status: 'cancelled' })).allowed, false);
  });
});
