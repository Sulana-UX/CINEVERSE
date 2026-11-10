import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { passwordProblem } from '../src/utils/password.js';
import { escapeHtml, isEmail } from '../src/utils/escapeHtml.js';
import { ticketEmail } from '../src/templates/ticketEmail.js';
import { cancellationEmail } from '../src/templates/cancellationEmail.js';

describe('password rules', () => {
  it('needs 8 to 72 characters with a letter and a number', () => {
    assert.match(passwordProblem('abc12'), /at least 8/);
    assert.match(passwordProblem('abcdefgh'), /letter and one number/);
    assert.match(passwordProblem('12345678'), /letter and one number/);
    assert.match(passwordProblem('a1'.repeat(37)), /72/);
    assert.equal(passwordProblem('Cinema2026'), null);
  });
});

describe('verification codes (memory store)', () => {
  let otp;
  before(async () => {
    // Force the in-memory store even if Supabase variables are set in this shell.
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    otp = await import('../src/services/otpStore.js');
  });

  it('issues a code, enforces the resend wait, and uses a code once', async () => {
    const first = await otp.issueOtp('Guest@Example.com');
    assert.equal(first.ok, true);
    const again = await otp.issueOtp('guest@example.com');
    assert.equal(again.ok, false);
    assert.ok(again.retryAfterSec > 0);

    assert.equal((await otp.verifyOtp('guest@example.com', first.otp, { consume: false })).ok, true);
    assert.equal((await otp.verifyOtp('guest@example.com', first.otp)).ok, true);
    assert.equal((await otp.verifyOtp('guest@example.com', first.otp)).ok, false);
  });

  it('locks a code after 5 wrong attempts', async () => {
    const { otp: code } = await otp.issueOtp('locked@example.com');
    const wrong = code === '111111' ? '222222' : '111111';
    for (let i = 0; i < 5; i += 1) await otp.verifyOtp('locked@example.com', wrong);
    const result = await otp.verifyOtp('locked@example.com', code);
    assert.equal(result.ok, false);
    assert.match(result.error, /Too many/);
  });

  it('ignores input that is not 6 digits', async () => {
    assert.equal((await otp.verifyOtp('x@example.com', '12ab')).ok, false);
  });
});

describe('password reset', () => {
  it('reset keys can never be reached through the sign-up routes', () => {
    // Reset codes are stored as "password-reset <email>"; isEmail() rejects the space.
    assert.equal(isEmail('password-reset guest@example.com'), false);
  });

  it('reset email says what it is for', async () => {
    const { otpEmail } = await import('../src/templates/otpEmail.js');
    const reset = otpEmail({ fullName: '<b>Ann</b>', otp: '123456', purpose: 'reset' });
    assert.match(reset.subject, /password reset code: 123456/);
    assert.match(reset.html, /Reset Your Password/);
    assert.ok(!reset.html.includes('<b>Ann</b>'));
    assert.match(otpEmail({ otp: '654321' }).subject, /Access Key: 654321/);
  });
});

describe('emails', () => {
  it('escapes guest-supplied text', () => {
    assert.equal(escapeHtml('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
    assert.equal(isEmail('a@b.co'), true);
    assert.equal(isEmail('nope'), false);

    const { html } = ticketEmail({ refCode: 'CV-1', guestName: '<script>', movie: { title: 'F' }, showDate: '2026-11-12', time: '19:30', seats: ['A1'], totalAmount: 2500 });
    assert.ok(!html.includes('<script>'));
    assert.match(html, /7:30 PM/);
    assert.match(html, /Rs\. 2,500\.00/);
  });

  it('cancellation email wording depends on who cancelled', () => {
    const base = { refCode: 'CV-1', guestName: 'G', movieTitle: 'F', date: 'd', time: 't', seats: ['A1'], totalAmount: 100, refundAmount: 50, refundPercent: 50, refundDone: false };
    assert.match(cancellationEmail(base).html, /If you did not cancel/);
    const staff = cancellationEmail({ ...base, byStaff: true, reason: '<i>phone</i>' }).html;
    assert.match(staff, /our team has cancelled/);
    assert.match(staff, /Reason: &lt;i&gt;phone/);
  });
});
