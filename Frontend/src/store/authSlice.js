import { createSlice } from '@reduxjs/toolkit';
import { getSessionTypeForRole } from '../auth/constants.js';

const loadAuthFromStorage = () => {
  try {
    const stored = localStorage.getItem('mediflow_auth');
    if (stored) {
      const { user, token, sessionType } = JSON.parse(stored);
      if (user && token) {
        return {
          user,
          token,
          sessionType: sessionType || getSessionTypeForRole(user.role),
          isAuthenticated: true,
        };
      }
    }
  } catch { /* ignore */ }
  return { user: null, token: null, sessionType: null, isAuthenticated: false };
};

const initialState = loadAuthFromStorage();

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.sessionType = action.payload.sessionType || getSessionTypeForRole(action.payload.user?.role);
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.sessionType = null;
      state.isAuthenticated = false;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        state.sessionType = getSessionTypeForRole(state.user.role);
        // Sync back to local storage manually to persist photo across reloads
        localStorage.setItem('mediflow_auth', JSON.stringify({
          user: state.user,
          token: state.token,
          sessionType: state.sessionType,
        }));
      }
    },
  },
});

export const { loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
