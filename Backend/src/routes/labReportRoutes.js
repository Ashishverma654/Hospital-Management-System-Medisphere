import express from "express";

import { uploadLabReport, getPatientReports, getReportByPatientId } from "../controllers/labReportController.js";

import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

import upload from "../middlewares/uploadMiddleware.js";
import validate from "../middlewares/validate.js";
import { uploadLabReportSchema } from "../validations/labValidation.js";

const router = express.Router();

router.post(
  "/upload",
  verifyAccessToken,
  authorizeRoles("admin", "doctor", "receptionist", "patient", "labTechnician"),
  validate(uploadLabReportSchema),
  upload.single("reportFile"),
  uploadLabReport
);

router.get("/my", verifyAccessToken, authorizeRoles("patient"), getPatientReports);

router.get(
  "/patient/:patientId",
  verifyAccessToken,
  authorizeRoles(
    "superadmin",
    "admin",
    "subadmin",
    "doctor",
    "nurse",
    "pharmacist",
    "receptionist",
    "labTechnician"
  ),
  getReportByPatientId
);

export default router;
