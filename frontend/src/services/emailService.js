/**
 * CINEVERSE Client Email Service
 * Talks to the backend for OTP dispatch/verification and digital ticket emails.
 */
import { apiPost } from '../lib/apiClient';

export const emailService = {
  /**
   * Request a 6-digit OTP verification key for patron registration
   */
  async sendOtp({ email, fullName }) {
    try {
      return await apiPost('/api/auth/otp/send', { email, fullName });
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
      return await apiPost('/api/auth/otp/verify', { email, otp });
    } catch (err) {
      console.warn('[emailService] verifyOtp error:', err.message);
      return {
        success: false,
        error: err.message || 'Verification failed. Please try again.',
      };
    }
  },

  // Ticket emails are sent by the backend once a payment is confirmed.
};
