import { io } from 'socket.io-client';

const normalizeSocketBase = (rawBase) => {
  if (!rawBase) return 'http://localhost:3500';
  let base = rawBase.replace(/\/+$/, '');
  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }
  if (!base) return 'http://localhost:3500';
  return base;
};

const SOCKET_URL = normalizeSocketBase(import.meta.env.VITE_API_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

const getAuthToken = () => {
  try {
    const stored = localStorage.getItem('mediflow_auth');
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed?.token || null;
  } catch {
    return null;
  }
};

export const connectSocket = (payload = {}) => {
  socket.auth = { token: getAuthToken() };
  if (!socket.connected) {
    socket.connect();
  }
  socket.emit('join', payload);
  return socket;
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
