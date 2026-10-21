import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdminUser } from '../utils/adminAuth';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#070707',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F3E5AB',
          fontFamily: 'var(--font-sans, sans-serif)',
          gap: '1rem',
        }}
      >
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

  if (!isAuthenticated || !isAdminUser(user)) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          adminRequired: true,
          message: 'Admin authorization required. Please sign in with administrator credentials.',
        }}
        replace
      />
    );
  }

  return children;
}
