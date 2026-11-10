import nodemailer from 'nodemailer';
import { env, isSmtpConfigured } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
      connectionTimeout: 8000,
    });
  }
  return transporter;
}

/**
 * Send an email. Resolves to { sent: true } or { sent: false, error }.
 * Never throws, so routes can decide how to report delivery problems.
 */
export async function sendMail({ to, subject, html }) {
  if (!isSmtpConfigured) {
    return { sent: false, error: 'SMTP is not configured on the server (SMTP_USER / SMTP_PASS).' };
  }

  try {
    await getTransporter().sendMail({
      from: env.smtp.from || `"CINEVERSE Concierge" <${env.smtp.user}>`,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.warn('[mailer] send failed:', err.message);
    return { sent: false, error: err.message };
  }
}
