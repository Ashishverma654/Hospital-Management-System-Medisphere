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

export const isEmployeeRole = (role) => EMPLOYEE_ROLES.includes(role);

export const getRoleLabel = (role) => ROLE_LABELS[role] || role;

export const getEmployeeHomeRoute = (role) => {
  if (role === 'subadmin') {
    return '/employee/subadmin';
  }

  return '/employee/dashboard';
};

export const getSessionTypeForRole = (role) => (role === PATIENT_ROLE ? 'patient' : 'employee');

export const getDefaultRouteForSession = (user, sessionType) => {
  if (!user) {
    return sessionType === 'employee' ? '/employee/login' : '/patient/login';
  }

  if (sessionType === 'employee' || isEmployeeRole(user.role)) {
    return getEmployeeHomeRoute(user.role);
  }

  return '/patient';
};
