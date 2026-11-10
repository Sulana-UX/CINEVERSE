import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../features/landing/pages/LandingPage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import BookingPage from '../features/booking/pages/BookingPage';
import BookingConfirmationPage from '../features/booking/pages/BookingConfirmationPage';
import DemoCheckoutPage from '../features/booking/pages/DemoCheckoutPage';
import MyBookingsPage from '../features/booking/pages/MyBookingsPage';
import AdminFilmsPage from '../features/admin/pages/AdminFilmsPage';
import AdminCheckInPage from '../features/admin/pages/AdminCheckInPage';
import AdminRoute from '../features/auth/components/AdminRoute';
import GuestRoute from '../features/auth/components/GuestRoute';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Experience */}
        <Route path="/" element={<LandingPage />} />

        {/* Luxury Booking & Seat Reservation Experience */}
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/checkout/demo" element={<DemoCheckoutPage />} />
        <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />

        {/* Protected Admin Concierge & Film Upload Portal */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminFilmsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/movies"
          element={
            <AdminRoute>
              <AdminFilmsPage />
            </AdminRoute>
          }
        />

        {/* Door check-in: the e-ticket QR code opens /admin/check-in/CV-XXXXXXXX */}
        <Route path="/admin/check-in" element={<AdminRoute><AdminCheckInPage /></AdminRoute>} />
        <Route path="/admin/check-in/:ref" element={<AdminRoute><AdminCheckInPage /></AdminRoute>} />

        {/* Authentication Routes */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
