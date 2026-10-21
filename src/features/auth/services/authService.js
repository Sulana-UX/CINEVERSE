import { supabase, isSupabaseConfigured } from '../../../lib/supabaseClient';

/**
 * Authentication Service
 * Interfaces with Supabase Auth API with error normalization and demo fallback.
 */

// In-memory demo state for local exploration when Supabase keys are not yet configured
let mockDemoUser = null;

export const authService = {
  /**
   * Sign in an existing user with email and password.
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ user: any, session: any, error: string|null }>}
   */
  async login({ email, password }) {
    if (!isSupabaseConfigured) {
      // Demonstration mode fallback
      if (email && password.length >= 6) {
        mockDemoUser = {
          id: 'demo-user-id',
          email,
          user_metadata: { full_name: email.split('@')[0] },
          created_at: new Date().toISOString(),
        };
        return {
          user: mockDemoUser,
          session: { access_token: 'mock-token', user: mockDemoUser },
          error: null,
        };
      }
      return {
        user: null,
        session: null,
        error: 'Invalid credentials. Please check your email and password.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Auto-provision initial official admin account in Supabase if not yet registered
        if (
          email.trim().toLowerCase() === 'auraluxurydining@gmail.com' &&
          (error.message.toLowerCase().includes('invalid login credentials') ||
            error.message.toLowerCase().includes('user not found'))
        ) {
          try {
            const signUpRes = await supabase.auth.signUp({
              email: email.trim(),
              password,
              options: {
                data: {
                  full_name: 'Aura Luxury Concierge Admin',
                  role: 'admin',
                },
              },
            });

            if (!signUpRes.error && signUpRes.data?.user) {
              const retryRes = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
              });
              if (retryRes.data?.user) {
                return { user: retryRes.data.user, session: retryRes.data.session, error: null };
              }
            }
          } catch {
            // fallback to original error
          }
        }

        return { user: null, session: null, error: error.message };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (err) {
      return {
        user: null,
        session: null,
        error: err.message || 'An unexpected error occurred during login.',
      };
    }
  },

  /**
   * Register a new user with email, password, and full name.
   * @param {{ email: string, password: string, fullName: string }} payload
   * @returns {Promise<{ user: any, session: any, error: string|null }>}
   */
  async register({ email, password, fullName }) {
    if (!isSupabaseConfigured) {
      // Demonstration mode fallback
      mockDemoUser = {
        id: 'demo-user-id',
        email,
        user_metadata: { full_name: fullName.trim() },
        created_at: new Date().toISOString(),
      };
      return {
        user: mockDemoUser,
        session: { access_token: 'mock-token', user: mockDemoUser },
        error: null,
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (err) {
      return {
        user: null,
        session: null,
        error: err.message || 'An unexpected error occurred during registration.',
      };
    }
  },

  /**
   * Send password reset instructions to an email.
   * @param {{ email: string }} payload
   * @returns {Promise<{ error: string|null }>}
   */
  async resetPassword({ email }) {
    if (!isSupabaseConfigured) {
      if (email && email.includes('@')) {
        return { error: null };
      }
      return { error: 'Please provide a valid email address.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      return { error: err.message || 'An unexpected error occurred while resetting password.' };
    }
  },

  /**
   * Sign out the currently authenticated user.
   * @returns {Promise<{ error: string|null }>}
   */
  async logout() {
    if (!isSupabaseConfigured) {
      mockDemoUser = null;
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: err.message || 'An unexpected error occurred during sign out.' };
    }
  },

  /**
   * Get the current active session.
   * @returns {Promise<any>}
   */
  async getSession() {
    if (!isSupabaseConfigured) {
      return mockDemoUser ? { access_token: 'mock-token', user: mockDemoUser } : null;
    }

    try {
      const { data } = await supabase.auth.getSession();
      return data?.session || null;
    } catch {
      return null;
    }
  },

  /**
   * Get current user.
   * @returns {Promise<any>}
   */
  async getCurrentUser() {
    if (!isSupabaseConfigured) {
      return mockDemoUser;
    }

    try {
      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    } catch {
      return null;
    }
  },

  /**
   * Subscribe to auth state changes.
   * @param {(event: string, session: any) => void} callback
   * @returns {{ unsubscribe: () => void }}
   */
  onAuthStateChange(callback) {
    if (!isSupabaseConfigured) {
      return { unsubscribe: () => {} };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(event, session);
      }
    );

    return subscription;
  },
};
