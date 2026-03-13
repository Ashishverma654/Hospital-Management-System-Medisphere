import api from '../lib/api.js';

// Authentication
export const loginUser = async (email, password) => {
  const { data } = await api.post('/auth/patient/login', { email, password });
  return data;
};

export const departmentApi = {
  getAll: (params) => api.get('/department', { params }),
  create: (body) => api.post('/department', body),
  update: (id, body) => api.put(`/department/${id}`, body),
  toggleActive: (id) => api.put(`/department/${id}/toggle-active`),
};

export const specializationApi = {
  getAll: (params) => api.get('/specializations', { params }),
  create: (body) => api.post('/specializations', body),
  update: (id, body) => api.put(`/specializations/${id}`, body),
  toggleActive: (id) => api.put(`/specializations/${id}/toggle-active`),
};

export const locationApi = {
  getAll: (params) => api.get('/locations', { params }),
  create: (body) => api.post('/locations', body),
  update: (id, body) => api.put(`/locations/${id}`, body),
  toggleActive: (id) => api.put(`/locations/${id}/toggle-active`),
};

export const doctorApi = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  getSlots: (doctorId) => api.get(`/doctors/${doctorId}/slots`),
  create: (body) => api.post('/doctors', body),
  getAdminAll: (params) => api.get('/doctors/admin', { params }),
  getAdminById: (id) => api.get(`/doctors/admin/${id}`),
  createAdminDoctor: (body) => api.post('/doctors/admin', body),
  updateAdminDoctor: (id, body) => api.put(`/doctors/admin/${id}`, body),
  toggleActive: (id) => api.put(`/doctors/admin/${id}/toggle-active`),
  togglePublished: (id) => api.put(`/doctors/admin/${id}/toggle-published`),
  uploadProfileImage: (id, formData) =>
    api.put(`/doctors/admin/${id}/profile-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const awardApi = {
  getAll: (params) => api.get('/awards', { params }),
  create: (body) => api.post('/awards', body),
  update: (id, body) => api.put(`/awards/${id}`, body),
  toggleActive: (id) => api.put(`/awards/${id}/toggle-active`),
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
  getAdminList: (params) => api.get('/patients/admin/list', { params }),
  getAdminById: (id) => api.get(`/patients/admin/${id}`),
  updateAdmin: (id, body) => api.put(`/patients/admin/${id}`, body),
  getAdminBoard: (params) => api.get('/patients/admin/board', { params }),
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
export const getDepartments = (params) => api.get('/dynamic/departments', { params });
export const getSpecializations = (params) => api.get('/dynamic/specializations', { params });
export const getDoctors = (params) => api.get('/dynamic/doctors', { params });
export const getDoctorPublicById = (id) => api.get(`/dynamic/doctors/${id}`);
export const getAwards = () => api.get('/dynamic/awards');
export const getHomepageContent = () => api.get('/dynamic/homepage');
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
