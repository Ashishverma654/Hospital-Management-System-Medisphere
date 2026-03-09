import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  invoices: [],
  loading: false,
  error: null,
  selectedInvoice: null,
  totalRevenue: 0,
};

export const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setInvoices: (state, action) => {
      state.invoices = action.payload;
    },
    addInvoice: (state, action) => {
      state.invoices.push(action.payload);
    },
    updateInvoice: (state, action) => {
      const index = state.invoices.findIndex((inv) => inv._id === action.payload._id);
      if (index !== -1) {
        state.invoices[index] = action.payload;
      }
    },
    deleteInvoice: (state, action) => {
      state.invoices = state.invoices.filter((inv) => inv._id !== action.payload);
    },
    setSelectedInvoice: (state, action) => {
      state.selectedInvoice = action.payload;
    },
    setTotalRevenue: (state, action) => {
      state.totalRevenue = action.payload;
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
  setInvoices,
  addInvoice,
  updateInvoice,
  deleteInvoice,
  setSelectedInvoice,
  setTotalRevenue,
  setLoading,
  setError,
} = billingSlice.actions;

export default billingSlice.reducer;
