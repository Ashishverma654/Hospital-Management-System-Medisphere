import Joi from "joi";

export const createLabTestSchema = Joi.object({
  name: Joi.string().trim().required(),
  testType: Joi.string().valid("BLOOD", "RADIOLOGY", "PATHOLOGY", "OTHER").required(),
  description: Joi.string().allow(""),
  isActive: Joi.boolean(),
}).unknown(true);

export const updateLabTestSchema = Joi.object({
  name: Joi.string().trim(),
  testType: Joi.string().valid("BLOOD", "RADIOLOGY", "PATHOLOGY", "OTHER"),
  description: Joi.string().allow(""),
  isActive: Joi.boolean(),
}).unknown(true);

export const createTestPriceSchema = Joi.object({
  testId: Joi.string().required(),
  price: Joi.number().min(0).required(),
  department: Joi.string().allow(""),
}).unknown(true);

export const updateTestPriceSchema = Joi.object({
  price: Joi.number().min(0),
  department: Joi.string().allow(""),
}).unknown(true);
