/**
 * Minimal JSON client for the CINEVERSE backend.
 * In development the Vite dev server proxies /api to the backend (see vite.config.js),
 * so VITE_API_URL can stay empty. In production set it to the deployed API origin.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function authHeader() {
  if (!isSupabaseConfigured) return {};
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request(method, path, { body, auth = false } = {}) {
  const headers = { ...(auth ? await authHeader() : {}) };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response (e.g. backend not running behind the proxy)
  }

  if (!response.ok) {
    const message =
      data?.error ||
      (response.status === 502 || response.status === 504
        ? 'Cannot reach the CINEVERSE server. Is the backend running?'
        : `Server returned ${response.status}`);
    const error = new Error(message);
    error.status = response.status;
    error.code = data?.code;
    error.data = data;
    throw error;
  }

  return data;
}

export const apiGet = (path, options) => request('GET', path, options);
export const apiPost = (path, body, options = {}) => request('POST', path, { ...options, body: body ?? {} });
