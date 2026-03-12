import express from "express";
import { 
  register, 
  login, 
  loginWithPhonePin, 
  sendLoginOtp, 
  loginWithOtp,
  findAccountForHelp,
  forgotPassword,
  resetPassword
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login); // Legacy / Email & Password
router.post("/login/phone", loginWithPhonePin);
router.post("/login/otp/send", sendLoginOtp);
router.post("/login/otp/verify", loginWithOtp);
router.post("/account/find", findAccountForHelp);
router.post("/password/forgot", forgotPassword);
router.post("/password/reset", resetPassword);

export default router;
