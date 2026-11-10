import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { destinationFor } from '../utils/adminAuth';

/**
 * Login and sign-up pages are for signed-out visitors only. A signed-in user
 * (for example after pressing Back) is sent straight on, without the form flashing.
 */
export default function GuestRoute({ children }) {
  const { user, isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <div style={{ minHeight: '100vh', background: '#070707' }} aria-busy="true" />;
  if (isAuthenticated) return <Navigate to={destinationFor(user, location.state?.from)} replace />;
  return children;
}
