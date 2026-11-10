import { supabase, isSupabaseConfigured } from '../../../lib/supabaseClient';
import { apiPost } from '../../../lib/apiClient';

/**
 * Authentication Service
 * Interfaces with Supabase Auth API with error normalization, local persistence, and admin demo fallback.
 */

const LOCAL_SESSION_KEY = 'cineverse_auth_session';
let mockDemoUser = null;
const authListeners = new Set();

function getStoredSession() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredSession(session) {
  try {
    if (session) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Ask the database whether this user is an administrator.
 * Reads public.admin_users, where RLS only lets a signed-in user see their own
 * row, so the answer cannot be faked from the browser: a forged local session
 * has no valid Supabase JWT and gets no row back.
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

function notifyAuthStateChange(event, session) {
  authListeners.forEach((callback) => {
    try {
      callback(event, session);
    } catch {
      // ignore
    }
  });
}

export const authService = {
  /**
   * Sign in an existing user with email and password.
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ user: any, session: any, error: string|null }>}
   */
  async login({ email, password }) {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!isSupabaseConfigured) {
      // Demonstration mode fallback for standard patrons
      if (email && password.length >= 6) {
        mockDemoUser = {
          id: 'demo-user-id',
          email: cleanEmail,
          user_metadata: {
            full_name: cleanEmail.split('@')[0],
            role: 'patron',
          },
          app_metadata: {
            role: 'patron',
          },
          created_at: new Date().toISOString(),
        };
        const session = { access_token: 'mock-token', user: mockDemoUser };
        setStoredSession(session);
        notifyAuthStateChange('SIGNED_IN', session);
        return {
          user: mockDemoUser,
          session,
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
        email: cleanEmail,
        password,
      });

      if (error) {
        // If Supabase returns 'Email not confirmed', Supabase ALREADY confirmed the password is valid!
        // (Wrong passwords return 'Invalid login credentials').
        if (
          error.message?.toLowerCase().includes('email not confirmed') ||
          error.code === 'email_not_confirmed'
        ) {
          // Never fabricate a session: the account must verify its email first.
          return {
            user: null,
            session: null,
            error:
              'This email has not been verified yet. Please use "Create account" with the same email to verify it.',
          };
        }

        return { user: null, session: null, error: error.message || 'Invalid login credentials.' };
      }

      // Password was verified by Supabase Auth; admin rights come from public.admin_users.
      const session = await withAdminFlag(data.session);
      if (data?.session) {
        setStoredSession(data.session);
        notifyAuthStateChange('SIGNED_IN', session);
      }

      return { user: session?.user || data.user, session, error: null };
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
   * @param {{ email: string, password: string, fullName: string, otp: string }} payload
   * @returns {Promise<{ user: any, session: any, error: string|null }>}
   */
  async register({ email, password, fullName, otp }) {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!isSupabaseConfigured) {
      mockDemoUser = {
        id: 'demo-user-id',
        email: cleanEmail,
        user_metadata: {
          full_name: fullName.trim(),
          role: 'patron',
        },
        app_metadata: {
          role: 'patron',
        },
        created_at: new Date().toISOString(),
      };
      const session = { access_token: 'mock-token', user: mockDemoUser };
      setStoredSession(session);
      notifyAuthStateChange('SIGNED_IN', session);
      return {
        user: mockDemoUser,
        session,
        error: null,
      };
    }

    try {
      // The backend checks the emailed code and creates an already-verified account...
      await apiPost('/api/auth/register', {
        email: cleanEmail,
        password,
        fullName: fullName.trim(),
        otp,
      });

      // ...then we sign in normally, so the patron gets a real Supabase session.
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        return { user: null, session: null, error: error.message };
      }

      const session = await withAdminFlag(data.session);
      setStoredSession(data.session);
      notifyAuthStateChange('SIGNED_IN', session);
      return { user: session.user, session, error: null };
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
    setStoredSession(null);
    mockDemoUser = null;
    notifyAuthStateChange('SIGNED_OUT', null);

    if (!isSupabaseConfigured) {
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
      const stored = getStoredSession();
      if (stored) return stored;
      return mockDemoUser ? { access_token: 'mock-token', user: mockDemoUser } : null;
    }

    try {
      // Prefer the real Supabase session; the admin flag is re-checked against
      // the database every time and never read from localStorage.
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setStoredSession(data.session);
        return await withAdminFlag(data.session);
      }
    } catch {
      // fall through to the locally stored patron session
    }

    const stored = getStoredSession();
    if (!stored) return null;
    return { ...stored, user: stored.user ? { ...stored.user, isAdmin: false } : stored.user };
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
   * Subscribe to auth state changes.
   * @param {(event: string, session: any) => void} callback
   * @returns {{ unsubscribe: () => void }}
   */
  onAuthStateChange(callback) {
    authListeners.add(callback);

    let supabaseSubscription = null;
    if (isSupabaseConfigured) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (session) {
              setStoredSession(session);
            }
            // Supabase warns against awaiting inside this callback, so resolve
            // the DB-backed admin flag asynchronously and then notify.
            setTimeout(async () => {
              callback(event, session ? await withAdminFlag(session) : session);
            }, 0);
          }
        );
        supabaseSubscription = subscription;
      } catch {
        // ignore
      }
    }

    return {
      unsubscribe: () => {
        authListeners.delete(callback);
        if (supabaseSubscription?.unsubscribe) {
          supabaseSubscription.unsubscribe();
        }
      },
    };
  },
};
