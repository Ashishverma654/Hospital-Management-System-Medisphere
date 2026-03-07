import api from './api';

export const createAvailability = async (data) => {
  const res = await api.post('/availability', data);
  return res.data;
};

export const getAvailabilityByDoctorId = async (doctorId) => {
  const res = await api.get(`/availability/${doctorId}`);
  return res.data;
};
