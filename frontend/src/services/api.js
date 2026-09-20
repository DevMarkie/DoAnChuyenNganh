import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15-second timeout prevents hanging requests
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 & 403 expired credentials
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry once on network errors or 502/503 (not on auth or client errors)
    if (
      !originalRequest._retry &&
      (error.code === 'ECONNABORTED' ||
        error.response?.status === 502 ||
        error.response?.status === 503)
    ) {
      originalRequest._retry = true;
      return api(originalRequest);
    }

    // Handle auth errors — clear token and redirect
    if (error.response?.status === 401 || (error.response?.status === 403 && localStorage.getItem('token'))) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use window.location only as last resort (full page reload)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
