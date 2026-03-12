import { api } from '../lib/api.js';

const persistAuth = (data) => {
  const user = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role || 'patient',
    patientId: data.user.patientId
  };
  const token = data.accessToken;
  return { user, token };
};

export const loginUser = async (email, password) => {
  const data = await api.post('/auth/login', { email, password });
  return persistAuth(data);
};

export const loginWithPhonePin = async (phone, pin) => {
  const data = await api.post('/auth/login/phone', { phone, pin });
  return persistAuth(data);
};

export const sendLoginOtp = async (email) => {
  return await api.post('/auth/login/otp/send', { email });
};

export const loginWithOtp = async (email, otp) => {
  const data = await api.post('/auth/login/otp/verify', { email, otp });
  return persistAuth(data);
};

export const findAccountForHelp = async (firstName, lastName, dob) => {
  return await api.post('/auth/account/find', { firstName, lastName, dob });
};

export const forgotPassword = async (email) => {
  return await api.post('/auth/password/forgot', { email });
};

export const resetPassword = async (email, otp, newPassword, newPin) => {
  return await api.post('/auth/password/reset', { email, otp, newPassword, newPin });
};

export const registerUser = async (userData) => {
  const data = await api.post('/auth/register', userData);
  return persistAuth(data);
};
