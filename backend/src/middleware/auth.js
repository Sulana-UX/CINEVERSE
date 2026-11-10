import { supabaseAdmin } from '../lib/supabaseAdmin.js';

/**
 * Require a valid Supabase access token (Authorization: Bearer <jwt>).
 * Sets req.user to the verified Supabase user.
 */
export async function requireUser(req, res, next) {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Server database access is not configured.' });
  }

  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }

  req.user = data.user;
  return next();
}

export async function isAdmin(userId) {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !error && Boolean(data);
}

/** Use after requireUser. */
export async function requireAdmin(req, res, next) {
  if (!(await isAdmin(req.user.id))) {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  return next();
}
