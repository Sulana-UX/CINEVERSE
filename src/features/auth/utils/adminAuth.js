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

  // 2. Check explicitly authorized admin emails from .env or official admin accounts
  const envAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const officialAdminEmails = [
    'auraluxurydining@gmail.com',
    'admin@cineverse.com',
    ...envAdminEmails,
  ];

  if (officialAdminEmails.includes(userEmail)) {
    return true;
  }

  return false;
}
