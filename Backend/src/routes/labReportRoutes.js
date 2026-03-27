import express from "express";

import { uploadLabReport, getPatientReports, getReportByPatientId, downloadLabReportPdf } from "../controllers/labReportController.js";

import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

import upload from "../middlewares/uploadMiddleware.js";
import validate from "../middlewares/validate.js";
import { uploadLabReportSchema } from "../validations/labValidation.js";

const router = express.Router();

router.post(
  "/upload",
  verifyAccessToken,
  authorizeRoles("patient"),
  validate(uploadLabReportSchema),
  upload.single("reportFile"),
  uploadLabReport
);

router.get("/my", verifyAccessToken, authorizeRoles("patient"), getPatientReports);

router.get(
  "/:id/pdf",
  verifyAccessToken,
  authorizeRoles(
    "patient",
    "superadmin",
    "admin",
    "subadmin",
    "doctor",
    "nurse",
    "pharmacist",
    "receptionist",
    "labTechnician"
  ),
  downloadLabReportPdf
);

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
