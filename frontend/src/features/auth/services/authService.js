import { supabase, isSupabaseConfigured } from '../../../lib/supabaseClient';
import { apiPost } from '../../../lib/apiClient';

/**
 * Authentication service. Supabase Auth checks passwords and keeps the session;
 * admin rights are read from public.admin_users. There is no offline or demo login.
 */

const NOT_CONFIGURED = 'Sign-in is unavailable: Supabase is not configured (see frontend/.env).';

// Older versions kept a copy of the session here; it is no longer used.
try {
  localStorage.removeItem('cineverse_auth_session');
} catch {
  // storage unavailable
}

/**
 * Ask the database whether this user is an administrator.
 * Reads public.admin_users, where RLS only lets a signed-in user see their own
 * row, so the answer cannot be faked from the browser.
 */
async function resolveIsAdmin(user) {
  if (!isSupabaseConfigured || !user?.id) return false;
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    return !error && Boolean(data);
  } catch {
    return false;
  }
}

/** Return a copy of the session whose user carries a DB-verified `isAdmin` flag. */
async function withAdminFlag(session) {
  if (!session?.user) return session;
  const isAdmin = await resolveIsAdmin(session.user);
  return { ...session, user: { ...session.user, isAdmin } };
}

export const authService = {
  /**
   * Sign in an existing user with email and password.
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ user: any, session: any, error: string|null }>}
   */
  async login({ email, password }) {
    if (!isSupabaseConfigured) return { user: null, session: null, error: NOT_CONFIGURED };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: (email || '').trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed') || error.code === 'email_not_confirmed') {
          return {
            user: null,
            session: null,
            error: 'This email has not been verified yet. Please use "Create account" with the same email to verify it.',
          };
        }
        return { user: null, session: null, error: error.message || 'Invalid login credentials.' };
      }

      const session = await withAdminFlag(data.session);
      return { user: session?.user || data.user, session, error: null };
    } catch (err) {
      return { user: null, session: null, error: err.message || 'An unexpected error occurred during login.' };
    }
  },

  /**
   * Register a new user. The backend checks the emailed code and creates an
   * already-verified account, then we sign in so the guest gets a real session.
   * @param {{ email: string, password: string, fullName: string, otp: string }} payload
   * @returns {Promise<{ user: any, session: any, error: string|null }>}
   */
  async register({ email, password, fullName, otp }) {
    if (!isSupabaseConfigured) return { user: null, session: null, error: NOT_CONFIGURED };
    const cleanEmail = (email || '').trim().toLowerCase();

    try {
      await apiPost('/api/auth/register', { email: cleanEmail, password, fullName: fullName.trim(), otp });

      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) return { user: null, session: null, error: error.message };

      const session = await withAdminFlag(data.session);
      return { user: session.user, session, error: null };
    } catch (err) {
      return { user: null, session: null, error: err.message || 'An unexpected error occurred during registration.' };
    }
  },

  /**
   * Forgot password, step 1: the backend emails a 6-digit reset code.
   * @param {string} email
   * @returns {Promise<{ message?: string, error: string|null }>}
   */
  async requestPasswordReset(email) {
    try {
      const res = await apiPost('/api/auth/password/forgot', { email: (email || '').trim().toLowerCase() });
      return { message: res.message, error: null };
    } catch (err) {
      return { error: err.message || 'Could not send the reset code. Please try again.' };
    }
  },

  /**
   * Forgot password, step 2: check the code and set the new password.
   * @param {{ email: string, otp: string, password: string }} payload
   * @returns {Promise<{ error: string|null }>}
   */
  async confirmPasswordReset({ email, otp, password }) {
    try {
      await apiPost('/api/auth/password/reset', { email: (email || '').trim().toLowerCase(), otp, password });
      return { error: null };
    } catch (err) {
      return { error: err.message || 'Could not change the password. Please try again.' };
    }
  },

  /**
   * Sign out the currently authenticated user.
   * @returns {Promise<{ error: string|null }>}
   */
  async logout() {
    if (!isSupabaseConfigured) return { error: null };
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? error.message : null };
    } catch (err) {
      return { error: err.message || 'An unexpected error occurred during sign out.' };
    }
  },

  /**
   * The current Supabase session (with the admin flag), or null.
   * @returns {Promise<any>}
   */
  async getSession() {
    if (!isSupabaseConfigured) return null;
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session ? await withAdminFlag(data.session) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get current user.
   * @returns {Promise<any>}
   */
  async getCurrentUser() {
    const session = await this.getSession();
    return session?.user || null;
  },

  /**
   * Subscribe to Supabase auth changes (sign in, sign out, token refresh).
   * @param {(event: string, session: any) => void} callback
   * @returns {{ unsubscribe: () => void }}
   */
  onAuthStateChange(callback) {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Supabase warns against awaiting inside this callback, so resolve the
      // DB-backed admin flag asynchronously and then notify.
      setTimeout(async () => {
        callback(event, session ? await withAdminFlag(session) : session);
      }, 0);
    });
    return { unsubscribe: () => subscription.unsubscribe() };
  },
};
