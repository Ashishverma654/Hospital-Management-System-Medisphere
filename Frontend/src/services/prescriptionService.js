import api from './api';

export const createPrescription = async (data) => {
  const res = await api.post('/prescriptions', data);
  return res.data;
};

export const getMyPrescriptions = async () => {
  const res = await api.get('/prescriptions/my');
  return res.data;
};
