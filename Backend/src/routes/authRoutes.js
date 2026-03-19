import express from "express";
import { 
  registerPatient,
  register, 
  login, 
  loginPatient,
  loginEmployee,
  loginWithPhonePin, 
  sendLoginOtp, 
  loginWithOtp,
  findAccountForHelp,
  forgotPassword,
  verifyResetOtp,
  resetPassword
} from "../controllers/authController.js";
import validate from "../middlewares/validate.js";
import {
  registerSchema,
  loginSchema,
  loginPatientSchema,
  loginEmployeeSchema,
  phonePinSchema,
  sendLoginOtpSchema,
  loginWithOtpSchema,
  findAccountSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from "../validations/authValidation.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/patient/register", validate(registerSchema), registerPatient);
router.post("/login", validate(loginSchema), login); // Legacy / Email & Password
router.post("/patient/login", validate(loginPatientSchema), loginPatient);
router.post("/employee/login", validate(loginEmployeeSchema), loginEmployee);
router.post("/login/phone", validate(phonePinSchema), loginWithPhonePin);
router.post("/login/otp/send", validate(sendLoginOtpSchema), sendLoginOtp);
router.post("/login/otp/verify", validate(loginWithOtpSchema), loginWithOtp);
router.post("/account/find", validate(findAccountSchema), findAccountForHelp);
router.post("/password/forgot", validate(forgotPasswordSchema), forgotPassword);
router.post("/password/verify-otp", validate(verifyResetOtpSchema), verifyResetOtp);
router.post("/password/reset", validate(resetPasswordSchema), resetPassword);

export default router;
