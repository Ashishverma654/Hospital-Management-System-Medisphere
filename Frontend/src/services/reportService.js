import api from './api';

export const uploadReport = async (formData) => {
  const res = await api.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getMyReports = async () => {
  const res = await api.get('/reports/my');
  return res.data;
};
