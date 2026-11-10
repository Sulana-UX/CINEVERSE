import React from 'react';
import { AuthProvider } from '../features/auth/context/AuthProvider';
import AppRouter from './router';

export default function App() {
  return (
    <AuthProvider>
      <div className="cineverse-app">
        {/* Subtle organic film grain texture overlay */}
        <div className="film-grain" aria-hidden="true" />

        {/* Scalable App Router */}
        <AppRouter />
      </div>
    </AuthProvider>
  );
}
