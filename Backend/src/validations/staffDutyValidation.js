import Joi from "joi";

export const startDutySchema = Joi.object({
  userId: Joi.string().allow(""),
  shiftType: Joi.string().allow(""),
}).unknown(true);

export const endDutySchema = Joi.object({
  userId: Joi.string().allow(""),
}).unknown(true);

export const leaveDutySchema = Joi.object({
  userId: Joi.string().allow(""),
  type: Joi.string().valid("leave", "holiday").required(),
  shiftType: Joi.string().allow(""),
}).unknown(true);

export const statsQuerySchema = Joi.object({
  userId: Joi.string().allow(""),
}).unknown(true);
