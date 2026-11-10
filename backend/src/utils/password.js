/**
 * Rules for a NEW password (sign-up, reset). Signing in only checks the password
 * is not empty, so older accounts keep working.
 * 72 is the most bcrypt (used by Supabase Auth) actually reads.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

/** @returns {string|null} what is wrong, or null when the password is acceptable */
export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  }
  if (password.length > PASSWORD_MAX) return `Password must be ${PASSWORD_MAX} characters or fewer.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }
  return null;
}
