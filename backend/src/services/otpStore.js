import { randomInt } from 'node:crypto';

/**
 * In-memory OTP store. Codes live for 10 minutes and allow 5 attempts.
 * Note: memory is per-process, so codes are lost on restart and are not
 * shared between multiple server instances (use Redis/DB for that).
 */
const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

const store = new Map();

const key = (email) => String(email).trim().toLowerCase();

export function canIssueOtp(email) {
  const record = store.get(key(email));
  if (!record) return { ok: true };
  const wait = record.issuedAt + RESEND_COOLDOWN_MS - Date.now();
  return wait > 0 ? { ok: false, retryAfterSec: Math.ceil(wait / 1000) } : { ok: true };
}

export function issueOtp(email) {
  const otp = String(randomInt(100000, 1000000));
  store.set(key(email), { otp, issuedAt: Date.now(), expiresAt: Date.now() + TTL_MS, attempts: 0 });
  return otp;
}

export function discardOtp(email) {
  store.delete(key(email));
}

export function verifyOtp(email, otp) {
  const k = key(email);
  const record = store.get(k);
  if (!record) return { ok: false, error: 'Verification code not found or expired.' };

  if (Date.now() > record.expiresAt) {
    store.delete(k);
    return { ok: false, error: 'Verification code has expired.' };
  }

  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    store.delete(k);
    return { ok: false, error: 'Too many attempts. Please request a new code.' };
  }

  if (record.otp !== String(otp).trim()) {
    return { ok: false, error: 'Incorrect 6-digit verification code.' };
  }

  store.delete(k);
  return { ok: true };
}

// Periodically drop expired codes so the map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [k, record] of store) {
    if (now > record.expiresAt) store.delete(k);
  }
}, 60 * 1000).unref();
