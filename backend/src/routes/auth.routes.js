import { Router } from 'express';
import { sendMail } from '../services/mailer.js';
import { discardOtp, issueOtp, verifyOtp } from '../services/otpStore.js';
import { passwordProblem } from '../utils/password.js';
import { otpEmail } from '../templates/otpEmail.js';
import { isEmail } from '../utils/escapeHtml.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

/** POST /api/auth/otp/send  { email, fullName } */
router.post('/otp/send', async (req, res, next) => {
  try {
    const { email, fullName } = req.body || {};
    if (!isEmail(email)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const issued = await issueOtp(email);
    if (!issued.ok) {
      return res.status(429).json({
        success: false,
        error: `Please wait ${issued.retryAfterSec}s before requesting another code.`,
      });
    }

    const { subject, html } = otpEmail({ fullName, otp: issued.otp });
    const result = await sendMail({ to: email, subject, html });

    if (!result.sent) {
      await discardOtp(email);
      return res.status(502).json({
        success: false,
        emailSent: false,
        error: `Unable to send the verification email (${result.error}).`,
      });
    }

    return res.json({ success: true, emailSent: true });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/auth/register  { email, password, fullName, otp }
 * Verifies the emailed code, then creates an already-confirmed Supabase user.
 * The browser signs in normally afterwards, so every patron has a real session.
 */
router.post('/register', async (req, res, next) => {
  try {
    if (!supabaseAdmin) {
      return res.status(503).json({ success: false, error: 'Registration is temporarily unavailable.' });
    }

    const { email, password, fullName, otp } = req.body || {};
    if (!isEmail(email)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    const weak = passwordProblem(password);
    if (weak) {
      return res.status(400).json({ success: false, error: weak });
    }
    const name = String(fullName || '').trim().slice(0, 80);
    if (!name) {
      return res.status(400).json({ success: false, error: 'Please enter your full name.' });
    }

    const check = await verifyOtp(email, otp || '');
    if (!check.ok) {
      return res.status(400).json({ success: false, error: check.error });
    }

    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (error) {
      if (!/already|registered|exists/i.test(error.message)) throw error;

      // The email already has an account. If it was never confirmed (legacy
      // sign-ups), the OTP just proved ownership, so confirm it with this password.
      const existing = await findUserByEmail(cleanEmail);
      if (!existing || existing.email_confirmed_at) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists. Please sign in instead.',
        });
      }
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { ...existing.user_metadata, full_name: name },
      });
      if (updateError) throw updateError;
      return res.json({ success: true });
    }

    return res.status(201).json({ success: true, userId: data.user.id });
  } catch (err) {
    return next(err);
  }
});

async function findUserByEmail(email) {
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => (u.email || '').toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

/**
 * POST /api/auth/otp/verify  { email, otp }
 * Checks a code without using it up, so /register can still accept it.
 * Each check counts towards the 5-attempt limit.
 */
router.post('/otp/verify', async (req, res, next) => {
  try {
    const { email, otp } = req.body || {};
    if (!isEmail(email) || !otp) {
      return res.status(400).json({ success: false, error: 'Email and code are required.' });
    }

    const result = await verifyOtp(email, otp, { consume: false });
    if (!result.ok) {
      return res.status(400).json({ success: false, error: result.error });
    }
    return res.json({ success: true, verified: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
