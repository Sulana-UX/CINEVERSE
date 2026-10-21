import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import AuthForm from '../components/AuthForm';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../hooks/useAuth';
import { validateRegisterForm } from '../validation/authValidation';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loading, error: authError, clearError, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || location.state?.from || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors } = validateRegisterForm(formData);

    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const result = await register({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      const from = location.state?.from?.pathname || location.state?.from || '/';
      navigate(from, { replace: true });
    }
  };

  return (
    <AuthLayout
      eyebrow="MEMBERSHIP INVITATION"
      title="Become Part of the Experience."
      subtitle="Create your account and begin your journey beyond the screen."
      visualProps={{
        imageSrc: '/images/luxury_cinema_details.jpg',
        imageAlt: 'Crimson Velvet Seating with Brushed Champagne Gold Architectural Trims',
        badgeText: 'CONCIERGE TIER • PRIVATE LOGE SUITE',
        eyebrow: 'PRIVATE SANCTUARY',
        heading: 'Crafted for the True Connoisseur.',
        supportingText:
          'Where timeless architecture meets the supreme standard of cinema.',
        specs: ['CRIMSON VELVET LOGE', 'PRIVATE CONCIERGE', 'CURATED SCREENINGS'],
      }}
    >
      <AuthForm
        onSubmit={handleSubmit}
        error={authError}
        loading={loading}
        submitText="CREATE YOUR ACCOUNT"
      >
        {/* Full Name Field */}
        <div className="auth-field-group">
          <label htmlFor="register-name" className="auth-label">
            Full Name
          </label>
          <input
            type="text"
            id="register-name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Julian Vance"
            required
            autoComplete="name"
            className={`auth-input ${fieldErrors.fullName ? 'input-error' : ''}`}
          />
          {fieldErrors.fullName && (
            <span className="auth-field-error" role="alert">
              {fieldErrors.fullName}
            </span>
          )}
        </div>

        {/* Email Address Field */}
        <div className="auth-field-group">
          <label htmlFor="register-email" className="auth-label">
            Email Address
          </label>
          <input
            type="email"
            id="register-email"
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
          <label htmlFor="register-password" className="auth-label">
            Password
          </label>
          <PasswordInput
            id="register-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            required
            error={fieldErrors.password}
            autoComplete="new-password"
          />
        </div>

        {/* Confirm Password Field */}
        <div className="auth-field-group">
          <label htmlFor="register-confirm-password" className="auth-label">
            Confirm Password
          </label>
          <PasswordInput
            id="register-confirm-password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            required
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
          />
        </div>
      </AuthForm>

      {/* Switch to Login */}
      <div className="auth-switch-prompt">
        <span>Already have an active membership?</span>{' '}
        <Link to="/login" className="auth-link">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
