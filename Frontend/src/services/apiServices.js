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
  getHistory: (id) => api.get(`/department/${id}/history`),
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

export const wardApi = {
  getAll: (params) => api.get('/wards', { params }),
  getSummary: () => api.get('/wards/summary'),
  getById: (id) => api.get(`/wards/${id}`),
  getHistory: (id) => api.get(`/wards/${id}/history`),
  create: (body) => api.post('/wards', body),
  update: (id, body) => api.put(`/wards/${id}`, body),
  toggleActive: (id) => api.put(`/wards/${id}/toggle-active`),
};

export const doctorApi = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  getSlots: (doctorId) => api.get(`/doctors/${doctorId}/slots`),
  getBookingList: (params) => api.get('/doctors/booking', { params }),
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
  softDelete: (id) => api.put(`/doctors/admin/${id}/soft-delete`),
};

export const awardApi = {
  getAll: (params) => api.get('/awards', { params }),
  getPublic: () => api.get('/awards/public'),
  create: (formData) => api.post('/awards', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/awards/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggleActive: (id) => api.put(`/awards/${id}/toggle-active`),
  getHistory: (id) => api.get(`/awards/${id}/history`),
};

export const slotApi = {
  getByDoctor: (doctorId, date) => api.get(`/slots/${doctorId}/slots`, { params: { date } }),
};

export const availabilityApi = {
  getByDoctor: (doctorId) => api.get(`/availability/${doctorId}`),
  create: (body) => api.post('/availability', body),
  update: (id, body) => api.put(`/availability/${id}`, body),
  remove: (id) => api.delete(`/availability/${id}`),
};

export const appointmentApi = {
  book: (body) => api.post('/appointments', body),
  getAll: (params) => api.get('/appointments', { params }),
  cancel: (id, body) => api.put(`/appointments/${id}/cancel`, body),
  markNoShow: (id) => api.put(`/appointments/${id}/no-show`),
  getQueueToday: (params) => api.get('/appointments/queue/today', { params }),
  arrive: (id) => api.put(`/appointments/${id}/arrive`),
  reschedule: (id, body) => api.put(`/appointments/${id}/reschedule`, body),
  getDoctorToday: () => api.get('/appointments/doctor/today'),
  getDoctorAll: () => api.get('/appointments/doctor/all'),
  getDoctorById: (id) => api.get(`/appointments/doctor/${id}`),
  complete: (id) => api.put(`/appointments/${id}/complete`),
  recommendAdmission: (id, body) => api.put(`/appointments/${id}/recommend-admission`, body),
  getPatientHistory: (patientId) => api.get(`/appointments/patient-history/${patientId}`),
  startConsultation: (appointmentId) => api.post(`/appointments/${appointmentId}/start-consultation`),
  startConsultationEarly: (appointmentId, body) =>
    api.post(`/appointments/${appointmentId}/start-consultation-early`, body),
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
  getMyProfile: () => api.get('/patients/me'),
  updateMyProfile: (body) => api.put('/patients/me', body),
  getMyDashboard: () => api.get('/patients/me/dashboard'),
  getMyTimeline: () => api.get('/patients/me/timeline'),
};

export const billingApi = {
  getAll: (params) => api.get('/billing', { params }),
  create: (body) => api.post('/billing', body),
  getMy: (params) => api.get('/billing/my', { params }),
  getById: (id) => api.get(`/billing/${id}`),
  downloadPdf: (id) => api.get(`/billing/${id}/pdf`, { responseType: 'blob' }),
  emailInvoice: (id) => api.post(`/billing/${id}/email`),
  getByPatient: (patientId) => api.get(`/billing/patient/${patientId}`),
  getByContext: (params) => api.get('/billing/context', { params }),
  initiateForAppointment: (appointmentId) => api.post(`/billing/appointments/${appointmentId}/initiate`),
  pay: (id, body) => api.put(`/billing/pay/${id}`, body),
};

export const pharmacyApi = {
  getAll: (params) => api.get('/medicines', { params }),
  getById: (id) => api.get(`/medicines/${id}`),
  add: (body) => api.post('/medicines', body),
  update: (id, body) => api.put(`/medicines/${id}`, body),
  delete: (id) => api.delete(`/medicines/${id}`),
  getStockLedger: (id, params) => api.get(`/medicines/${id}/stock-ledger`, { params }),
  getRecentStockLedger: (params) => api.get('/medicines/stock-ledger/recent', { params }),
};

export const pharmacyOrderApi = {
  placeFromPrescription: (prescriptionId, body) => api.post(`/pharmacy-orders/from-prescription/${prescriptionId}`, body),
  getMy: () => api.get('/pharmacy-orders/my'),
  getById: (id) => api.get(`/pharmacy-orders/${id}`),
  getPharmacistOrders: (params) => api.get('/pharmacists/orders', { params }),
  getPharmacistOrder: (id) => api.get(`/pharmacists/orders/${id}`),
  accept: (id, body = {}) => api.patch(`/pharmacists/orders/${id}/accept`, body),
  verify: (id, body = {}) => api.patch(`/pharmacists/orders/${id}/verify`, body),
  markPreparing: (id, body = {}) => api.patch(`/pharmacists/orders/${id}/preparing`, body),
  markReady: (id, body = {}) => api.patch(`/pharmacists/orders/${id}/ready`, body),
  complete: (id, body = {}) => api.patch(`/pharmacists/orders/${id}/complete`, body),
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

export const rtcApi = {
  getIce: () => api.get('/rtc/ice'),
};

export const labTestApi = {
  getAll: (params) => api.get('/tests', { params }),
  create: (body) => api.post('/tests', body),
  update: (id, body) => api.put(`/tests/${id}`, body),
};

export const testPriceApi = {
  getAll: (params) => api.get('/test-prices', { params }),
  create: (body) => api.post('/test-prices', body),
  update: (id, body) => api.put(`/test-prices/${id}`, body),
};

export const labOrderApi = {
  create: (body) => api.post('/lab-orders', body),
  createPatient: (body) => api.post('/lab-orders/patient', body),
  getByDoctor: (params) => api.get('/lab-orders/doctor', { params }),
  getMy: () => api.get('/lab-orders/my'),
  getById: (id) => api.get(`/lab-orders/${id}`),
  downloadPdf: (id) => api.get(`/lab-orders/${id}/pdf`, { responseType: 'blob' }),
  updateStatus: (id, body) => api.put(`/lab-orders/${id}/status`, body),
};

export const labRecommendationApi = {
  create: (body) => api.post('/lab-recommendations', body),
  getDoctor: () => api.get('/lab-recommendations/doctor'),
  getMy: () => api.get('/lab-recommendations/my'),
  markExternal: (id, body) => api.post(`/lab-recommendations/${id}/external`, body),
  placeOrder: (id) => api.post(`/lab-recommendations/${id}/order`, {}),
};

export const labTechApi = {
  getDashboard: () => api.get('/lab-techs/dashboard'),
  getProfile: () => api.get('/lab-techs/profile'),
  updateProfile: (body) => api.put('/lab-techs/profile', body),
  getOrders: (params) => api.get('/lab-techs/orders', { params }),
  getOrder: (id) => api.get(`/lab-techs/orders/${id}`),
  getPendingReports: () => api.get('/lab-techs/pending-reports'),
  scheduleSampleCollection: (id, body) => api.patch(`/lab-techs/orders/${id}/sample-schedule`, body),
  scheduleReportPickup: (id, body) => api.patch(`/lab-techs/orders/${id}/report-pickup`, body),
  markAccessioned: (id, body = {}) => api.patch(`/lab-techs/orders/${id}/accession`, body),
  rejectOrder: (id, body) => api.patch(`/lab-techs/orders/${id}/reject`, body),
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
  getAll: (params) => api.get('/beds', { params }),
  add: (body) => api.post('/beds', body),
  update: (id, body) => api.put(`/beds/${id}`, body),
  getCurrentAdmissions: (params) => api.get('/beds/admissions/current', { params }),
  getAdmissionCandidates: (params) => api.get('/beds/admission-candidates', { params }),
  assign: (id, body) => api.put(`/beds/assign/${id}`, body),
  assignAuto: (body) => api.post('/beds/assign', body),
  discharge: (id) => api.put(`/beds/discharge/${id}`),
  transfer: (body) => api.put('/beds/transfer', body),
};

export const admissionApi = {
  getAll: (params) => api.get('/admissions', { params }),
  getById: (id) => api.get(`/admissions/${id}`),
  create: (body) => api.post('/admissions', body),
};

export const shiftApi = {
  getAll: (params) => api.get('/shifts', { params }),
  getById: (id) => api.get(`/shifts/${id}`),
  create: (body) => api.post('/shifts', body),
  update: (id, body) => api.put(`/shifts/${id}`, body),
  remove: (id) => api.delete(`/shifts/${id}`),
};

export const staffDutyApi = {
  start: (body) => api.post('/staff-duty/start', body),
  end: (body) => api.post('/staff-duty/end', body),
  markLeave: (body) => api.post('/staff-duty/leave', body),
  getStats: (params) => api.get('/staff-duty/stats', { params }),
  getHistory: (params) => api.get('/staff-duty/history', { params }),
};

export const nurseAssignmentApi = {
  getAll: (params) => api.get('/nurse-assignments', { params }),
  getById: (id) => api.get(`/nurse-assignments/${id}`),
  create: (body) => api.post('/nurse-assignments', body),
  update: (id, body) => api.put(`/nurse-assignments/${id}`, body),
  remove: (id) => api.delete(`/nurse-assignments/${id}`),
};

export const staffAvailabilityApi = {
  getAll: () => api.get('/staff-availability'),
  getSummary: () => api.get('/staff-availability/summary'),
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

export const analyticsApi = {
  getRevenue: () => api.get('/analytics/revenue'),
  getPatientFlow: () => api.get('/analytics/patient-flow'),
  getDoctor: () => api.get('/analytics/doctor'),
  getBedOccupancy: () => api.get('/analytics/bed-occupancy'),
  getLab: () => api.get('/analytics/lab'),
  getPharmacy: () => api.get('/analytics/pharmacy'),
};

export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getSubadminDashboard: () => api.get('/admin/subadmin-dashboard'),
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
  changePassword: (body) => api.put('/users/change-password', body),
  uploadProfileImage: (formData) => api.put('/users/profile-image', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  }),
};

export const receptionistApi = {
  getDashboard: () => api.get('/receptionists/dashboard'),
  registerPatient: (body) => api.post('/receptionists/patients', body),
  searchPatients: (params) => {
    const queryParams = typeof params === 'string' ? { query: params } : params;
    return api.get('/receptionists/patients/search', { params: queryParams });
  },
  getBookingOptions: (params) => api.get('/receptionists/booking-options', { params }),
  getPatientHistory: (patientId) => api.get(`/receptionists/patients/${patientId}/history`),
};

export const nurseApi = {
  getDashboard: () => api.get('/nurses/dashboard'),
  getAssignments: () => api.get('/nurses/assignments'),
  getAssignedPatients: () => api.get('/nurses/patients'),
  getWardBoard: () => api.get('/nurses/ward-board'),
  getRoster: () => api.get('/nurses/roster'),
  getTasks: (params) => api.get('/nurses/tasks', { params }),
  createTask: (body) => api.post('/nurses/tasks', body),
  updateTask: (id, body) => api.patch(`/nurses/tasks/${id}`, body),
  getVitals: (params) => api.get('/nurses/vitals', { params }),
  getPatientVitalsHistory: (patientId) => api.get(`/nurses/vitals/${patientId}/history`),
  recordVitals: (body) => api.post('/nurses/vitals', body),
  getNotes: (params) => api.get('/nurses/notes', { params }),
  createNote: (body) => api.post('/nurses/notes', body),
  getEscalations: (params) => api.get('/nurses/escalations', { params }),
  createEscalation: (body) => api.post('/nurses/escalations', body),
  getHandover: (params) => api.get('/nurses/handover', { params }),
  createHandover: (body) => api.post('/nurses/handover', body),
  getProfile: () => api.get('/nurses/profile'),
  updateProfile: (body) => api.put('/nurses/profile', body),
};

export const notificationsApi = {
  getMy: () => api.get('/notifications/my'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all', {}),
  getMyEmployee: () => api.get('/notifications/employee/my'),
  getEmployeeUnreadCount: () => api.get('/notifications/employee/unread-count'),
  getEmployeePreferences: () => api.get('/notifications/employee/preferences'),
  updateEmployeePreferences: (body) => api.put('/notifications/employee/preferences', body),
  markReadEmployee: (id) => api.patch(`/notifications/employee/${id}/read`),
  markAllReadEmployee: () => api.patch('/notifications/employee/read-all', {}),
};

export const fileApi = {
  uploadImage: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};
