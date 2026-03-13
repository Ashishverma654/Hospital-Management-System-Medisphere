import api from '../lib/api.js';

// Authentication
export const loginUser = async (email, password) => {
  const { data } = await api.post('/auth/patient/login', { email, password });
  return data;
};

export const departmentApi = {
  getAll: () => api.get('/department'),
  create: (body) => api.post('/department/create', body),
  update: (id, body) => api.patch(`/department/update/${id}`, body),
  delete: (id) => api.delete(`/department/delete/${id}`),
};

export const doctorApi = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  getSlots: (doctorId) => api.get(`/doctors/${doctorId}/slots`),
  create: (body) => api.post('/doctors', body),
};

export const slotApi = {
  getByDoctor: (doctorId) => api.get(`/slots/${doctorId}/slots`),
};

export const availabilityApi = {
  getByDoctor: (doctorId) => api.get(`/availability/${doctorId}`),
  create: (body) => api.post('/availability', body),
};

export const appointmentApi = {
  book: (body) => api.post('/appointments', body),
  getAll: () => api.get('/appointments'),
  cancel: (id) => api.put(`/appointments/${id}/cancel`),
  getDoctorToday: () => api.get('/appointments/doctor/today'),
  getDoctorAll: () => api.get('/appointments/doctor/all'),
  complete: (id) => api.put(`/appointments/${id}/complete`),
  getPatientHistory: (patientId) => api.get(`/appointments/patient-history/${patientId}`),
};

export const patientApi = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  create: (body) => api.post('/patients', body),
  update: (id, body) => api.put(`/patients/${id}`, body),
};

export const billingApi = {
  getAll: () => api.get('/billing'),
  create: (body) => api.post('/billing', body),
  getMy: () => api.get('/billing/my'),
  getByPatient: (patientId) => api.get(`/billing/patient/${patientId}`),
  pay: (id, body) => api.put(`/billing/pay/${id}`, body),
};

export const pharmacyApi = {
  getAll: () => api.get('/medicines'),
  getById: (id) => api.get(`/medicines/${id}`),
  add: (body) => api.post('/medicines', body),
  update: (id, body) => api.put(`/medicines/${id}`, body),
  delete: (id) => api.delete(`/medicines/${id}`),
};

export const labReportApi = {
  getMy: () => api.get('/lab-reports/my'),
  getByPatient: (patientId) => api.get(`/lab-reports/patient/${patientId}`),
  upload: (formData) => api.post('/lab-reports/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const prescriptionApi = {
  getMy: () => api.get('/prescriptions/my'),
  getByPatient: (patientId) => api.get(`/prescriptions/patient/${patientId}`),
  getByAppointment: (appointmentId) => api.get(`/prescriptions/appointment/${appointmentId}`),
  downloadPdf: (id) => api.get(`/prescriptions/pdf/${id}`, { responseType: 'blob' }),
  create: (body) => api.post('/prescriptions', body),
};

export const bedApi = {
  getAll: () => api.get('/beds'),
  add: (body) => api.post('/beds', body),
  assign: (id, body) => api.put(`/beds/assign/${id}`, body),
  discharge: (id) => api.put(`/beds/discharge/${id}`),
};

export const resetPassword = async (email, otp, newPassword, newPin) => {
  const { data } = await api.post('/auth/reset-password', { email, otp, newPassword, newPin });
  return data;
};

// Dynamic Data
export const getLocations = () => api.get('/dynamic/locations');
export const getDepartments = () => api.get('/dynamic/departments');
export const getDoctors = (params) => api.get('/dynamic/doctors', { params });
export const getServices = () => api.get('/dynamic/services');
export const getPackages = () => api.get('/dynamic/packages');

export const reportApi = {
  create: (formData) => 
    api.post('/reports', formData, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    }),
  getMy: () => api.get('/reports/my'),
};

export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  createUser: (body) => api.post('/admin/create-user', body),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getHistory: () => api.get('/admin/history'),
  getCreatableRoles: () => api.get('/admin/creatable-roles'),
  toggleActiveUser: (id) => api.put(`/admin/users/${id}/toggle-active`),
  getAuditHistory: (params) => api.get('/admin/audit', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (body) => api.put('/admin/settings', body),
};

export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (body) => api.put('/users/me', body),
  uploadProfileImage: (formData) => api.put('/users/profile-image', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  }),
};
