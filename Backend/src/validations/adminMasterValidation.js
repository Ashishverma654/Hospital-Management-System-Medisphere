import Joi from "joi";

export const createDepartmentSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().allow(""),
  icon: Joi.string().allow(""),
  image: Joi.string().allow(""),
  code: Joi.string().allow(""),
  isFeatured: Joi.boolean(),
  featureOrder: Joi.alternatives().try(Joi.number(), Joi.string()),
}).unknown(true);

export const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().allow(""),
  icon: Joi.string().allow(""),
  image: Joi.string().allow(""),
  code: Joi.string().allow(""),
  isFeatured: Joi.boolean(),
  featureOrder: Joi.alternatives().try(Joi.number(), Joi.string()),
}).unknown(true);

export const createLocationSchema = Joi.object({
  name: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  state: Joi.string().allow(""),
  address: Joi.string().trim().required(),
  pincode: Joi.string().allow(""),
  phone: Joi.string().allow(""),
  email: Joi.string().email().allow(""),
  mapUrl: Joi.string().allow(""),
  locationType: Joi.string().allow(""),
}).unknown(true);

export const updateLocationSchema = Joi.object({
  name: Joi.string().trim(),
  city: Joi.string().trim(),
  state: Joi.string().allow(""),
  address: Joi.string().allow(""),
  pincode: Joi.string().allow(""),
  phone: Joi.string().allow(""),
  email: Joi.string().email().allow(""),
  mapUrl: Joi.string().allow(""),
  locationType: Joi.string().allow(""),
}).unknown(true);

export const createSpecializationSchema = Joi.object({
  name: Joi.string().trim().required(),
  departmentId: Joi.string().required(),
  description: Joi.string().allow(""),
}).unknown(true);

export const updateSpecializationSchema = Joi.object({
  name: Joi.string().trim(),
  departmentId: Joi.string(),
  description: Joi.string().allow(""),
}).unknown(true);

export const createStaffUserSchema = Joi.object({
  name: Joi.string().trim(),
  firstName: Joi.string().trim(),
  middleName: Joi.string().trim(),
  lastName: Joi.string().trim(),
  email: Joi.string().email().required(),
  password: Joi.string(),
  role: Joi.string().required(),
  phone: Joi.string().allow(""),
  alternativeContact: Joi.string().allow(""),
  dob: Joi.alternatives().try(Joi.date(), Joi.string()),
  gender: Joi.string().allow(""),
  bloodGroup: Joi.string().allow(""),
  address: Joi.string().allow(""),
  city: Joi.string().allow(""),
  state: Joi.string().allow(""),
  postalCode: Joi.string().allow(""),
  maritalStatus: Joi.string().allow(""),
  nationality: Joi.string().allow(""),
  profileImage: Joi.string().allow(""),
  title: Joi.string().allow(""),
  departmentId: Joi.string().allow(""),
  joiningDate: Joi.alternatives().try(Joi.date(), Joi.string()),
  roomNumber: Joi.string().allow(""),
  experienceYears: Joi.alternatives().try(Joi.number(), Joi.string()),
  qualifications: Joi.alternatives().try(Joi.array(), Joi.string()),
  education: Joi.alternatives().try(Joi.array(), Joi.string()),
  certifications: Joi.alternatives().try(Joi.array(), Joi.string()),
  skills: Joi.alternatives().try(Joi.array(), Joi.string()),
  licenseNumber: Joi.string().allow(""),
  licenseExpiryDate: Joi.alternatives().try(Joi.date(), Joi.string()),
  shift: Joi.string().allow(""),
  specialization: Joi.string().allow(""),
  emergencyContactName: Joi.string().allow(""),
  emergencyContactNumber: Joi.string().allow(""),
  emergencyContactRelationship: Joi.string().allow(""),
  labSection: Joi.string().allow(""),
}).custom((value, helpers) => {
  const hasName = value.name && `${value.name}`.trim();
  const hasFirstLast = value.firstName && value.lastName;
  if (!hasName && !hasFirstLast) {
    return helpers.error("any.custom", { message: "name or firstName+lastName is required" });
  }
  return value;
}, "name or firstName+lastName requirement").unknown(true);

export const upsertHospitalSettingsSchema = Joi.object({
  hospitalName: Joi.string().allow(""),
  logo: Joi.string().allow(""),
  email: Joi.string().email().allow(""),
  phone: Joi.string().allow(""),
  address: Joi.string().allow(""),
  emergencyNumber: Joi.string().allow(""),
  footerInfo: Joi.string().allow(""),
  publicInfo: Joi.alternatives().try(Joi.object(), Joi.string()),
}).unknown(true);
