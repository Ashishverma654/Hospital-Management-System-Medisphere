export const PATIENT_ROLE = 'patient';

export const EMPLOYEE_ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'subadmin', label: 'Sub Admin' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'labTechnician', label: 'Lab Technician' },
  { value: 'pharmacist', label: 'Pharmacist' },
];

export const EMPLOYEE_ROLES = EMPLOYEE_ROLE_OPTIONS.map((role) => role.value);

export const EMPLOYEE_ROLE_PATHS = {
  superadmin: '/employee/superadmin',
  admin: '/employee/admin',
  subadmin: '/employee/subadmin',
  doctor: '/employee/doctor',
  nurse: '/employee/nurse',
  receptionist: '/employee/receptionist',
  labTechnician: '/employee/lab-technician',
  pharmacist: '/employee/pharmacist',
};

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  subadmin: 'Sub Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  labTechnician: 'Lab Technician',
  pharmacist: 'Pharmacist',
  patient: 'Patient',
};

export const ROLE_COLORS = {
  superadmin: 'bg-red-100 text-red-800',
  admin: 'bg-orange-100 text-orange-800',
  subadmin: 'bg-amber-100 text-amber-800',
  doctor: 'bg-blue-100 text-blue-800',
  nurse: 'bg-pink-100 text-pink-800',
  pharmacist: 'bg-emerald-100 text-emerald-800',
  labTechnician: 'bg-teal-100 text-teal-800',
  receptionist: 'bg-violet-100 text-violet-800',
  patient: 'bg-gray-100 text-gray-800',
};

export const STAFF_MANAGEMENT_ROLES = ['superadmin', 'admin', 'subadmin'];
export const BILLING_STAFF_ROLES = ['superadmin', 'admin', 'subadmin', 'receptionist'];
export const SUBADMIN_ONLY_ROLES = ['subadmin'];

export const EMPLOYEE_DASHBOARD_META = {
  superadmin: {
    eyebrow: 'System Control Center',
    title: 'Superadmin dashboard',
    description: 'Platform-wide hospital operations, governance, and future cross-department controls will attach here.',
    highlights: ['System oversight', 'Role governance', 'Global administration'],
  },
  admin: {
    eyebrow: 'Hospital Administration',
    title: 'Admin dashboard',
    description: 'Administrative coordination, staff operations, and hospital master-data workflows will expand from this hub.',
    highlights: ['Staff operations', 'Operational oversight', 'Administrative tools'],
  },
  subadmin: {
    eyebrow: 'Delegated Operations',
    title: 'Subadmin dashboard',
    description: 'Delegated staff-management and day-to-day operational tools for subadmins will be added here in later modules.',
    highlights: ['Shift approvals', 'Ward escalation desk', 'Staff duty compliance'],
  },
  doctor: {
    eyebrow: 'Clinical Workspace',
    title: 'Doctor dashboard',
    description: 'Consultation, schedules, appointments, and treatment workflows will connect to this doctor workspace later.',
    highlights: ['Consultations', 'Appointments', 'Clinical notes'],
  },
  nurse: {
    eyebrow: 'Nursing Station',
    title: 'Nurse dashboard',
    description: 'Patient monitoring, handovers, nursing tasks, and vitals workflows will plug into this nursing shell later.',
    highlights: ['Ward care', 'Vitals', 'Shift handovers'],
  },
  receptionist: {
    eyebrow: 'Front Desk',
    title: 'Receptionist dashboard',
    description: 'Front-desk scheduling, registration support, and patient coordination workflows will be added here later.',
    highlights: ['Registration desk', 'Appointments', 'Patient coordination'],
  },
  labTechnician: {
    eyebrow: 'Diagnostics Desk',
    title: 'Lab technician dashboard',
    description: 'Sample handling, diagnostic orders, and report-processing workflows will attach to this lab workspace later.',
    highlights: ['Lab orders', 'Samples', 'Reports'],
  },
  pharmacist: {
    eyebrow: 'Pharmacy Counter',
    title: 'Pharmacist dashboard',
    description: 'Prescription fulfillment, medicine issue, and stock-linked workflows will be layered onto this pharmacy shell later.',
    highlights: ['Pharmacy orders', 'Prescriptions', 'Dispensing'],
  },
};

export const normalizeRole = (role) => {
  if (!role) return role;
  const raw = String(role).trim();
  if (!raw) return raw;
  const compact = raw.replace(/\s+/g, '').toLowerCase();

  if (compact === 'superreceptionist') return 'subadmin';
  if (compact === 'labtechnician') return 'labTechnician';
  if (compact === 'superadmin') return 'superadmin';
  if (compact === 'subadmin') return 'subadmin';
  if (compact === 'receptionist') return 'receptionist';
  if (compact === 'pharmacist') return 'pharmacist';
  if (compact === 'doctor') return 'doctor';
  if (compact === 'nurse') return 'nurse';
  if (compact === 'admin') return 'admin';
  if (compact === 'patient') return 'patient';

  return role;
};

export const isEmployeeRole = (role) => EMPLOYEE_ROLES.includes(normalizeRole(role));

export const getRoleLabel = (role) => ROLE_LABELS[normalizeRole(role)] || role;

export const getEmployeeHomeRoute = (role) => EMPLOYEE_ROLE_PATHS[normalizeRole(role)] || '/employee/login';

export const getSessionTypeForRole = (role) => (normalizeRole(role) === PATIENT_ROLE ? 'patient' : 'employee');

export const getDefaultRouteForSession = (user, sessionType) => {
  if (!user) {
    return sessionType === 'employee' ? '/employee/login' : '/patient/login';
  }

  if (sessionType === 'employee' || isEmployeeRole(user.role)) {
    return getEmployeeHomeRoute(user.role);
  }

  return '/patient';
};
