import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import appointmentReducer from './appointmentSlice';
import doctorReducer from './departmentSlice';
import billingReducer from './billingSlice';
import departmentReducer from './departmentStoreSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointments: appointmentReducer,
    doctors: doctorReducer,
    billing: billingReducer,
    departments: departmentReducer,
    users: userReducer,
  },
});

// Persist auth to localStorage on change
store.subscribe(() => {
  const state = store.getState();
  const { user, token, isAuthenticated } = state.auth;
  if (isAuthenticated && user && token) {
    localStorage.setItem('mediflow_auth', JSON.stringify({ user, token }));
  } else {
    localStorage.removeItem('mediflow_auth');
  }
});
