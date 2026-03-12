import axios from 'axios';

const normalizeApiBase = (rawBase) => {
  const fallback = 'http://localhost:3500/api';

  if (!rawBase) {
    return fallback;
  }

  const trimmedBase = rawBase.replace(/\/+$/, '');

  if (trimmedBase.endsWith('/api')) {
    return trimmedBase;
  }

  return `${trimmedBase}/api`;
};

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('mediflow_auth');
  if (auth) {
    try {
      const { token } = JSON.parse(auth);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (_) {}
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    // If backend wrapped it in { success: true, data: [...] }
    if (res.data && res.data.data !== undefined && res.data.success !== undefined) {
      return res.data.data;
    }
    // Otherwise return raw data array/object natively
    return res.data !== undefined ? res.data : res;
  },
  (err) => {
    if (err.response?.status === 401) {
      const auth = localStorage.getItem('mediflow_auth');
      let sessionType = null;
      try {
        sessionType = auth ? JSON.parse(auth).sessionType : null;
      } catch (_) {}

      localStorage.removeItem('mediflow_auth');
      const isEmployeePath = window.location.pathname.startsWith('/employee');
      const nextLocation = isEmployeePath || sessionType === 'employee'
        ? '/employee/login'
        : '/patient/login';

      if (window.location.pathname !== nextLocation) {
        window.location.href = nextLocation;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
