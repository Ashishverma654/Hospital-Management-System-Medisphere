import { api } from '../lib/api.js';
import { getSessionTypeForRole, normalizeRole } from '../auth/constants.js';

const requestState = new Map();
const MIN_INTERVAL_MS = 2000;

const rateLimitedPost = async (url, body) => {
  const key = `POST ${url}`;
  const now = Date.now();
  const state = requestState.get(key) || { lastAt: 0, inFlight: null };

  if (state.inFlight) {
    return state.inFlight;
  }

  if (now - state.lastAt < MIN_INTERVAL_MS) {
    const err = new Error('Too many requests. Please wait.');
    err.response = { status: 429, data: { message: 'Too many requests. Please wait.' } };
    throw err;
  }

  const request = api.post(url, body)
    .finally(() => {
      requestState.set(key, { lastAt: Date.now(), inFlight: null });
    });

  requestState.set(key, { lastAt: state.lastAt, inFlight: request });
  return request;
};

const persistAuth = (data, sessionType = getSessionTypeForRole(data.user.role)) => {
  const normalizedRole = normalizeRole(data.user.role || 'patient');
  const user = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: normalizedRole || 'patient',
    patientId: data.user.patientId,
    employeeId: data.user.employeeId,
    profileImage: data.user.profileImage,
    isActive: data.user.isActive,
    onboardingStatus: data.user.onboardingStatus,
    mustResetPassword: data.user.mustResetPassword,
  };
  const token = data.accessToken;
  return { user, token, sessionType: sessionType || getSessionTypeForRole(normalizedRole) };
};

export const loginPatient = async (email, password) => {
  const data = await rateLimitedPost('/auth/patient/login', { email, password });
  return persistAuth(data, 'patient');
};

export const loginEmployee = async (identifier, password, role) => {
  const data = await rateLimitedPost('/auth/employee/login', { identifier, password, role });
  return persistAuth(data, 'employee');
};

export const loginUser = loginPatient;

export const loginWithPhonePin = async (phone, pin) => {
  const data = await rateLimitedPost('/auth/login/phone', { phone, pin });
  return persistAuth(data, 'patient');
};

export const sendLoginOtp = async (email) => {
  return await rateLimitedPost('/auth/login/otp/send', { email });
};

export const loginWithOtp = async (email, otp) => {
  const data = await rateLimitedPost('/auth/login/otp/verify', { email, otp });
  return persistAuth(data, 'patient');
};

export const findAccountForHelp = async (firstName, lastName, dob) => {
  return await rateLimitedPost('/auth/account/find', { firstName, lastName, dob });
};

export const forgotPassword = async (email) => {
  return await rateLimitedPost('/auth/password/forgot', { email });
};

export const resetPassword = async (email, otp, newPassword, newPin) => {
  return await rateLimitedPost('/auth/password/reset', { email, otp, newPassword, newPin });
};

export const registerPatient = async (userData) => {
  const data = await rateLimitedPost('/auth/patient/register', userData);
  return persistAuth(data, 'patient');
};

export const registerUser = registerPatient;
