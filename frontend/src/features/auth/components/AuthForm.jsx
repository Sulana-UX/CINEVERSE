import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable Luxury Form Component
 * Handles submission, loading spinner, and high-end error notifications.
 */
export default function AuthForm({
  onSubmit,
  error,
  loading,
  submitText = 'ENTER CINEVERSE',
  children,
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      {/* Global Error Banner */}
      {error && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={17} className="auth-error-icon" />
          <span className="auth-error-text">{error}</span>
        </div>
      )}

      {/* Form Fields Stack */}
      <div className="auth-fields-stack">
        {children}
      </div>

      {/* Main Luxury Submit Button */}
      <button
        type="submit"
        className="auth-submit-btn"
        disabled={loading}
        id="auth-submit-button"
      >
        <span className="auth-btn-shine" aria-hidden="true" />
        {loading ? (
          <span className="auth-btn-loading">
            <span className="auth-btn-spinner" />
            <span>AUTHENTICATING...</span>
          </span>
        ) : (
          <span className="auth-btn-text">{submitText}</span>
        )}
      </button>
    </form>
  );
}
