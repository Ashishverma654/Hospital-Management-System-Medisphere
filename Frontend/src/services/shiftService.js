import api from '../lib/api.js';

export const getAllShifts = (params) => api.get('/shift-schedules/all', { params });
export const getMyShifts = (params) => api.get('/shift-schedules/my', { params });
export const createShift = (body) => api.post('/shift-schedules/create', body);
export const updateShift = (id, body) => api.put(`/shift-schedules/schedule/${id}`, body);
export const deleteShift = (id) => api.delete(`/shift-schedules/schedule/${id}`);
export const getShiftHistory = (params) => api.get('/shift-schedules/history', { params });
