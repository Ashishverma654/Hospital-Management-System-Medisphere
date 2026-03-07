import { createSlice } from '@reduxjs/toolkit';

const loadAuthFromStorage = () => {
  try {
    const stored = localStorage.getItem('mediflow_auth');
    if (stored) {
      const { user, token } = JSON.parse(stored);
      if (user && token) return { user, token, isAuthenticated: true };
    }
  } catch (_) { /* ignore */ }
  return { user: null, token: null, isAuthenticated: false };
};

const initialState = loadAuthFromStorage();

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
