import { randomInt } from 'node:crypto';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

/**
 * Email verification codes: 10 minutes, 5 attempts, 30 s between sends.
 * Stored (hashed) in Supabase table public.otp_codes, so they survive a restart
 * and work across several servers. Without a database (local dev only) they
 * fall back to process memory.
 */
const TTL_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

const MESSAGES = {
  not_found: 'Verification code not found or expired. Please request a new code.',
  expired: 'Verification code has expired. Please request a new code.',
  too_many: 'Too many attempts. Please request a new code.',
  wrong: 'Incorrect 6-digit verification code.',
};

const normalise = (email) => String(email).trim().toLowerCase();
const newCode = () => String(randomInt(100000, 1000000));

// ---------------------------------------------------------------- memory fallback
const memory = new Map();

function memoryIssue(email, code) {
  const now = Date.now();
  const record = memory.get(email);
  if (record) {
    const wait = Math.ceil((record.sentAt + RESEND_COOLDOWN_SECONDS * 1000 - now) / 1000);
    if (wait > 0) return wait;
  }
  memory.set(email, { code, sentAt: now, expiresAt: now + TTL_SECONDS * 1000, attempts: 0 });
  return 0;
}

function memoryCheck(email, code, consume) {
  const record = memory.get(email);
  if (!record) return 'not_found';
  if (Date.now() > record.expiresAt) {
    memory.delete(email);
    return 'expired';
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    memory.delete(email);
    return 'too_many';
  }
  record.attempts += 1;
  if (record.code !== code) return 'wrong';
  if (consume) memory.delete(email);
  return 'ok';
}

// ---------------------------------------------------------------- public API

/**
 * Create a code for this email.
 * @returns {Promise<{ ok: true, otp: string } | { ok: false, retryAfterSec: number }>}
 */
export async function issueOtp(email) {
  const key = normalise(email);
  const otp = newCode();
  let wait;
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.rpc('issue_otp', {
      p_email: key,
      p_code: otp,
      p_ttl_seconds: TTL_SECONDS,
      p_cooldown_seconds: RESEND_COOLDOWN_SECONDS,
    });
    if (error) throw error;
    wait = data;
  } else {
    wait = memoryIssue(key, otp);
  }
  return wait > 0 ? { ok: false, retryAfterSec: wait } : { ok: true, otp };
}

/** Forget the code (e.g. the email could not be sent). */
export async function discardOtp(email) {
  const key = normalise(email);
  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.from('otp_codes').delete().eq('email', key);
    if (error) throw error;
  } else {
    memory.delete(key);
  }
}

/**
 * Check a code. Every call counts as an attempt.
 * @param {{ consume?: boolean }} options  consume: delete the code when it is correct
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function verifyOtp(email, otp, { consume = true } = {}) {
  const key = normalise(email);
  const code = String(otp ?? '').trim();
  if (!/^\d{6}$/.test(code)) return { ok: false, error: MESSAGES.wrong };

  let status;
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.rpc('check_otp', {
      p_email: key,
      p_code: code,
      p_max_attempts: MAX_ATTEMPTS,
      p_consume: consume,
    });
    if (error) throw error;
    status = data;
  } else {
    status = memoryCheck(key, code, consume);
  }
  return status === 'ok' ? { ok: true } : { ok: false, error: MESSAGES[status] || MESSAGES.wrong };
}

// Drop expired in-memory codes so the fallback map does not grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [k, record] of memory) if (now > record.expiresAt) memory.delete(k);
}, 60 * 1000).unref();
