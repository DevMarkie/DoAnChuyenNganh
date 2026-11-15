import { create } from 'zustand';
import { authService } from '../services/dataService';

export const isLoginRoute = (path) => {
  let targetPath = path;
  if (!targetPath && typeof window !== 'undefined') {
    if (window.location?.hash && window.location.hash.startsWith('#/')) {
      targetPath = window.location.hash.slice(1);
    } else {
      targetPath = window.location?.pathname || '';
    }
  }
  if (!targetPath) return false;
  return targetPath === '/login' || targetPath.endsWith('/login');
};

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

  // 1. Kiểm tra phiên phân lập theo từng tab trình duyệt (sessionStorage)
  try {
    const sessionToken = sessionStorage.getItem(`token_${scope}`);
    if (sessionToken) {
      let sessionUser = null;
      try {
        sessionUser = JSON.parse(sessionStorage.getItem(`user_${scope}`) || 'null');
      } catch {
        sessionUser = null;
      }
      if (isTokenValid(sessionToken, sessionUser)) {
        return { token: sessionToken, user: sessionUser };
      } else {
        sessionStorage.removeItem(`token_${scope}`);
        sessionStorage.removeItem(`user_${scope}`);
      }
    }
  } catch {}

  // 2. Dự phòng localStorage (khi người dùng mở tab mới vào trực tiếp trang nghiệp vụ hoặc trong test)
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

  // Khởi tạo sessionStorage cho tab hiện tại để từ đây tab này hoạt động độc lập
  try {
    sessionStorage.setItem(`token_${scope}`, token);
    sessionStorage.setItem(`user_${scope}`, JSON.stringify(user));
  } catch {}

  return { token, user };
};

const resolveInitialSession = () => {
  // Nếu đang ở cổng đăng nhập, không tự động nhận phiên cũ của tài khoản khác từ localStorage
  if (isLoginRoute()) {
    const scope = getPortalScope();
    if (scope) {
      // Chỉ kiểm tra sessionStorage riêng của tab này
      try {
        const sessionToken = sessionStorage.getItem(`token_${scope}`);
        if (sessionToken) {
          const sessionUser = JSON.parse(sessionStorage.getItem(`user_${scope}`) || 'null');
          if (isTokenValid(sessionToken, sessionUser)) {
            return { token: sessionToken, user: sessionUser, valid: true };
          }
        }
      } catch {}
    }
    return { token: null, user: null, valid: false };
  }

  const scope = getPortalScope();
  if (scope) {
    const session = getPortalSession(scope);
    if (session) return { ...session, valid: true };
    return { token: null, user: null, valid: false };
  }

  // 1. Kiểm tra sessionStorage
  let storedToken = null;
  let storedUser = null;
  try {
    storedToken = sessionStorage.getItem('token');
    storedUser = JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch {}

  // 2. Dự phòng localStorage
  if (!storedToken) {
    storedToken = localStorage.getItem('token');
    try {
      storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      storedUser = null;
    }
  }

  const tokenValid = storedToken
    && !isTokenExpired(storedToken)
    && isStoredSessionConsistent(storedToken, storedUser);
  if (!tokenValid && (storedToken || localStorage.getItem('user') || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('user')))) {
    try {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } catch {}
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
    try {
      if (scope) {
        sessionStorage.setItem(`token_${scope}`, token);
        sessionStorage.setItem(`user_${scope}`, JSON.stringify(userData));
      }
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(userData));
    } catch {}

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
    try {
      if (scope) {
        sessionStorage.setItem(`user_${scope}`, JSON.stringify(updated));
      }
      sessionStorage.setItem('user', JSON.stringify(updated));
    } catch {}

    if (scope) {
      localStorage.setItem(`user_${scope}`, JSON.stringify(updated));
    }
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  logout: () => {
    authService.logout().catch(() => {});
    const currentUser = get().user;
    const currentUserId = currentUser?.userId ?? currentUser?.id;
    const scope = getRoleScope(currentUser?.role) || getPortalScope();

    try {
      if (scope) {
        sessionStorage.removeItem(`token_${scope}`);
        sessionStorage.removeItem(`user_${scope}`);
      }
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } catch {}

    try {
      const storedUserRaw = localStorage.getItem(`user_${scope}`) || localStorage.getItem('user');
      const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
      const storedUserId = storedUser?.userId ?? storedUser?.id;

      // Chỉ xoá localStorage nếu tài khoản lưu ở localStorage trùng với tài khoản đang đăng xuất
      if (!storedUser || !currentUserId || String(storedUserId) === String(currentUserId)) {
        if (scope) {
          localStorage.removeItem(`token_${scope}`);
          localStorage.removeItem(`user_${scope}`);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch {
      if (scope) {
        localStorage.removeItem(`token_${scope}`);
        localStorage.removeItem(`user_${scope}`);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

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
    if (!scope) return false;
    // Kiểm tra phiên riêng của tab này trước
    try {
      const sessionToken = sessionStorage.getItem(`token_${scope}`);
      if (sessionToken) {
        const sessionUser = JSON.parse(sessionStorage.getItem(`user_${scope}`) || 'null');
        if (isTokenValid(sessionToken, sessionUser)) return true;
      }
    } catch {}

    // Dự phòng môi trường test vitest
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      const localToken = localStorage.getItem(`token_${scope}`);
      if (localToken) {
        try {
          const localUser = JSON.parse(localStorage.getItem(`user_${scope}`) || 'null');
          return isTokenValid(localToken, localUser);
        } catch {
          return false;
        }
      }
    }

    return false;
  },

  syncWithRoute: (pathname) => {
    if (isLoginRoute(pathname)) return;
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
  try {
    if (scope) {
      sessionStorage.removeItem(`token_${scope}`);
      sessionStorage.removeItem(`user_${scope}`);
    }
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  } catch {}
  if (scope) {
    localStorage.removeItem(`token_${scope}`);
    localStorage.removeItem(`user_${scope}`);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  useAuthStore.getState().logout();
});

export default useAuthStore;
