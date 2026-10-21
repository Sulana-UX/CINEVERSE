/**
 * Admin Authorization Utility for CINEVERSE
 * Determines if an authenticated user possesses administrator privileges
 */

export function isAdminUser(user) {
  if (!user) return false;

  const userEmail = (user.email || '').toLowerCase().trim();

  // 1. Check explicit role in Supabase metadata
  const metadataRole = user.user_metadata?.role || user.app_metadata?.role;
  if (metadataRole === 'admin' || metadataRole === 'administrator') {
    return true;
  }

  // 2. Check configured admin emails from .env
  const envAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (envAdminEmails.includes(userEmail)) {
    return true;
  }

  // 3. Fallback defaults: admin@cineverse.com or any email beginning with admin@
  if (
    userEmail === 'admin@cineverse.com' ||
    userEmail.startsWith('admin@') ||
    userEmail.includes('+admin@')
  ) {
    return true;
  }

  return false;
}
