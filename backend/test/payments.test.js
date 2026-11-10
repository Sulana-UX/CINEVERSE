import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { activeProvider } from '../src/services/payments/index.js';

const saved = { ...process.env };
afterEach(() => {
  for (const k of ['NODE_ENV', 'PAYMENT_PROVIDER', 'ALLOW_DEMO_PAYMENTS']) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('payment provider', () => {
  it('uses the demo checkout in development', () => {
    delete process.env.NODE_ENV;
    process.env.PAYMENT_PROVIDER = 'demo';
    assert.equal(activeProvider(), 'demo');
  });

  it('refuses the demo checkout in production unless it is switched on on purpose', () => {
    process.env.NODE_ENV = 'production';
    process.env.PAYMENT_PROVIDER = 'demo';
    delete process.env.ALLOW_DEMO_PAYMENTS;
    assert.equal(activeProvider(), null);
    process.env.ALLOW_DEMO_PAYMENTS = 'true';
    assert.equal(activeProvider(), 'demo');
  });
});

describe('Vercel entry point', () => {
  it('exports the Express app as a request handler', async () => {
    const { default: handler } = await import('../api/index.js');
    const { createServer } = await import('node:http');
    const server = createServer(handler).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    try {
      const res = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);
      assert.equal(res.status, 200);
      assert.equal((await res.json()).status, 'ok');
    } finally {
      server.close();
    }
  });
});
