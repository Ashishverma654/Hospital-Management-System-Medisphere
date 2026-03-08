import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3500/api';

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
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mediflow_auth');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
