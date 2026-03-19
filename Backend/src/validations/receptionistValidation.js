import Joi from "joi";

export const createReceptionistSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
}).unknown(true);

export const registerPatientAtDeskSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().allow(""),
  phone: Joi.string().trim().required(),
  dateOfBirth: Joi.alternatives().try(Joi.date(), Joi.string()),
  age: Joi.alternatives().try(Joi.number(), Joi.string()),
  gender: Joi.string(),
  address: Joi.string().allow(""),
  bloodGroup: Joi.string().allow(""),
  allergies: Joi.alternatives().try(Joi.array(), Joi.string()),
  chronicDiseases: Joi.alternatives().try(Joi.array(), Joi.string()),
  emergencyContact: Joi.alternatives().try(Joi.object(), Joi.string()),
  insuranceProvider: Joi.string().allow(""),
  insuranceNumber: Joi.string().allow(""),
}).or("dateOfBirth", "age").unknown(true);
