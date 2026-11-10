/**
 * Authentication Form Validation Utilities
 * Pure functions returning structured validation errors.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate an email address.
 * @param {string} email
 * @returns {string|null} Error message or null if valid.
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return 'Email address is required.';
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
}

// Same rules as the backend (backend/src/utils/password.js).
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
export const PASSWORD_HINT = `At least ${PASSWORD_MIN} characters, with a letter and a number`;

/**
 * Validate a NEW password (sign-up, reset).
 * @param {string} password
 * @returns {string|null} Error message or null if valid.
 */
export function validateNewPassword(password) {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters long.`;
  }
  if (password.length > PASSWORD_MAX) {
    return `Password must be ${PASSWORD_MAX} characters or fewer.`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }
  return null;
}

/**
 * Validate full name.
 * @param {string} name
 * @returns {string|null} Error message or null if valid.
 */
export function validateFullName(name) {
  if (!name || !name.trim()) {
    return 'Full name is required.';
  }
  if (name.trim().length < 2) {
    return 'Full name must be at least 2 characters.';
  }
  return null;
}

/**
 * Validate that two passwords match.
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {string|null} Error message or null if valid.
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (!confirmPassword) {
    return 'Please confirm your password.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}

/**
 * Validate login form fields.
 * @param {{ email?: string, password?: string }} fields
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateLoginForm({ email, password }) {
  const errors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  // Signing in only needs a password; the rules apply when one is created.
  if (!password) errors.password = 'Password is required.';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate registration form fields.
 * @param {{ fullName?: string, email?: string, password?: string, confirmPassword?: string }} fields
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateRegisterForm({ fullName, email, password, confirmPassword }) {
  const errors = {};

  const nameError = validateFullName(fullName);
  if (nameError) errors.fullName = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validateNewPassword(password);
  if (passwordError) errors.password = passwordError;

  const matchError = validatePasswordMatch(password, confirmPassword);
  if (matchError) errors.confirmPassword = matchError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
