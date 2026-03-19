import Joi from "joi";

export const createNursingTaskSchema = Joi.object({
  patientId: Joi.string(),
  wardId: Joi.string(),
  taskType: Joi.string().required(),
  dueAt: Joi.alternatives().try(Joi.date(), Joi.string()),
  notes: Joi.string().allow(""),
}).unknown(true);

export const updateNursingTaskSchema = Joi.object({
  status: Joi.string(),
  notes: Joi.string().allow(""),
  dueAt: Joi.alternatives().try(Joi.date(), Joi.string(), Joi.allow(null)),
}).unknown(true);

export const recordVitalsSchema = Joi.object({
  patientId: Joi.string().required(),
  temperature: Joi.alternatives().try(Joi.number(), Joi.string()),
  pulse: Joi.alternatives().try(Joi.number(), Joi.string()),
  respirationRate: Joi.alternatives().try(Joi.number(), Joi.string()),
  systolicBp: Joi.alternatives().try(Joi.number(), Joi.string()),
  diastolicBp: Joi.alternatives().try(Joi.number(), Joi.string()),
  spo2: Joi.alternatives().try(Joi.number(), Joi.string()),
  bloodSugar: Joi.alternatives().try(Joi.number(), Joi.string()),
  weight: Joi.alternatives().try(Joi.number(), Joi.string()),
  notes: Joi.string().allow(""),
  recordedAt: Joi.alternatives().try(Joi.date(), Joi.string()),
}).unknown(true);

export const createNursingNoteSchema = Joi.object({
  patientId: Joi.string().required(),
  noteType: Joi.string(),
  content: Joi.string().required(),
}).unknown(true);

export const createHandoverSchema = Joi.object({
  wardId: Joi.string(),
  patientId: Joi.string(),
  toNurseUserId: Joi.string(),
  priority: Joi.string(),
  summary: Joi.string().required(),
}).unknown(true);
