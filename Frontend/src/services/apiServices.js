import api from '../lib/api.js';

// Authentication
export const loginUser = async (email, password) => {
  return api.post('/auth/patient/login', { email, password });
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
  getDashboard: () => api.get('/doctors/dashboard'),
};

export const awardApi = {
  getAll: (params) => api.get('/awards', { params }),
  create: (body) => api.post('/awards', body),
  update: (id, body) => api.put(`/awards/${id}`, body),
  toggleActive: (id) => api.put(`/awards/${id}/toggle-active`),
};

export const slotApi = {
  getByDoctor: (doctorId, date) => api.get(`/slots/${doctorId}/slots`, { params: { date } }),
};

export const availabilityApi = {
  getByDoctor: (doctorId) => api.get(`/availability/${doctorId}`),
  create: (body) => api.post('/availability', body),
};

export const appointmentApi = {
  book: (body) => api.post('/appointments', body),
  getAll: (params) => api.get('/appointments', { params }),
  cancel: (id, body) => api.put(`/appointments/${id}/cancel`, body),
  getQueueToday: (params) => api.get('/appointments/queue/today', { params }),
  arrive: (id) => api.put(`/appointments/${id}/arrive`),
  reschedule: (id, body) => api.put(`/appointments/${id}/reschedule`, body),
  getDoctorToday: () => api.get('/appointments/doctor/today'),
  getDoctorAll: () => api.get('/appointments/doctor/all'),
  complete: (id) => api.put(`/appointments/${id}/complete`),
  getPatientHistory: (patientId) => api.get(`/appointments/patient-history/${patientId}`),
  startConsultation: (appointmentId) => api.post(`/appointments/${appointmentId}/start-consultation`),
  getPatientSummary: (patientId) => api.get(`/appointments/patient/${patientId}/summary`),
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
  initiateForAppointment: (appointmentId) => api.post(`/billing/appointments/${appointmentId}/initiate`),
  pay: (id, body) => api.put(`/billing/pay/${id}`, body),
};

export const pharmacyApi = {
  getAll: (params) => api.get('/medicines', { params }),
  getById: (id) => api.get(`/medicines/${id}`),
  add: (body) => api.post('/medicines', body),
  update: (id, body) => api.put(`/medicines/${id}`, body),
  delete: (id) => api.delete(`/medicines/${id}`),
};

export const pharmacyOrderApi = {
  placeFromPrescription: (prescriptionId, body) => api.post(`/pharmacy-orders/from-prescription/${prescriptionId}`, body),
  getMy: () => api.get('/pharmacy-orders/my'),
  getById: (id) => api.get(`/pharmacy-orders/${id}`),
  getPharmacistOrders: (params) => api.get('/pharmacists/orders', { params }),
  getPharmacistOrder: (id) => api.get(`/pharmacists/orders/${id}`),
  accept: (id, body = {}) => api.patch(`/pharmacists/orders/${id}/accept`, body),
  markPreparing: (id, body = {}) => api.patch(`/pharmacists/orders/${id}/preparing`, body),
  markReady: (id, body = {}) => api.patch(`/pharmacists/orders/${id}/ready`, body),
  complete: (id) => api.patch(`/pharmacists/orders/${id}/complete`),
  cancel: (id) => api.patch(`/pharmacists/orders/${id}/cancel`),
};

export const pharmacistApi = {
  getDashboard: () => api.get('/pharmacists/dashboard'),
  getProfile: () => api.get('/pharmacists/profile'),
  updateProfile: (body) => api.put('/pharmacists/profile', body),
};

export const labReportApi = {
  getMy: () => api.get('/lab-reports/my'),
  getByPatient: (patientId) => api.get(`/lab-reports/patient/${patientId}`),
  upload: (formData) => api.post('/lab-reports/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const labOrderApi = {
  create: (body) => api.post('/lab-orders', body),
  getByDoctor: (params) => api.get('/lab-orders/doctor', { params }),
  getMy: () => api.get('/lab-orders/my'),
  getById: (id) => api.get(`/lab-orders/${id}`),
  downloadPdf: (id) => api.get(`/lab-orders/${id}/pdf`, { responseType: 'blob' }),
  updateStatus: (id, body) => api.put(`/lab-orders/${id}/status`, body),
};

export const labTechApi = {
  getDashboard: () => api.get('/lab-techs/dashboard'),
  getOrders: (params) => api.get('/lab-techs/orders', { params }),
  getOrder: (id) => api.get(`/lab-techs/orders/${id}`),
  scheduleSampleCollection: (id, body) => api.patch(`/lab-techs/orders/${id}/sample-schedule`, body),
  scheduleReportPickup: (id, body) => api.patch(`/lab-techs/orders/${id}/report-pickup`, body),
  markSampleCollected: (id, body = {}) => api.patch(`/lab-techs/orders/${id}/sample-collected`, body),
  markInProcessing: (id, body = {}) => api.patch(`/lab-techs/orders/${id}/processing`, body),
  markReportReady: (id, body = {}) => api.patch(`/lab-techs/orders/${id}/report-ready`, body),
  uploadReport: (id, formData) =>
    api.post(`/lab-techs/orders/${id}/report-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  releaseReport: (id) => api.patch(`/lab-techs/orders/${id}/release`),
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
  return api.post('/auth/password/reset', { email, otp, newPassword, newPin });
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

export const receptionistApi = {
  getDashboard: () => api.get('/receptionists/dashboard'),
  registerPatient: (body) => api.post('/receptionists/patients', body),
  searchPatients: (query) => api.get('/receptionists/patients/search', { params: { query } }),
  getBookingOptions: (params) => api.get('/receptionists/booking-options', { params }),
};
