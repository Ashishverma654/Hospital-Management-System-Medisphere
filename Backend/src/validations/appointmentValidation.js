import Joi from "joi";

export const bookAppointmentSchema = Joi.object({
  doctorId: Joi.string().required(),
  date: Joi.string().required(),
  slot: Joi.string().required(),
  patientId: Joi.string(),
  hospitalLocationId: Joi.string(),
  visitType: Joi.string(),
  consultationMode: Joi.string(),
  reasonForVisit: Joi.string().allow(""),
  notes: Joi.string().allow(""),
  priority: Joi.string(),
}).unknown(true);

export const rescheduleAppointmentSchema = Joi.object({
  date: Joi.string().required(),
  slot: Joi.string().required(),
}).unknown(true);

export const cancelAppointmentSchema = Joi.object({
  reason: Joi.string().allow(""),
}).unknown(true);

export const recommendAdmissionSchema = Joi.object({
  admissionRecommended: Joi.boolean(),
  admissionRecommendationNotes: Joi.string().allow(""),
}).unknown(true);
