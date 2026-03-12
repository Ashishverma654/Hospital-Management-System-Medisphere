export const PATIENT_ROLE = "patient";

export const EMPLOYEE_ROLES = [
  "superadmin",
  "admin",
  "subadmin",
  "doctor",
  "nurse",
  "receptionist",
  "labTechnician",
  "pharmacist",
];

export const ALL_ROLES = [...EMPLOYEE_ROLES, PATIENT_ROLE];

export const LEGACY_ROLE_MIGRATIONS = {
  superreceptionist: "subadmin",
};

export const ROLE_LABELS = {
  superadmin: "Super Admin",
  admin: "Admin",
  subadmin: "Sub Admin",
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Receptionist",
  labTechnician: "Lab Technician",
  pharmacist: "Pharmacist",
  patient: "Patient",
};

export const CREATION_PERMISSIONS = {
  superadmin: ["admin", "subadmin", "doctor", "nurse", "receptionist", "labTechnician", "pharmacist"],
  admin: ["subadmin", "doctor", "nurse", "receptionist", "labTechnician", "pharmacist"],
  subadmin: ["nurse", "receptionist", "labTechnician", "pharmacist"],
};

export const normalizeSystemRole = (role) => LEGACY_ROLE_MIGRATIONS[role] || role;

export const isEmployeeRole = (role) => EMPLOYEE_ROLES.includes(normalizeSystemRole(role));

export const getCreatableRolesForRole = (role) => {
  const normalizedRole = normalizeSystemRole(role);
  return CREATION_PERMISSIONS[normalizedRole] || [];
};

export const getRoleLabel = (role) => ROLE_LABELS[normalizeSystemRole(role)] || role;
