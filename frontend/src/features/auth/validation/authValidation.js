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

/**
 * Validate a password.
 * @param {string} password
 * @param {number} [minLength=6]
 * @returns {string|null} Error message or null if valid.
 */
export function validatePassword(password, minLength = 6) {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long.`;
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

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

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

  const passwordError = validatePassword(password, 8);
  if (passwordError) errors.password = passwordError;

  const matchError = validatePasswordMatch(password, confirmPassword);
  if (matchError) errors.confirmPassword = matchError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
