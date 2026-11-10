import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, KeyRound, ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import AuthForm from '../components/AuthForm';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../hooks/useAuth';
import { validateRegisterForm } from '../validation/authValidation';
import { emailService } from '../../../services/emailService';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loading: authLoading, error: authError, clearError, isAuthenticated } = useAuth();

  // Registration step: 'form' | 'otp'
  const [step, setStep] = useState('form');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || location.state?.from || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Resend countdown timer
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

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

  // Step 1: Submit Form & Dispatch OTP Email
  const handleProceedToOtp = async (e) => {
    e.preventDefault();

    const { isValid, errors } = validateRegisterForm(formData);
    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setOtpLoading(true);
    setOtpError(null);

    try {
      const result = await emailService.sendOtp({
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
      });

      setOtpLoading(false);

      if (!result.success) {
        setOtpError(result.error || 'Unable to deliver verification code. Please verify your email or check your connection.');
        return;
      }

      setStep('otp');
      setResendTimer(60);

      // Auto-focus first digit box
      setTimeout(() => {
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 150);
    } catch (err) {
      setOtpLoading(false);
      setOtpError('Unable to dispatch verification email. Please check your email address.');
    }
  };

  // Step 2: Handle OTP input changes
  const handleOtpDigitChange = (index, value) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;

    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // Pasted full 6-digit code
      const pasted = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      if (otpInputsRef.current[nextIdx]) {
        otpInputsRef.current[nextIdx].focus();
      }
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);
    setOtpError(null);

    // Auto-advance to next box if digit entered
    if (cleaned && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Go back on backspace if current is empty
      if (otpInputsRef.current[index - 1]) {
        otpInputsRef.current[index - 1].focus();
      }
    }
  };

  // Step 2: Verify OTP and Complete Registration
  const handleVerifyAndRegister = async (e) => {
    if (e) e.preventDefault();

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setOtpError('Please enter all 6 digits of your verification code.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    // The backend verifies the code and creates a verified account in one step.
    const result = await register({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      otp: fullCode,
    });

    setOtpLoading(false);

    if (result.success) {
      const from = location.state?.from?.pathname || location.state?.from || '/';
      navigate(from, { replace: true });
    } else {
      setOtpError(result.error || 'Failed to complete registration. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setOtpLoading(true);
    setOtpError(null);

    const result = await emailService.sendOtp({
      email: formData.email.trim(),
      fullName: formData.fullName.trim(),
    });

    setOtpLoading(false);
    if (!result.success) {
      setOtpError(result.error || 'Failed to resend verification key.');
      return;
    }
    setResendTimer(60);
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
      {step === 'form' ? (
        /* STEP 1: Registration Credentials Form */
        <>
          <AuthForm
            onSubmit={handleProceedToOtp}
            error={authError}
            loading={otpLoading}
            submitText="PROCEED TO EMAIL VERIFICATION"
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
        </>
      ) : (
        /* STEP 2: 6-Digit Email OTP Verification Screen */
        <div className="auth-otp-wrapper">
          <div className="auth-otp-header">
            <div className="auth-otp-icon-wrap">
              <KeyRound size={24} />
            </div>
            <h2 className="auth-otp-title">Verify Your Access Key</h2>
            <p className="auth-otp-instruction">
              We have dispatched a private 6-digit sanctuary key to{' '}
              <span className="auth-otp-email-highlight">{formData.email}</span>.
              Enter the code below to activate your account.
            </p>
          </div>

          {/* Error Message */}
          {otpError && (
            <div className="auth-alert-banner" role="alert">
              <span>{otpError}</span>
            </div>
          )}

          {/* 6-Digit PIN Inputs */}
          <form onSubmit={handleVerifyAndRegister}>
            <div className="auth-otp-boxes-row">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  type="text"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className={`auth-otp-digit-input ${digit ? 'has-value' : ''}`}
                  autoFocus={idx === 0}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={otpLoading || otpDigits.join('').length !== 6}
              className="auth-submit-btn"
              style={{ marginTop: '1.25rem' }}
            >
              {otpLoading ? 'VERIFYING...' : 'VERIFY & COMPLETE REGISTRATION'}
            </button>
          </form>

          {/* Footer Actions: Resend & Change Email */}
          <div className="auth-otp-footer-actions">
            <button
              type="button"
              disabled={resendTimer > 0 || otpLoading}
              onClick={handleResendOtp}
              className="auth-otp-resend-btn"
            >
              <RefreshCw size={13} className={otpLoading ? 'spin-loader' : ''} />
              <span>
                {resendTimer > 0
                  ? `Resend Key in (${resendTimer}s)`
                  : 'Resend Verification Key'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setOtpDigits(['', '', '', '', '', '']);
                setOtpError(null);
              }}
              className="auth-otp-change-link"
            >
              Change Email Address
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
