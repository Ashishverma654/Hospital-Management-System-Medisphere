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
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Sync back to local storage manually to persist photo across reloads
        localStorage.setItem('mediflow_auth', JSON.stringify({
          user: state.user,
          token: state.token
        }));
      }
    },
  },
});

export const { loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
