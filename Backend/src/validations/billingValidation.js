import Joi from "joi";

export const createInvoiceSchema = Joi.object({
  patientId: Joi.string(),
  appointmentId: Joi.string(),
  labOrderId: Joi.string(),
  pharmacyOrderId: Joi.string(),
  bedId: Joi.string(),
  wardId: Joi.string(),
  billType: Joi.string(),
  paymentStatus: Joi.string(),
  paymentMethod: Joi.string(),
  notes: Joi.string().allow(""),
  lineItems: Joi.array(),
  daysConsulted: Joi.alternatives().try(Joi.number(), Joi.string()),
  medicinesBreakdown: Joi.array(),
  labReportsBreakdown: Joi.array(),
  doctorFee: Joi.alternatives().try(Joi.number(), Joi.string()),
  labCharges: Joi.alternatives().try(Joi.number(), Joi.string()),
  medicineCharges: Joi.alternatives().try(Joi.number(), Joi.string()),
  otherCharges: Joi.alternatives().try(Joi.number(), Joi.string()),
  discount: Joi.alternatives().try(Joi.number(), Joi.string()),
  insuranceCoverage: Joi.alternatives().try(Joi.number(), Joi.string()),
}).or("patientId", "appointmentId", "labOrderId", "pharmacyOrderId", "bedId").unknown(true);

export const payInvoiceSchema = Joi.object({
  paymentMethod: Joi.string(),
  amount: Joi.alternatives().try(Joi.number(), Joi.string()),
  notes: Joi.string().allow(""),
}).unknown(true);
