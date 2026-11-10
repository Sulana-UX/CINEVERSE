import { buildPayHereCheckout, isPayHereConfigured } from './payhere.js';

/**
 * Which payment provider is active.
 *  - "payhere": real PayHere checkout (needs PAYHERE_* and PUBLIC_API_URL).
 *  - "demo":    a local test checkout for development. Refused in production.
 */
export function activeProvider() {
  const wanted = (process.env.PAYMENT_PROVIDER || 'demo').toLowerCase();
  if (wanted === 'payhere') return isPayHereConfigured() ? 'payhere' : null;
  if (wanted === 'demo') return process.env.NODE_ENV === 'production' ? null : 'demo';
  return null;
}

export function isDemoPaymentsEnabled() {
  return activeProvider() === 'demo';
}

export function createCheckout(booking, user) {
  const provider = activeProvider();
  if (provider === 'payhere') return buildPayHereCheckout(booking, user);
  if (provider === 'demo') {
    return {
      provider: 'demo',
      method: 'GET',
      action: `/booking/checkout/demo?ref=${encodeURIComponent(booking.ref_code)}`,
      fields: {},
    };
  }
  throw new Error('No payment provider is configured.');
}
