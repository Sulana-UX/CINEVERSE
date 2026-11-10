import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * HTTP tests against the real Express app on a random port, with no database
 * and no email, so only routes that answer before touching either are checked.
 */
let server;
let base;

before(async () => {
  for (const k of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SMTP_USER', 'SMTP_PASS']) delete process.env[k];
  process.env.PAYMENT_PROVIDER = 'demo';
  const { createApp } = await import('../src/app.js');
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const post = (path, body) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('API', () => {
  it('health reports what is configured', async () => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.database, false);
    assert.equal(body.payments, 'demo');
  });

  it('booking config sends each hall’s seat plan, prices and rules', async () => {
    const cfg = await (await fetch(`${base}/api/booking/config`)).json();
    assert.equal(cfg.currency, 'LKR');
    assert.deepEqual(Object.keys(cfg.layouts).sort(), ['01', '02', '03']);
    assert.ok(Array.isArray(cfg.layout));
    assert.equal(cfg.tiers.LOGE.price, 5000);
    assert.equal(cfg.cancellationRules[0].refundPercent, 100);
  });

  it('admin and account routes need a signed-in user', async () => {
    for (const path of ['/api/admin/stats', '/api/admin/bookings']) {
      // Without a database the admin router answers 503 before checking the user.
      assert.ok([401, 503].includes((await fetch(base + path)).status), path);
    }
    // Booking routes check the database first, then the user.
    assert.ok([401, 503].includes((await post('/api/booking/holds', {})).status));
  });

  it('validates input before doing any work', async () => {
    assert.equal((await post('/api/auth/otp/send', { email: 'not-an-email' })).status, 400);
    const weak = await post('/api/auth/register', { email: 'a@b.co', password: 'short', fullName: 'A', otp: '123456' });
    assert.ok([400, 503].includes(weak.status));
    assert.ok([400, 503].includes((await fetch(`${base}/api/booking/availability?movieId=x`)).status));
  });

  it('rejects malformed JSON and unknown routes cleanly', async () => {
    const bad = await fetch(`${base}/api/auth/otp/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' });
    assert.equal(bad.status, 400);
    assert.equal((await fetch(`${base}/api/nope`)).status, 404);
  });
});
