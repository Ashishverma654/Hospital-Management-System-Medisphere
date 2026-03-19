import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6),
  pin: Joi.string().pattern(/^\d{4}$/),
  role: Joi.string(),
  phone: Joi.string().pattern(/^\d{10}$/),
  dob: Joi.date().iso(),
}).or("password", "pin").unknown(true);

export const loginSchema = Joi.object({
  email: Joi.string().trim().required(),
  password: Joi.string().required(),
}).unknown(true);

export const loginPatientSchema = Joi.object({
  email: Joi.string().trim().required(),
  password: Joi.string().required(),
}).unknown(true);

export const loginEmployeeSchema = Joi.object({
  identifier: Joi.string().trim(),
  email: Joi.string().trim(),
  password: Joi.string().required(),
  role: Joi.string().trim().required(),
}).or("identifier", "email").unknown(true);

export const phonePinSchema = Joi.object({
  phone: Joi.string().pattern(/^\d{10}$/).required(),
  pin: Joi.string().pattern(/^\d{4}$/).required(),
}).unknown(true);

export const sendLoginOtpSchema = Joi.object({
  email: Joi.string().trim().required(),
}).unknown(true);

export const loginWithOtpSchema = Joi.object({
  email: Joi.string().trim().required(),
  otp: Joi.string().trim().required(),
}).unknown(true);

export const findAccountSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  dob: Joi.date().iso().required(),
}).unknown(true);

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
}).unknown(true);

export const verifyResetOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().trim().required(),
}).unknown(true);

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().trim().required(),
  newPassword: Joi.string().min(6),
  newPin: Joi.string().pattern(/^\d{4}$/),
}).unknown(true);
