import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import AuthForm from '../components/AuthForm';
import ForgotPasswordDialog from '../components/ForgotPasswordDialog';
import PasswordInput from '../components/PasswordInput';
import { destinationFor } from '../utils/adminAuth';
import { useAuth } from '../hooks/useAuth';
import { validateLoginForm } from '../validation/authValidation';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const [showForgot, setShowForgot] = useState(false);

  // Signed-in visitors never see this page: GuestRoute sends them on.

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
      navigate(destinationFor(result.user, location.state?.from), { replace: true });
    }
  };

  // After a password reset, sign straight in with the new password.
  const handlePasswordReset = async (email, password) => {
    const result = await login({ email, password });
    setShowForgot(false);
    if (result.success) {
      navigate(destinationFor(result.user, location.state?.from), { replace: true });
    } else {
      setFormData((prev) => ({ ...prev, email, password: '' }));
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
      {(location.state?.adminRequired || location.state?.message) && (
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
              onClick={() => setShowForgot(true)}
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
        <Link to="/register" state={location.state} replace className="auth-link">
          Create Account
        </Link>
      </div>

      {showForgot && (
        <ForgotPasswordDialog
          initialEmail={formData.email}
          onClose={() => setShowForgot(false)}
          onReset={handlePasswordReset}
        />
      )}
    </AuthLayout>
  );
}
