import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
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
