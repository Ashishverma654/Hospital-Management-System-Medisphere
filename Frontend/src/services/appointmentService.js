import api from './api';

export const bookAppointment = async (data) => {
  const res = await api.post('/appointments', data);
  return res.data;
};

export const getAllAppointments = async () => {
  const res = await api.get('/appointments');
  return res.data;
};

export const cancelAppointment = async (id) => {
  const res = await api.put(`/appointments/${id}/cancel`);
  return res.data;
};

export const getTodayAppointments = async () => {
  const res = await api.get('/appointments/doctor/today');
  return res.data;
};

export const getDoctorAllAppointments = async () => {
  const res = await api.get('/appointments/doctor/all');
  return res.data;
};

export const completeAppointment = async (id) => {
  const res = await api.put(`/appointments/${id}/complete`);
  return res.data;
};

export const getPatientHistory = async (patientId) => {
  const res = await api.get(`/appointments/patient-history/${patientId}`);
  return res.data;
};
