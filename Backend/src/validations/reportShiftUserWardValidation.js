import Joi from "joi";

export const uploadReportSchema = Joi.object({
  patientId: Joi.string().required(),
  appointmentId: Joi.string(),
}).unknown(true);

export const createShiftSchema = Joi.object({
  name: Joi.string().trim().required(),
  shiftType: Joi.string().allow(""),
  startTime: Joi.string().required(),
  endTime: Joi.string().required(),
  isActive: Joi.boolean(),
  code: Joi.string().allow(""),
  description: Joi.string().allow(""),
}).unknown(true);

export const updateShiftSchema = Joi.object({
  name: Joi.string().trim(),
  shiftType: Joi.string().allow(""),
  startTime: Joi.string(),
  endTime: Joi.string(),
  isActive: Joi.boolean(),
  code: Joi.string().allow(""),
  description: Joi.string().allow(""),
}).unknown(true);

export const updateMyProfileSchema = Joi.object({
  phone: Joi.string().allow(""),
  alternativeContact: Joi.string().allow(""),
  gender: Joi.string().allow(""),
  bloodGroup: Joi.string().allow(""),
  maritalStatus: Joi.string().allow(""),
  nationality: Joi.string().allow(""),
  address: Joi.string().allow(""),
  city: Joi.string().allow(""),
  state: Joi.string().allow(""),
  postalCode: Joi.string().allow(""),
  emergencyContactName: Joi.string().allow(""),
  emergencyContactPhone: Joi.string().allow(""),
  emergencyContactRelationship: Joi.string().allow(""),
}).unknown(true);

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().allow(""),
  newPassword: Joi.string().min(6).required(),
}).unknown(true);

export const createWardSchema = Joi.object({
  name: Joi.string().trim().required(),
  wardNumber: Joi.string().trim().required(),
  wardCode: Joi.string().allow(""),
  wardType: Joi.string().allow(""),
  departmentId: Joi.string().allow(""),
  floor: Joi.string().allow(""),
  block: Joi.string().allow(""),
  hospitalLocationId: Joi.string().allow(""),
  bedCount: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  defaultPrice: Joi.alternatives().try(Joi.number(), Joi.string()),
  wardInCharge: Joi.string().allow(""),
  assignedDoctor: Joi.string().allow(""),
  nurseCount: Joi.alternatives().try(Joi.number(), Joi.string()),
  equipment: Joi.alternatives().try(Joi.array(), Joi.string()),
  cleaningStatus: Joi.string().allow(""),
  lastSanitized: Joi.alternatives().try(Joi.date(), Joi.string()),
  contactNumber: Joi.string().allow(""),
  isActive: Joi.boolean(),
}).unknown(true);

export const updateWardSchema = Joi.object({
  name: Joi.string().trim(),
  wardNumber: Joi.string().trim(),
  wardCode: Joi.string().allow(""),
  wardType: Joi.string().allow(""),
  departmentId: Joi.string().allow(""),
  floor: Joi.string().allow(""),
  block: Joi.string().allow(""),
  hospitalLocationId: Joi.string().allow(""),
  bedCount: Joi.alternatives().try(Joi.number(), Joi.string()),
  defaultPrice: Joi.alternatives().try(Joi.number(), Joi.string()),
  wardInCharge: Joi.string().allow(""),
  assignedDoctor: Joi.string().allow(""),
  nurseCount: Joi.alternatives().try(Joi.number(), Joi.string()),
  equipment: Joi.alternatives().try(Joi.array(), Joi.string()),
  cleaningStatus: Joi.string().allow(""),
  lastSanitized: Joi.alternatives().try(Joi.date(), Joi.string()),
  contactNumber: Joi.string().allow(""),
  isActive: Joi.boolean(),
}).unknown(true);

export const emptyBodySchema = Joi.object({}).unknown(true);
