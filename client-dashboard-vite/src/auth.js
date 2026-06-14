import { supabase } from './supabaseClient.js';

const VALID_ROLES = Object.freeze(['Admin', 'User']);

const state = {
  session: null,
  user: null,
  role: null,
  isLoading: true,
};

const listeners = new Set();

function getStateSnapshot() {
  return Object.freeze({ ...state });
}

function publish() {
  const snapshot = getStateSnapshot();
  listeners.forEach((callback) => callback(snapshot));
}

function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

async function resolveUserRole(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.warn('Auth guard: failed to resolve role, denying access.', error?.message);
    return null;
  }

  // Database stores lowercase 'admin'/'user', UI expects 'Admin'/'User'
  const formattedRole = data.role.charAt(0).toUpperCase() + data.role.slice(1);
  return isValidRole(formattedRole) ? formattedRole : null;
}

function setAuthenticated(session, role) {
  state.session = session;
  state.user = session?.user ?? null;
  state.role = role;
  state.isLoading = false;
  publish();
}

function setAnonymous() {
  state.session = null;
  state.user = null;
  state.role = null;
  state.isLoading = false;
  publish();
}

function setLoading(value) {
  state.isLoading = value;
  publish();
}

/**
 * Initialize auth state. Call once at application startup.
 * Restores session from Supabase and sets up the auth-state listener.
 */
export async function initAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const role = await resolveUserRole(session.user.id);
      setAuthenticated(session, role);
    } else {
      setAnonymous();
    }
  } catch (err) {
    console.error('Auth initialization error:', err);
    setAnonymous();
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      state.session = session;
      state.user = session?.user ?? null;
      return;
    }

    setLoading(true);

    try {
      if (event === 'SIGNED_IN' && session?.user) {
        const role = await resolveUserRole(session.user.id);
        setAuthenticated(session, role);
      } else if (event === 'SIGNED_OUT') {
        setAnonymous();
      } else {
        setAnonymous();
      }
    } catch {
      setAnonymous();
    }
  });
}

/**
 * Subscribe to auth-state changes.
 * @param {Function} callback
 * @returns {Function} Unsubscribe function.
 */
export function subscribeAuth(callback) {
  listeners.add(callback);
  callback(getStateSnapshot());
  return () => listeners.delete(callback);
}

/**
 * Acquire the current auth-state snapshot.
 * @returns {{session: object|null, user: object|null, role: string|null, isLoading: boolean}}
 */
export function getAuthState() {
  return getStateSnapshot();
}

function isSafeLocalUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Guard the current page.
 *
 * Waits until auth has resolved, then either:
 *   – resolves with the auth state (user is authenticated and authorized), or
 *   – redirects and rejects (user is unauthenticated or lacks the required role).
 *
 * Because the redirect is performed before the promise resolves, no protected UI
 * is ever rendered for unauthorized users.
 *
 * @param {Object}   options
 * @param {string}   [options.requiredRole]   – 'Admin' or 'User'
 * @param {string}   [options.loginUrl='/login.html']     – redirect target for unauthenticated users
 * @param {string}   [options.fallbackUrl='/login.html']  – redirect target for unauthorized users
 * @returns {Promise<{session: object, user: object, role: string|null}>}
 */
export function guardPage(options = {}) {
  const {
    requiredRole,
    loginUrl = '/login.html',
    fallbackUrl = '/login.html',
  } = options;

  const safeLogin = isSafeLocalUrl(loginUrl) ? loginUrl : '/login.html';
  const safeFallback = isSafeLocalUrl(fallbackUrl) ? fallbackUrl : '/login.html';

  return new Promise((resolve, reject) => {
    function attempt(snapshot) {
      if (snapshot.isLoading) return;

      if (!snapshot.session) {
        window.location.replace(safeLogin);
        reject(new Error('Unauthenticated'));
        return;
      }

      if (requiredRole && snapshot.role !== requiredRole) {
        window.location.replace(safeFallback);
        reject(new Error('Unauthorized'));
        return;
      }

      resolve(snapshot);
    }

    const current = getStateSnapshot();
    if (!current.isLoading) {
      attempt(current);
    } else {
      const unsubscribe = subscribeAuth((next) => {
        if (!next.isLoading) {
          unsubscribe();
          attempt(next);
        }
      });
    }
  });
}

/**
 * Sign out and redirect to login.
 */
export async function logout(redirectTo = '/login.html') {
  const target = isSafeLocalUrl(redirectTo) ? redirectTo : '/login.html';
  await supabase.auth.signOut();
  window.location.replace(target);
}
