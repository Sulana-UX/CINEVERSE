import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Luxury Password Input with Show/Hide Toggle
 */
export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = '••••••••',
  required = true,
  disabled = false,
  error,
  autoComplete = 'current-password',
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-input-wrapper">
      <div className="password-input-container">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`auth-input ${error ? 'input-error' : ''}`}
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff size={17} className="password-eye-icon" />
          ) : (
            <Eye size={17} className="password-eye-icon" />
          )}
        </button>
      </div>
      {error && (
        <span className="auth-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
