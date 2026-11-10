import { escapeHtml } from '../utils/escapeHtml.js';

const COPY = {
  signup: {
    subject: (otp) => `Your CINEVERSE Sanctuary Access Key: ${otp}`,
    heading: 'Verify Your Membership Key',
    body: 'Please use the private 6-digit access key below to verify your email address and activate your CINEVERSE patron membership.',
    footer: 'If you did not request this invitation, please disregard this transmission.',
  },
  reset: {
    subject: (otp) => `Your CINEVERSE password reset code: ${otp}`,
    heading: 'Reset Your Password',
    body: 'We received a request to reset the password for your CINEVERSE account. Enter the 6-digit code below to choose a new password.',
    footer: 'If you did not ask to reset your password, you can ignore this email. Your password stays the same.',
  },
};

/** @param {{ fullName?: string, otp: string, purpose?: 'signup' | 'reset' }} options */
export function otpEmail({ fullName, otp, purpose = 'signup' }) {
  const name = escapeHtml(fullName || 'Valued Patron');
  const copy = COPY[purpose] || COPY.signup;

  return {
    subject: copy.subject(otp),
    html: `
    <div style="background-color: #070707; color: #F5F2EB; font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px 20px; max-width: 580px; margin: 0 auto; border: 1px solid #D4AF37;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #D4AF37; font-size: 26px; letter-spacing: 0.25em; margin: 0;">CINEVERSE</h1>
        <p style="color: #888888; font-size: 11px; letter-spacing: 0.3em; margin: 4px 0 0; text-transform: uppercase;">Beyond the Screen</p>
      </div>
      <div style="background-color: #121212; border: 1px solid rgba(212, 175, 55, 0.35); padding: 30px; text-align: center;">
        <h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">${copy.heading}</h2>
        <p style="color: #CCCCCC; font-size: 14px; line-height: 1.6;">
          Greetings, <strong>${name}</strong>.<br/>
          ${copy.body}
        </p>
        <div style="background: linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 100%); border: 1px dashed #D4AF37; padding: 18px 24px; margin: 25px auto; display: inline-block;">
          <span style="font-size: 36px; letter-spacing: 0.35em; color: #F3E5AB; font-weight: bold; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #888888; font-size: 12px; margin-bottom: 0;">
          This code expires in 10 minutes. ${copy.footer}
        </p>
      </div>
    </div>`,
  };
}
