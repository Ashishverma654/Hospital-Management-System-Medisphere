import axios from 'axios';

const LOCAL_API_FALLBACK = 'http://localhost:3500/api';

const normalizeApiBase = (rawBase) => {
  const fallback = import.meta.env.DEV ? '/api' : LOCAL_API_FALLBACK;

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
const isLocalBrowser = () =>
  typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
const isRelativeApiBase = (base = '') => typeof base === 'string' && base.startsWith('/');

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('mediflow_auth');
  if (auth) {
    try {
      const { token } = JSON.parse(auth);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      /* ignore malformed local auth */
    }
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
    const shouldRetryAgainstLocalBackend =
      err.code === 'ERR_NETWORK' &&
      err.config &&
      !err.config.__localRetry &&
      isLocalBrowser() &&
      isRelativeApiBase(err.config.baseURL || API_BASE);

    if (shouldRetryAgainstLocalBackend) {
      return api.request({
        ...err.config,
        __localRetry: true,
        baseURL: LOCAL_API_FALLBACK,
      });
    }

    if (err.response?.status === 401) {
      const auth = localStorage.getItem('mediflow_auth');
      let sessionType = null;
      try {
        sessionType = auth ? JSON.parse(auth).sessionType : null;
      } catch {
        /* ignore malformed local auth */
      }

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
