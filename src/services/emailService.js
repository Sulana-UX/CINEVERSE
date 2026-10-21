/**
 * CINEVERSE Client Email Service
 * Handles OTP dispatch/verification and Digital Ticket email dispatches.
 */

export const emailService = {
  /**
   * Request a 6-digit OTP verification key for patron registration
   */
  async sendOtp({ email, fullName }) {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-otp',
          email,
          fullName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email server returned ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.warn('[emailService] Local fetch fallback for sendOtp:', err.message);
      // Fallback local OTP generator if server middleware is unreachable
      const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem(`cineverse_otp_${email.toLowerCase()}`, fallbackOtp);
      return {
        success: true,
        otp: fallbackOtp,
        emailSent: false,
        fallback: true,
      };
    }
  },

  /**
   * Verify the 6-digit OTP code entered by the user
   */
  async verifyOtp({ email, otp }) {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          email,
          otp,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email server returned ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.warn('[emailService] Local verify fallback for verifyOtp:', err.message);
      const saved = sessionStorage.getItem(`cineverse_otp_${email.toLowerCase()}`);
      if (saved && saved === otp.trim()) {
        sessionStorage.removeItem(`cineverse_otp_${email.toLowerCase()}`);
        return { success: true, verified: true };
      }
      return {
        success: false,
        error: 'Invalid verification key. Please enter the 6 digits accurately.',
      };
    }
  },

  /**
   * Dispatch Royal Digital Ticket Pass to patron email
   */
  async sendTicketEmail({ booking, to }) {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-ticket',
          booking,
          to: to || booking.guestEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email server returned ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.warn('[emailService] Ticket dispatch notice:', err.message);
      return { success: true, emailSent: false, localSimulated: true };
    }
  },
};
