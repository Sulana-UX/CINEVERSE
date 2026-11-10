/**
 * Admin Authorization Utility for CINEVERSE
 *
 * `user.isAdmin` is set by authService after checking the public.admin_users
 * table in Supabase. Email lists and user_metadata.role are NOT trusted:
 * user_metadata can be written by the user themselves at sign-up.
 *
 * This only controls what the UI shows. Real protection for admin data must
 * come from Row Level Security using public.is_admin() on each table.
 */
export function isAdminUser(user) {
  return user?.isAdmin === true;
}
