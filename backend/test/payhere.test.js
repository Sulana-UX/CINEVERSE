import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const md5 = (v) => createHash('md5').update(v).digest('hex').toUpperCase();
let payhere;

before(async () => {
  process.env.PAYHERE_MERCHANT_ID = '1211149';
  process.env.PAYHERE_MERCHANT_SECRET = 'test-secret';
  process.env.PUBLIC_API_URL = 'https://api.example.com/';
  process.env.FRONTEND_URL = 'https://cineverse.example.com';
  process.env.PAYHERE_SANDBOX = 'true';
  payhere = await import('../src/services/payments/payhere.js');
});

describe('PayHere', () => {
  it('signs the checkout form the way PayHere documents', () => {
    const booking = { ref_code: 'CV-ABC12345', total_amount: 7000, currency: 'LKR', guest_name: 'Nimali Perera', movie_title: 'F', seats: ['A1', 'A2'] };
    const { action, fields } = payhere.buildPayHereCheckout(booking, { email: 'n@example.com' });
    assert.equal(action, 'https://sandbox.payhere.lk/pay/checkout');
    assert.equal(fields.amount, '7000.00');
    assert.equal(fields.hash, md5(`1211149CV-ABC123457000.00LKR${md5('test-secret')}`));
    assert.equal(fields.notify_url, 'https://api.example.com/api/payments/payhere/notify');
    assert.equal(fields.first_name, 'Nimali');
    assert.equal(fields.last_name, 'Perera');
  });

  it('accepts a correctly signed notification and rejects a forged one', () => {
    const body = { merchant_id: '1211149', order_id: 'CV-ABC12345', payment_id: 'P1', payhere_amount: '7000.00', payhere_currency: 'LKR', status_code: '2' };
    body.md5sig = md5(`1211149CV-ABC123457000.00LKR2${md5('test-secret')}`);

    const ok = payhere.verifyPayHereNotification(body);
    assert.equal(ok.valid, true);
    assert.equal(ok.statusCode, 2);

    assert.equal(payhere.verifyPayHereNotification({ ...body, payhere_amount: '1.00' }).valid, false);
    assert.equal(payhere.verifyPayHereNotification({ ...body, merchant_id: '999' }).valid, false);
    assert.equal(payhere.verifyPayHereNotification({ ...body, md5sig: 'short' }).valid, false);
  });
});
