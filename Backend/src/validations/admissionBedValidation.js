import Joi from "joi";

export const createAdmissionSchema = Joi.object({
  patientId: Joi.string().required(),
  departmentId: Joi.string().required(),
  doctorId: Joi.string().required(),
  reason: Joi.string().allow(""),
  notes: Joi.string().allow(""),
}).unknown(true);

export const createBedSchema = Joi.object({
  wardId: Joi.string().required(),
  bedNumber: Joi.string().trim().allow(""),
  status: Joi.string(),
  customPriceOverride: Joi.alternatives().try(Joi.number(), Joi.string()),
  isActive: Joi.boolean(),
}).unknown(true);

export const updateBedSchema = Joi.object({
  wardId: Joi.string(),
  bedNumber: Joi.string().trim(),
  status: Joi.string(),
  customPriceOverride: Joi.alternatives().try(Joi.number(), Joi.string(), Joi.allow(null)),
  isActive: Joi.boolean(),
}).unknown(true);

export const assignBedSchema = Joi.object({
  patientId: Joi.string().required(),
  departmentId: Joi.string(),
  wardId: Joi.string(),
  prescriptionId: Joi.string(),
  admittedAt: Joi.alternatives().try(Joi.date(), Joi.string()),
  reason: Joi.string().allow(""),
  notes: Joi.string().allow(""),
  admissionRecommendationNotes: Joi.string().allow(""),
}).unknown(true);

export const assignBedAutoSchema = Joi.object({
  wardId: Joi.string().required(),
  patientId: Joi.string().required(),
  departmentId: Joi.string(),
  prescriptionId: Joi.string(),
  admittedAt: Joi.alternatives().try(Joi.date(), Joi.string()),
  reason: Joi.string().allow(""),
  notes: Joi.string().allow(""),
  admissionRecommendationNotes: Joi.string().allow(""),
}).unknown(true);

export const transferBedSchema = Joi.object({
  fromBedId: Joi.string().required(),
  toBedId: Joi.string().required(),
  notes: Joi.string().allow(""),
}).unknown(true);
