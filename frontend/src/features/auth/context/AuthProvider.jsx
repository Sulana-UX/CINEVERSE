import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { AuthContext } from './authContextInstance';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  // True only until the saved session has been checked once; `loading` also
  // covers login/logout requests, which must not hide the page.
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  // True right after the user pressed "Sign out" (not for a first visit).
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const initialSession = await authService.getSession();
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitializing(false);
        }
      }
    }

    initializeAuth();

    const subscription = authService.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);
        setInitializing(false);
      }
    });

    return () => {
      isMounted = false;
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.login(credentials);
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      setUser(result.user);
      setSession(result.session);
      setSignedOut(false);
      return { success: true, user: result.user };
    } catch (err) {
      const message = err.message || 'Login failed.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.register(payload);
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      setUser(result.user);
      setSession(result.session);
      setSignedOut(false);
      return { success: true, user: result.user };
    } catch (err) {
      const message = err.message || 'Registration failed.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    // Set first: Supabase's own sign-out event may clear the user before
    // authService.logout() returns.
    setSignedOut(true);
    try {
      await authService.logout();
      setUser(null);
      setSession(null);
    } catch (err) {
      setSignedOut(false);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    session,
    loading,
    initializing,
    signedOut,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
