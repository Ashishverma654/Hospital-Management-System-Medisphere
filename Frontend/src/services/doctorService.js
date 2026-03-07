import api from './api';

export const getAllDoctors = async () => {
  const res = await api.get('/doctors');
  return res.data;
};

export const getDoctorById = async (id) => {
  const res = await api.get(`/doctors/${id}`);
  return res.data;
};

export const createDoctor = async (data) => {
  const res = await api.post('/doctors', data);
  return res.data;
};

export const getDoctorSlots = async (doctorId, date) => {
  const res = await api.get(`/doctors/${doctorId}/slots?date=${date}`);
  return res.data;
};
