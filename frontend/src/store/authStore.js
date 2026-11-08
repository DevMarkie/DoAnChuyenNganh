import { create } from 'zustand';
import { authService } from '../services/dataService';

export const getPortalScope = (path) => {
  let targetPath = path;
  if (!targetPath && typeof window !== 'undefined') {
    if (window.location?.hash && window.location.hash.startsWith('#/')) {
      targetPath = window.location.hash.slice(1);
    } else {
      targetPath = window.location?.pathname || '';
    }
  }
  if (!targetPath) return '';
  if (targetPath.startsWith('/student')) return 'student';
  if (targetPath.startsWith('/lecturer')) return 'lecturer';
  if (targetPath.startsWith('/academic')) return 'academic';
  if (targetPath.startsWith('/exam')) return 'exam';
  if (targetPath.startsWith('/admin')) return 'admin';
  return '';
};

export const getRoleScope = (role) => {
  if (role === 'STUDENT') return 'student';
  if (role === 'LECTURER') return 'lecturer';
  if (role === 'ACADEMIC_AFFAIRS' || role === 'ACADEMIC_STAFF') return 'academic';
  if (role === 'EXAMINATION_OFFICER') return 'exam';
  if (role === 'ADMIN') return 'admin';
  return '';
};

const decodeJwt = (token) => {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
};

/**
 * Check if a JWT token is expired (with 60s buffer to avoid edge-case failures)
 */
const isTokenExpired = (token) => {
  try {
    const decoded = decodeJwt(token);
    if (!decoded.exp) return false;
    return (decoded.exp * 1000) < (Date.now() + 60_000);
  } catch {
    return true;
  }
};

/**
 * Local storage is only a UI cache. The JWT is the credential used for API
 * requests, therefore both values must represent the same account.
 */
const isStoredSessionConsistent = (token, storedUser) => {
  try {
    const claims = decodeJwt(token);
    if (!storedUser || !claims?.sub || claims.userId == null) return false;

    const storedUserId = storedUser.userId ?? storedUser.id;
    return String(storedUserId) === String(claims.userId)
      && storedUser.username === claims.sub;
  } catch {
    return false;
  }
};

export const isTokenValid = (token, user) => {
  return Boolean(token && !isTokenExpired(token) && isStoredSessionConsistent(token, user));
};

export const getPortalSession = (scope) => {
  if (!scope) return null;
  const token = localStorage.getItem(`token_${scope}`);
  if (!token) return null;
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem(`user_${scope}`) || 'null');
  } catch {
    user = null;
  }
  if (!isTokenValid(token, user)) {
    localStorage.removeItem(`token_${scope}`);
    localStorage.removeItem(`user_${scope}`);
    return null;
  }
  return { token, user };
};

const resolveInitialSession = () => {
  const scope = getPortalScope();
  if (scope) {
    const session = getPortalSession(scope);
    if (session) return { ...session, valid: true };
    return { token: null, user: null, valid: false };
  }

  const storedToken = localStorage.getItem('token');
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();
  const tokenValid = storedToken
    && !isTokenExpired(storedToken)
    && isStoredSessionConsistent(storedToken, storedUser);
  if (!tokenValid && (storedToken || localStorage.getItem('user'))) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  return { token: tokenValid ? storedToken : null, user: tokenValid ? storedUser : null, valid: Boolean(tokenValid) };
};

const initialSession = resolveInitialSession();

const useAuthStore = create((set, get) => ({
  user: initialSession.user,
  token: initialSession.token,
  isAuthenticated: initialSession.valid,

  login: (token, userData) => {
    const scope = getRoleScope(userData?.role) || getPortalScope();
    if (scope) {
      localStorage.setItem(`token_${scope}`, token);
      localStorage.setItem(`user_${scope}`, JSON.stringify(userData));
    }
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData, token, isAuthenticated: true });
  },

  clearMustChangePassword: () => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, mustChangePassword: false };
    const scope = getRoleScope(user?.role) || getPortalScope();
    if (scope) {
      localStorage.setItem(`user_${scope}`, JSON.stringify(updated));
    }
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  logout: () => {
    authService.logout().catch(() => {});
    const scope = getRoleScope(get().user?.role) || getPortalScope();
    if (scope) {
      localStorage.removeItem(`token_${scope}`);
      localStorage.removeItem(`user_${scope}`);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const { token, logout } = get();
    if (!token || isTokenExpired(token)) {
      logout();
      return false;
    }
    return true;
  },

  hasPortalSession: (scope) => {
    return Boolean(getPortalSession(scope));
  },

  syncWithRoute: (pathname) => {
    const scope = getPortalScope(pathname);
    if (!scope) return;
    const session = getPortalSession(scope);
    const current = get();
    if (session) {
      if (current.token !== session.token || current.user?.username !== session.user?.username) {
        set({ user: session.user, token: session.token, isAuthenticated: true });
      }
    } else {
      if (current.isAuthenticated) {
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },
}));

window.addEventListener("auth:session-expired", (e) => {
  const scope = e?.detail?.scope;
  if (scope) {
    localStorage.removeItem(`token_${scope}`);
    localStorage.removeItem(`user_${scope}`);
  }
  useAuthStore.getState().logout();
});

export default useAuthStore;
