const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const getPortalScope = () => {
  let targetPath = '';
  if (typeof window !== 'undefined') {
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

const getEffectiveToken = () => {
  const scope = getPortalScope();
  if (scope) {
    const scoped = localStorage.getItem(`token_${scope}`);
    if (scoped) return scoped;
  }
  return localStorage.getItem('token');
};

const fetchApi = async (method, url, config = {}) => {
  const token = getEffectiveToken();
  const headers = { "Content-Type": "application/json", ...config.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  let fullUrl = API_BASE_URL + url;
  if (config.params) {
    const params = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    const q = params.toString();
    if (q) fullUrl += `?${q}`;
  }

  const options = { method, headers, ...config };
  
  if (config.data) {
    if (config.data instanceof FormData) {
      options.body = config.data;
      delete headers['Content-Type']; // Let browser set boundary
    } else {
      options.body = JSON.stringify(config.data);
    }
  }

  const doFetch = async () => {
    const controller = new AbortController();
    const timeoutMs = config.timeout || 15000;
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(fullUrl, { ...options, signal: controller.signal });
      clearTimeout(id);
      
      if (!response.ok) {
        let errData = null;
        try { const t = await response.text(); errData = t ? JSON.parse(t) : null; } catch { errData = null; }
        const errMsg = errData?.message || '';

        const isAuthExpired = response.status === 401 ||
          (response.status === 403 && (errMsg.includes('hết hạn') || errMsg.includes('expired') || errMsg.includes('Access Denied') || errMsg === 'Forbidden'));

        if (isAuthExpired && (token || localStorage.getItem("token"))) {
          const scope = getPortalScope();
          if (scope) {
            localStorage.removeItem(`token_${scope}`);
            localStorage.removeItem(`user_${scope}`);
          }
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new CustomEvent("auth:session-expired", { detail: { scope } }));
        }

        const err = new Error(errMsg || response.statusText || 'Error');
        err.response = { status: response.status, statusText: response.statusText, data: errData };
        throw err;
      }
      
      let data;
      if (config.responseType === 'blob') {
        data = await response.blob();
      } else {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      }
      return { data, status: response.status, headers: response.headers };
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        error.code = 'ECONNABORTED';
      }
      throw error;
    }
  };

  try {
    return await doFetch();
  } catch (error) {
    const isSafeToRetry = method === "GET" || method === "HEAD";
    if (!config._retry && isSafeToRetry && 
        (error.code === 'ECONNABORTED' || error.response?.status === 502 || error.response?.status === 503)) {
      config._retry = true;
      return await doFetch();
    }
    throw error;
  }
};

const api = {
  get: (url, config) => fetchApi('GET', url, config),
  post: (url, data, config) => fetchApi('POST', url, { ...config, data }),
  put: (url, data, config) => fetchApi('PUT', url, { ...config, data }),
  delete: (url, config) => fetchApi('DELETE', url, config),
};

export default api;
