import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  doctors: [],
  loading: false,
  error: null,
  selectedDoctor: null,
};

export const doctorSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    setDoctors: (state, action) => {
      state.doctors = action.payload;
    },
    addDoctor: (state, action) => {
      state.doctors.push(action.payload);
    },
    updateDoctor: (state, action) => {
      const index = state.doctors.findIndex((doc) => doc._id === action.payload._id);
      if (index !== -1) {
        state.doctors[index] = action.payload;
      }
    },
    deleteDoctor: (state, action) => {
      state.doctors = state.doctors.filter((doc) => doc._id !== action.payload);
    },
    setSelectedDoctor: (state, action) => {
      state.selectedDoctor = action.payload;
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
  setDoctors,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  setSelectedDoctor,
  setLoading,
  setError,
} = doctorSlice.actions;

export default doctorSlice.reducer;
