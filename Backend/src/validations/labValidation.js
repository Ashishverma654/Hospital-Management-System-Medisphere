import Joi from "joi";

const testItemSchema = Joi.object({
  testName: Joi.string().trim().required(),
  testCode: Joi.string().trim().allow(""),
  price: Joi.alternatives().try(Joi.number(), Joi.string()),
}).unknown(true);

export const createLabOrderSchema = Joi.object({
  patientId: Joi.string().required(),
  appointmentId: Joi.string(),
  tests: Joi.array().items(testItemSchema).min(1).required(),
  notes: Joi.string().allow(""),
  urgency: Joi.string(),
}).unknown(true);

export const updateLabOrderStatusSchema = Joi.object({
  status: Joi.string().required(),
}).unknown(true);

export const uploadLabReportSchema = Joi.object({
  labOrderId: Joi.string(),
  labOrderItemId: Joi.string(),
  reportName: Joi.string().allow(""),
  reportType: Joi.string().allow(""),
  patientId: Joi.string(),
  doctorId: Joi.string(),
  appointmentId: Joi.string(),
}).unknown(true);
