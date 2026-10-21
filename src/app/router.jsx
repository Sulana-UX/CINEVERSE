import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../features/landing/pages/LandingPage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import BookingPage from '../features/booking/pages/BookingPage';
import AdminFilmsPage from '../features/admin/pages/AdminFilmsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Experience */}
        <Route path="/" element={<LandingPage />} />

        {/* Luxury Booking & Seat Reservation Experience */}
        <Route path="/booking" element={<BookingPage />} />

        {/* Admin Concierge & Film Upload Portal */}
        <Route path="/admin" element={<AdminFilmsPage />} />
        <Route path="/admin/movies" element={<AdminFilmsPage />} />

        {/* Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
