import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, KeyRound, X } from 'lucide-react';
import PasswordInput from './PasswordInput';
import { authService } from '../services/authService';
import { validateEmail, validateNewPassword } from '../validation/authValidation';

const RESEND_SECONDS = 30;

/**
 * Forgot password, in two steps:
 *  1. email  → the backend emails a 6-digit code
 *  2. code + new password → the backend sets the password
 * Then `onReset(email, password)` lets the login page sign the guest in.
 */
export default function ForgotPasswordDialog({ initialEmail = '', onClose, onReset }) {
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'done'
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [resendIn, setResendIn] = useState(0);
  const codeRef = useRef(null);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const sendCode = async (e) => {
    e?.preventDefault();
    const problem = validateEmail(email);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    const result = await authService.requestPasswordReset(email);
    setBusy(false);
    if (result.error) return setError(result.error);
    setNotice(result.message);
    setResendIn(RESEND_SECONDS);
    setStep('code');
    return undefined;
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from the email.');
    const weak = validateNewPassword(password);
    if (weak) return setError(weak);
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    setError(null);
    const result = await authService.confirmPasswordReset({ email, otp: code, password });
    if (result.error) {
      setBusy(false);
      return setError(result.error);
    }
    setStep('done');
    await onReset(email, password);
    setBusy(false);
    return undefined;
  };

  return createPortal(
    <div
      className="auth-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="auth-modal-card">
        <button type="button" className="auth-modal-close" onClick={onClose} disabled={busy} aria-label="Close dialog">
          <X size={18} />
        </button>

        <div className="auth-modal-header">
          <div className="auth-modal-icon-badge">
            <KeyRound size={20} className="auth-modal-icon" />
          </div>
          <h3 className="auth-modal-title" id="forgot-title">
            {step === 'email' ? 'Reset Your Password' : step === 'code' ? 'Choose a New Password' : 'Password Changed'}
          </h3>
          <p className="auth-modal-subtitle">
            {step === 'email' && 'Enter the email you signed up with. We will send you a 6-digit code.'}
            {step === 'code' && (notice || 'Check your email for the 6-digit code.')}
            {step === 'done' && 'Signing you in…'}
          </p>
        </div>

        {error && (
          <div className="auth-modal-status error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={sendCode} className="auth-modal-form" noValidate>
            <div className="auth-field-group">
              <label htmlFor="forgot-email" className="auth-label">
                Email Address
              </label>
              <input
                type="email"
                id="forgot-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patron@cineverse.com"
                autoComplete="email"
                className="auth-input"
                autoFocus
              />
            </div>
            <div className="auth-modal-actions">
              <button type="submit" className="auth-submit-btn" disabled={busy}>
                {busy ? 'SENDING…' : 'SEND RESET CODE'}
              </button>
            </div>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={resetPassword} className="auth-modal-form" noValidate>
            <div className="auth-field-group">
              <label htmlFor="forgot-code" className="auth-label">
                6-digit code
              </label>
              <input
                ref={codeRef}
                id="forgot-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                className="auth-input forgot-code-input"
              />
            </div>
            <div className="auth-field-group">
              <label htmlFor="forgot-password" className="auth-label">
                New password
              </label>
              <PasswordInput
                id="forgot-password"
                name="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ chars, a letter & a number"
                autoComplete="new-password"
              />
            </div>
            <div className="auth-field-group">
              <label htmlFor="forgot-confirm" className="auth-label">
                Confirm new password
              </label>
              <PasswordInput
                id="forgot-confirm"
                name="confirm-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Type it again"
                autoComplete="new-password"
              />
            </div>
            <div className="auth-modal-actions">
              <button type="submit" className="auth-submit-btn" disabled={busy}>
                {busy ? 'SAVING…' : 'SET NEW PASSWORD'}
              </button>
            </div>
            <p className="forgot-resend">
              Didn’t get it? Check spam, or{' '}
              <button type="button" className="auth-forgot-link" onClick={sendCode} disabled={busy || resendIn > 0}>
                {resendIn > 0 ? `send again in ${resendIn}s` : 'send a new code'}
              </button>
              {' · '}
              <button
                type="button"
                className="auth-forgot-link"
                onClick={() => {
                  setStep('email');
                  setError(null);
                  setCode('');
                }}
                disabled={busy}
              >
                change email
              </button>
            </p>
          </form>
        )}

        {step === 'done' && (
          <div className="auth-modal-status success">
            <CheckCircle2 size={18} className="auth-modal-status-icon" />
            <span>Your password has been changed.</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
