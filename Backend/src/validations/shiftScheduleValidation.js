import Joi from "joi";

export const createShiftScheduleSchema = Joi.object({
  userId: Joi.string().required(),
  role: Joi.string().allow(""),
  shiftType: Joi.string().valid("morning", "evening", "night").required(),
  startTime: Joi.date().required(),
  endTime: Joi.date().required(),
}).unknown(true);

export const updateShiftScheduleSchema = Joi.object({
  userId: Joi.string().allow(""),
  role: Joi.string().allow(""),
  shiftType: Joi.string().valid("morning", "evening", "night"),
  startTime: Joi.date(),
  endTime: Joi.date(),
}).unknown(true);

export const listShiftScheduleSchema = Joi.object({
  userId: Joi.string().allow(""),
  role: Joi.string().allow(""),
  start: Joi.date(),
  end: Joi.date(),
}).unknown(true);
