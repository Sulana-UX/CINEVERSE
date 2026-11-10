import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * PayHere (Sri Lanka) checkout integration.
 * Docs: https://support.payhere.lk/api-&-mobile-sdk/checkout-api
 */
const md5Upper = (value) => createHash('md5').update(value).digest('hex').toUpperCase();

function config() {
  return {
    merchantId: process.env.PAYHERE_MERCHANT_ID || '',
    merchantSecret: process.env.PAYHERE_MERCHANT_SECRET || '',
    sandbox: process.env.PAYHERE_SANDBOX !== 'false',
    publicApiUrl: (process.env.PUBLIC_API_URL || '').replace(/\/$/, ''),
    frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  };
}

export function isPayHereConfigured() {
  const c = config();
  return Boolean(c.merchantId && c.merchantSecret && c.publicApiUrl);
}

const formatAmount = (amount) => Number(amount).toFixed(2);

/**
 * Build the auto-submitting form the browser posts to PayHere.
 * PayHere later calls notify_url (server to server) with the result.
 */
export function buildPayHereCheckout(booking, user) {
  const c = config();
  const amount = formatAmount(booking.total_amount);
  const hash = md5Upper(
    c.merchantId + booking.ref_code + amount + booking.currency + md5Upper(c.merchantSecret)
  );

  const [firstName, ...rest] = String(booking.guest_name || 'CINEVERSE Patron').split(' ');
  const ref = encodeURIComponent(booking.ref_code);

  return {
    provider: 'payhere',
    method: 'POST',
    action: c.sandbox ? 'https://sandbox.payhere.lk/pay/checkout' : 'https://www.payhere.lk/pay/checkout',
    fields: {
      merchant_id: c.merchantId,
      return_url: `${c.frontendUrl}/booking/confirmation?ref=${ref}`,
      cancel_url: `${c.frontendUrl}/booking/confirmation?ref=${ref}&cancelled=1`,
      notify_url: `${c.publicApiUrl}/api/payments/payhere/notify`,
      order_id: booking.ref_code,
      items: `${booking.movie_title} - ${booking.seats.length} seat(s)`,
      currency: booking.currency,
      amount,
      first_name: firstName || 'CINEVERSE',
      last_name: rest.join(' ') || 'Patron',
      email: user.email,
      phone: user.phone || '0000000000',
      address: 'CINEVERSE',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash,
    },
  };
}

/**
 * Verify a PayHere notify_url callback.
 * @returns {{ valid: boolean, orderId?: string, paymentId?: string, statusCode?: number, amount?: string, currency?: string }}
 */
export function verifyPayHereNotification(body) {
  const c = config();
  const {
    merchant_id: merchantId,
    order_id: orderId,
    payment_id: paymentId,
    payhere_amount: amount,
    payhere_currency: currency,
    status_code: statusCode,
    md5sig,
  } = body || {};

  if (!merchantId || merchantId !== c.merchantId || !orderId || !md5sig) return { valid: false };

  const expected = md5Upper(
    merchantId + orderId + amount + currency + statusCode + md5Upper(c.merchantSecret)
  );
  const a = Buffer.from(expected);
  const b = Buffer.from(String(md5sig).toUpperCase());
  const valid = a.length === b.length && timingSafeEqual(a, b);

  return { valid, orderId, paymentId, statusCode: Number(statusCode), amount, currency };
}
