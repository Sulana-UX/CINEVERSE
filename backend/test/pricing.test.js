import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HALL_LAYOUTS, SEAT_LAYOUT, SEAT_TIERS, getSeat, seatCount, tierCapacity } from '../src/config/booking.js';
import { QuoteError, buildQuote } from '../src/services/pricing.js';

describe('seat plans', () => {
  it('every hall plan uses known tiers, unique rows and a sensible aisle', () => {
    for (const [hall, layout] of Object.entries({ default: SEAT_LAYOUT, ...HALL_LAYOUTS })) {
      const rows = layout.map((r) => r.row);
      assert.equal(new Set(rows).size, rows.length, `duplicate row in hall ${hall}`);
      for (const r of layout) {
        assert.ok(SEAT_TIERS[r.tier], `unknown tier ${r.tier} in hall ${hall}`);
        assert.ok(r.aisleAfter > 0 && r.aisleAfter < r.seats, `bad aisle in hall ${hall} row ${r.row}`);
      }
    }
  });

  it('each hall has its own size', () => {
    assert.equal(seatCount('01'), 100);
    assert.equal(seatCount('02'), 44);
    assert.equal(seatCount('03'), 76);
    assert.equal(seatCount('99'), 76, 'unknown halls use the default plan');
    assert.deepEqual(tierCapacity('02'), { ORCHESTRA: 16, PREMIER: 16, LOGE: 12 });
  });

  it('a seat exists only in halls whose plan has it', () => {
    assert.equal(getSeat('I8', '01')?.tier, 'LOGE');
    assert.equal(getSeat('I8', '02'), null);
    assert.equal(getSeat('A10', '02'), null);
    assert.equal(getSeat('A10', '03')?.tier, 'ORCHESTRA');
  });
});

describe('buildQuote', () => {
  it('prices seats and extras from the server catalogue', () => {
    const q = buildQuote({
      seats: ['a1', 'C1', 'E1'],
      addons: [{ id: 'extra-chocolate', quantity: 2 }],
      hall: '02',
    });
    assert.deepEqual(q.seats, ['A1', 'C1', 'E1']);
    assert.equal(q.seatsTotal, 2500 + 3500 + 5000);
    assert.equal(q.addonsTotal, 4400);
    assert.equal(q.total, 15400);
  });

  it('ignores duplicate seats', () => {
    assert.deepEqual(buildQuote({ seats: ['A1', 'a1'], hall: '03' }).seats, ['A1']);
  });

  it('rejects bad input', () => {
    assert.throws(() => buildQuote({ seats: [], hall: '03' }), QuoteError);
    assert.throws(() => buildQuote({ seats: ['Z9'], hall: '03' }), /does not exist/);
    assert.throws(() => buildQuote({ seats: ['I8'], hall: '02' }), /does not exist/);
    assert.throws(() => buildQuote({ seats: 'A1,A2'.split(',').concat(['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9']), hall: '03' }), /up to 8/);
    assert.throws(() => buildQuote({ seats: ['A1'], addons: [{ id: 'nope', quantity: 1 }], hall: '03' }), /Unknown extra/);
    assert.throws(() => buildQuote({ seats: ['A1'], addons: [{ id: 'extra-chocolate', quantity: 0 }], hall: '03' }), /quantity/);
  });
});
