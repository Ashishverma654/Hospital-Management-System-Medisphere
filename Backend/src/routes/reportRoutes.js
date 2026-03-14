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
const router = express.Router();

router.post(
  "/",
  verifyAccessToken,
  authorizeRoles("doctor"),
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
