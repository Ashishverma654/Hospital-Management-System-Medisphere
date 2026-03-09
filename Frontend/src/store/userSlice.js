import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  users: [],
  loading: false,
  error: null,
  selectedUser: null,
};

export const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    addUser: (state, action) => {
      state.users.push(action.payload);
    },
    updateUser: (state, action) => {
      const index = state.users.findIndex((user) => user._id === action.payload._id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    deleteUser: (state, action) => {
      state.users = state.users.filter((user) => user._id !== action.payload);
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setUsers,
  addUser,
  updateUser,
  deleteUser,
  setSelectedUser,
  setLoading,
  setError,
} = userSlice.actions;

export default userSlice.reducer;
