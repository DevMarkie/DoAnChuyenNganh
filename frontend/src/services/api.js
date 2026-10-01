import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 15-second timeout prevents hanging requests
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
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
    const method = originalRequest?.method?.toUpperCase();
    const isSafeToRetry = method === "GET" || method === "HEAD";

    // Retry reads only. Retrying a timed-out POST could duplicate a write that
    // already reached the server.
    if (
      !originalRequest._retry &&
      isSafeToRetry &&
      (error.code === "ECONNABORTED" ||
        error.response?.status === 502 ||
        error.response?.status === 503)
    ) {
      originalRequest._retry = true;
      return api(originalRequest);
    }

    // A 403 means the session is valid but lacks permission. Only 401 means
    // the token is missing or expired.
    if (error.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      // Use window.location hash to avoid leaving repo path
      window.location.hash = "#/";
    }
    return Promise.reject(error);
  },
);

export default api;
