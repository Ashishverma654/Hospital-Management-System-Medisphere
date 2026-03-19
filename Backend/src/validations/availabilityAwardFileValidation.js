import Joi from "joi";

export const createAvailabilitySchema = Joi.object({
  doctorId: Joi.string().required(),
  dayOfWeek: Joi.string().required(),
  startTime: Joi.string().required(),
  endTime: Joi.string().required(),
  slotDuration: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
}).unknown(true);

export const updateAvailabilitySchema = Joi.object({
  dayOfWeek: Joi.string(),
  startTime: Joi.string(),
  endTime: Joi.string(),
  slotDuration: Joi.alternatives().try(Joi.number(), Joi.string()),
}).unknown(true);

export const createAwardSchema = Joi.object({
  type: Joi.string().required(),
  doctorId: Joi.string(),
  title: Joi.string().required(),
  category: Joi.string().required(),
  organization: Joi.string().required(),
  issuedByType: Joi.string().required(),
  awardDate: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
  location: Joi.string().allow(""),
  description: Joi.string().required(),
  certificateUrl: Joi.string().allow(""),
  isPublic: Joi.alternatives().try(Joi.boolean(), Joi.string()),
  featured: Joi.alternatives().try(Joi.boolean(), Joi.string()),
  displayOrder: Joi.alternatives().try(Joi.number(), Joi.string()),
  status: Joi.string().allow(""),
  image: Joi.string().allow(""),
}).unknown(true);

export const updateAwardSchema = Joi.object({
  type: Joi.string(),
  doctorId: Joi.string(),
  title: Joi.string(),
  category: Joi.string(),
  organization: Joi.string(),
  issuedByType: Joi.string(),
  awardDate: Joi.alternatives().try(Joi.date(), Joi.string()),
  location: Joi.string().allow(""),
  description: Joi.string(),
  certificateUrl: Joi.string().allow(""),
  isPublic: Joi.alternatives().try(Joi.boolean(), Joi.string()),
  featured: Joi.alternatives().try(Joi.boolean(), Joi.string()),
  displayOrder: Joi.alternatives().try(Joi.number(), Joi.string()),
  status: Joi.string().allow(""),
  image: Joi.string().allow(""),
}).unknown(true);

export const fileUploadSchema = Joi.object({}).unknown(true);
