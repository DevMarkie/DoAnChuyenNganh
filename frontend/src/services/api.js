const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const fetchApi = async (method, url, config = {}) => {
  const token = localStorage.getItem("token");
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
    fullUrl += `?${params.toString()}`;
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
    const id = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(fullUrl, { ...options, signal: controller.signal });
      clearTimeout(id);
      
      if (!response.ok) {
        if (response.status === 401 && localStorage.getItem("token")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new CustomEvent("auth:session-expired"));
          window.location.hash = "#/";
        }
        const err = new Error(response.statusText || 'Error');
        err.response = response;
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
