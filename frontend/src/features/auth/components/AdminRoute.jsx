import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdminUser } from '../utils/adminAuth';

const screen = {
  minHeight: '100vh',
  background: '#070707',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#F3E5AB',
  fontFamily: 'var(--font-sans, sans-serif)',
  gap: '1rem',
};

const button = (primary) => ({
  padding: '0.7rem 1.4rem',
  border: '1px solid #D4AF37',
  background: primary ? '#D4AF37' : 'transparent',
  color: primary ? '#070707' : '#D4AF37',
  textDecoration: 'none',
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
});

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, initializing, signedOut } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div style={screen}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '2px solid rgba(212, 175, 55, 0.2)',
            borderTopColor: '#D4AF37',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Verifying Admin Credentials...
        </span>
      </div>
    );
  }

  // A signed-in customer: signing in again would not help, so say so plainly.
  if (isAuthenticated && !isAdminUser(user)) {
    return (
      <div style={{ ...screen, textAlign: 'center', padding: '0 16px' }}>
        <span style={{ fontSize: '0.75rem', letterSpacing: '0.3em', color: '#D4AF37' }}>✦ STAFF ONLY ✦</span>
        <h1 style={{ fontFamily: 'var(--font-serif, serif)', fontWeight: 400, margin: 0, fontSize: '1.8rem' }}>
          This area is for CINEVERSE staff
        </h1>
        <p style={{ color: 'rgba(243,229,171,0.7)', maxWidth: 420, margin: 0, lineHeight: 1.6 }}>
          You are signed in as {user?.email}, which is a guest account.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/" replace style={button(true)}>Back to home</Link>
          <Link to="/my-bookings" replace style={button(false)}>My bookings</Link>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Someone who just pressed "Sign out" gets a plain notice; the
    // "admins only" warning is for visitors who open /admin signed out.
    const state = signedOut
      ? { message: 'You have been signed out.' }
      : {
          from: location,
          adminRequired: true,
          message: 'Admin authorization required. Please sign in with administrator credentials.',
        };
    return <Navigate to="/login" state={state} replace />;
  }

  return children;
}
