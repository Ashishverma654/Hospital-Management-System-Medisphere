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

export const ID_PREFIXES = {
  superadmin: "SADM",
  admin: "ADM",
  subadmin: "SBM",
  doctor: "DOC",
  nurse: "NURS",
  receptionist: "RECP",
  labTechnician: "LABT",
  pharmacist: "PHRM",
  patient: "PAT",
};

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

export const normalizeSystemRole = (role) => {
  if (!role) return role;
  const raw = `${role}`.trim();
  if (!raw) return raw;
  const compact = raw.replace(/\s+/g, "").toLowerCase();

  if (compact === "superreceptionist") return "subadmin";
  if (compact === "labtechnician") return "labTechnician";
  if (compact === "superadmin") return "superadmin";
  if (compact === "subadmin") return "subadmin";
  if (compact === "receptionist") return "receptionist";
  if (compact === "pharmacist") return "pharmacist";
  if (compact === "doctor") return "doctor";
  if (compact === "nurse") return "nurse";
  if (compact === "admin") return "admin";
  if (compact === "patient") return "patient";

  return LEGACY_ROLE_MIGRATIONS[role] || role;
};

export const isEmployeeRole = (role) => EMPLOYEE_ROLES.includes(normalizeSystemRole(role));

export const getCreatableRolesForRole = (role) => {
  const normalizedRole = normalizeSystemRole(role);
  return CREATION_PERMISSIONS[normalizedRole] || [];
};

export const getRoleLabel = (role) => ROLE_LABELS[normalizeSystemRole(role)] || role;
