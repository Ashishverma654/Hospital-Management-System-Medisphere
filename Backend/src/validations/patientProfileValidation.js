import Joi from "joi";

export const updateAdminPatientSchema = Joi.object({
  name: Joi.string().trim(),
  email: Joi.string().email(),
  phone: Joi.string().trim(),
  gender: Joi.string(),
  dateOfBirth: Joi.alternatives().try(Joi.date(), Joi.string(), Joi.allow(null)),
  bloodGroup: Joi.string().allow(""),
  address: Joi.string().allow(""),
  emergencyContact: Joi.alternatives().try(Joi.object(), Joi.string()),
  allergies: Joi.alternatives().try(Joi.array(), Joi.string()),
  chronicDiseases: Joi.alternatives().try(Joi.array(), Joi.string()),
  insuranceProvider: Joi.string().allow(""),
  insuranceNumber: Joi.string().allow(""),
  profileStatus: Joi.string(),
  isActive: Joi.boolean(),
  notes: Joi.string().allow(""),
}).unknown(true);

export const updateMyPatientSchema = Joi.object({
  phone: Joi.string().trim(),
  address: Joi.string().allow(""),
  gender: Joi.string(),
  bloodGroup: Joi.string().allow(""),
  emergencyContact: Joi.alternatives().try(Joi.object(), Joi.string()),
  allergies: Joi.alternatives().try(Joi.array(), Joi.string()),
  chronicDiseases: Joi.alternatives().try(Joi.array(), Joi.string()),
}).unknown(true);
