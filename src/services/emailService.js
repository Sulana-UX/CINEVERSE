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
      console.warn('[emailService] sendOtp error:', err.message);
      return {
        success: false,
        error: err.message || 'Unable to connect to verification service.',
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
        throw new Error(`Verification service returned ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.warn('[emailService] verifyOtp error:', err.message);
      return {
        success: false,
        error: err.message || 'Verification failed. Please try again.',
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
