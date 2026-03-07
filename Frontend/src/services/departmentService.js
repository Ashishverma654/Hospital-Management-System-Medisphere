import api from './api';

export const getAllDepartments = async () => {
  const res = await api.get('/department');
  return res.data;
};

export const createDepartment = async (data) => {
  const res = await api.post('/department/create', data);
  return res.data;
};

export const updateDepartment = async (id, data) => {
  const res = await api.patch(`/department/update/${id}`, data);
  return res.data;
};

export const deleteDepartment = async (id) => {
  const res = await api.delete(`/department/delete/${id}`);
  return res.data;
};
