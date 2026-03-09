import { api } from '../lib/api.js';

export const loginUser = async (email, password) => {
  const data = await api.post('/auth/login', { email, password });
  const user = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
  };
  const token = data.accessToken;
  return { user, token };
};

export const registerUser = async (userData) => {
  const data = await api.post('/auth/register', {
    name: userData.name,
    email: userData.email,
    password: userData.password,
  });
  const user = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role || 'patient',
  };
  const token = data.accessToken;
  return { user, token };
};
