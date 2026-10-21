import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, CheckCircle2, X } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import AuthForm from '../components/AuthForm';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../hooks/useAuth';
import { validateLoginForm } from '../validation/authValidation';
import { isAdminUser } from '../utils/adminAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resetPassword, loading, error: authError, clearError, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState(null); // { type: 'success' | 'error', message: string }

  // If already authenticated, redirect to admin portal or destination or home
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdminUser(user)) {
        const from = location.state?.from?.pathname;
        navigate(from || '/admin', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  // Clear auth errors when component unmounts or inputs change
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear individual field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors } = validateLoginForm({
      email: formData.email,
      password: formData.password,
    });

    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const result = await login({
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      if (isAdminUser(result.user)) {
        navigate('/admin', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    }
  };

  const handleOpenForgotModal = () => {
    setForgotEmail(formData.email || '');
    setForgotStatus(null);
    setShowForgotModal(true);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotStatus({
        type: 'error',
        message: 'Please enter a valid member email address.',
      });
      return;
    }

    setForgotLoading(true);
    setForgotStatus(null);
    const result = await resetPassword({ email: forgotEmail });
    setForgotLoading(false);

    if (result.success) {
      setForgotStatus({
        type: 'success',
        message: 'A private reset dispatch has been delivered to your email inbox.',
      });
    } else {
      setForgotStatus({
        type: 'error',
        message: result.error || 'Unable to dispatch reset email. Please verify and try again.',
      });
    }
  };

  return (
    <AuthLayout
      eyebrow="WELCOME BACK"
      title="Your Journey Beyond the Screen Begins Here."
      subtitle="Sign in to discover a world of extraordinary cinematic experiences."
      visualProps={{
        imageSrc: '/images/luxury_cinema_interior.jpg',
        imageAlt: 'CINEVERSE Grand Auditorium with Crimson Velvet Recliners and Golden Lighting',
        badgeText: 'AUDITORIUM NO. 01 • PRIVATE SCREENING SUITE',
        eyebrow: 'THE ART OF CINEMA',
        heading: 'Where Every Frame Feels Extraordinary.',
        supportingText:
          'Step into a world where storytelling, atmosphere, and elegance become one unforgettable experience.',
        specs: ['70MM DUAL LASER', 'DOLBY ATMOS SOUNDSTAGE', 'BESPOKE CONCIERGE'],
      }}
    >
      {location.state?.adminRequired && (
        <div
          className="auth-alert-banner"
          role="alert"
          style={{
            marginBottom: '1.25rem',
            background: 'rgba(212, 175, 55, 0.1)',
            borderColor: 'rgba(212, 175, 55, 0.4)',
            color: '#F3E5AB',
          }}
        >
          <span className="auth-alert-icon" style={{ color: '#D4AF37' }}>✦</span>
          <span>
            {location.state?.message || 'Admin privileges required. Sign in with administrator credentials.'}
          </span>
        </div>
      )}

      <AuthForm
        onSubmit={handleSubmit}
        error={authError}
        loading={loading}
        submitText="ENTER CINEVERSE"
      >
        {/* Email Address Field */}
        <div className="auth-field-group">
          <label htmlFor="login-email" className="auth-label">
            Email Address
          </label>
          <input
            type="email"
            id="login-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="patron@cineverse.com"
            required
            autoComplete="email"
            className={`auth-input ${fieldErrors.email ? 'input-error' : ''}`}
          />
          {fieldErrors.email && (
            <span className="auth-field-error" role="alert">
              {fieldErrors.email}
            </span>
          )}
        </div>

        {/* Password Field */}
        <div className="auth-field-group">
          <div className="auth-label-row">
            <label htmlFor="login-password" className="auth-label">
              Password
            </label>
            <button
              type="button"
              className="auth-forgot-link"
              onClick={handleOpenForgotModal}
              id="forgot-password-link"
            >
              Forgot Password?
            </button>
          </div>
          <PasswordInput
            id="login-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            error={fieldErrors.password}
            autoComplete="current-password"
          />
        </div>

        {/* Remember Me Option */}
        <div className="auth-options-row">
          <label className="auth-checkbox-label" htmlFor="login-remember">
            <input
              type="checkbox"
              id="login-remember"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="auth-checkbox"
            />
            <span className="auth-checkbox-text">Remember this device</span>
          </label>
        </div>
      </AuthForm>

      {/* Switch to Registration */}
      <div className="auth-switch-prompt">
        <span>Not yet an invited member?</span>{' '}
        <Link to="/register" className="auth-link">
          Create Account
        </Link>
      </div>

      {/* Forgot Password Luxury Modal */}
      {showForgotModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="auth-modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowForgotModal(false);
            }}
          >
            <div className="auth-modal-card">
              <button
                type="button"
                className="auth-modal-close"
                onClick={() => setShowForgotModal(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>

              <div className="auth-modal-header">
                <div className="auth-modal-icon-badge">
                  <KeyRound size={20} className="auth-modal-icon" />
                </div>
                <h3 className="auth-modal-title">Reset Your Access Key</h3>
                <p className="auth-modal-subtitle">
                  Enter your registered member email address to receive secure reset credentials.
                </p>
              </div>

              {forgotStatus ? (
                <div className={`auth-modal-status ${forgotStatus.type}`}>
                  {forgotStatus.type === 'success' && (
                    <CheckCircle2 size={18} className="auth-modal-status-icon" />
                  )}
                  <span>{forgotStatus.message}</span>
                  {forgotStatus.type === 'success' && (
                    <button
                      type="button"
                      className="auth-modal-action-btn"
                      onClick={() => setShowForgotModal(false)}
                      style={{ marginTop: '1.25rem' }}
                    >
                      RETURN TO SIGN IN
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="auth-modal-form">
                  <div className="auth-field-group">
                    <label htmlFor="forgot-email" className="auth-label">
                      Member Email Address
                    </label>
                    <input
                      type="email"
                      id="forgot-email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="patron@cineverse.com"
                      required
                      className="auth-input"
                      autoFocus
                    />
                  </div>

                  <div className="auth-modal-actions">
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? 'DISPATCHING...' : 'DISPATCH INSTRUCTIONS'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </AuthLayout>
  );
}
