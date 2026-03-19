import express from "express";
import {
  uploadReport,
  getPatientReports,
  getMyReports,
} from "../controllers/reportController.js";
import upload from "../middlewares/uploadMiddleware.js";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { uploadReportSchema } from "../validations/reportShiftUserWardValidation.js";
const router = express.Router();

router.post(
  "/",
  verifyAccessToken,
  authorizeRoles("doctor"),
  validate(uploadReportSchema),
  upload.single("report"),
  uploadReport,
);
router.get(
  "/my",
  verifyAccessToken,
  authorizeRoles("patient", "doctor"),
  getMyReports,
);

export default router;
