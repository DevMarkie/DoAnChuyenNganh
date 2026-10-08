import { create } from 'zustand';
import { authService } from '../services/dataService';

const decodeJwt = (token) => JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

/**
 * Check if a JWT token is expired (with 60s buffer to avoid edge-case failures)
 */
const isTokenExpired = (token) => {
  try {
    const decoded = decodeJwt(token);
    if (!decoded.exp) return false;
    // 60-second buffer: treat token as expired slightly before actual expiry
    return decoded.exp * 1000 < Date.now() - 60_000;
  } catch {
    return true;
  }
};

// On load, verify the stored token is still valid
const storedToken = localStorage.getItem('token');
const tokenValid = storedToken && !isTokenExpired(storedToken);
if (!tokenValid && storedToken) {
  // Token expired — clean up stale data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

const useAuthStore = create((set, get) => ({
  user: tokenValid ? JSON.parse(localStorage.getItem('user') || 'null') : null,
  token: tokenValid ? storedToken : null,
  isAuthenticated: tokenValid,

  login: (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData, token, isAuthenticated: true });
  },

  // BR-SEC-01: sau khi đổi mật khẩu tạm thành công, gỡ cờ bắt buộc đổi để mở
  // khoá điều hướng (modal buộc đổi mật khẩu trong Layout sẽ tự ẩn).
  clearMustChangePassword: () => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, mustChangePassword: false };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  logout: () => {
    // Notify the server (stateless JWT — best-effort, never blocks local sign-out).
    authService.logout().catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  /**
   * Check if the current token is still valid.
   * Returns false and auto-logouts if expired.
   */
  checkAuth: () => {
    const { token, logout } = get();
    if (!token || isTokenExpired(token)) {
      logout();
      return false;
    }
    return true;
  },
}));

// When api.js detects a 401 it fires this event; triggering logout clears the
// auth state so ProtectedRoute auto-redirects to the login page.
window.addEventListener("auth:session-expired", () => {
  useAuthStore.getState().logout();
});

export default useAuthStore;
