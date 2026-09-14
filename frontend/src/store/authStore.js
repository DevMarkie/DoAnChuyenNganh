import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

/**
 * Check if a JWT token is expired (with 60s buffer to avoid edge-case failures)
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
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

  logout: () => {
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

  getRole: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.role;
    } catch {
      return null;
    }
  },

  getUserId: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.userId;
    } catch {
      return null;
    }
  },
}));

export default useAuthStore;
