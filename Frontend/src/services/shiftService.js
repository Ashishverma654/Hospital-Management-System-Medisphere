import api from '../lib/api.js';

export const getAllShifts = (params) => api.get('/shifts/all', { params });
export const getMyShifts = (params) => api.get('/shifts/my', { params });
export const createShift = (body) => api.post('/shifts/create', body);
export const updateShift = (id, body) => api.put(`/shifts/schedule/${id}`, body);
export const deleteShift = (id) => api.delete(`/shifts/schedule/${id}`);
export const getShiftHistory = (params) => api.get('/shifts/history', { params });
