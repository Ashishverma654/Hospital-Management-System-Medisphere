import Joi from "joi";

export const emptyBodySchema = Joi.object({}).unknown(true);

export const createNurseAssignmentSchema = Joi.object({
  nurseUserId: Joi.string().required(),
  wardId: Joi.string().required(),
  shiftId: Joi.string().required(),
  patientId: Joi.string(),
  assignmentStart: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
  assignmentEnd: Joi.alternatives().try(Joi.date(), Joi.string()),
  status: Joi.string(),
}).unknown(true);

export const updateNurseAssignmentSchema = Joi.object({
  nurseUserId: Joi.string(),
  wardId: Joi.string(),
  shiftId: Joi.string(),
  patientId: Joi.string(),
  assignmentStart: Joi.alternatives().try(Joi.date(), Joi.string()),
  assignmentEnd: Joi.alternatives().try(Joi.date(), Joi.string()),
  status: Joi.string(),
}).unknown(true);

export const createPrescriptionSchema = Joi.object({
  appointmentId: Joi.string().required(),
  diagnosis: Joi.string().allow(""),
  clinicalNotes: Joi.string().allow(""),
  advice: Joi.string().allow(""),
  medicines: Joi.alternatives().try(Joi.array(), Joi.string()),
  notes: Joi.string().allow(""),
  followUpDate: Joi.alternatives().try(Joi.date(), Joi.string()),
  revisitRecommended: Joi.boolean(),
  admissionRecommended: Joi.boolean(),
  admissionRecommendationNotes: Joi.string().allow(""),
  status: Joi.string(),
}).unknown(true);
