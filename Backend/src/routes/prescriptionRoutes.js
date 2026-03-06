import express from "express";
import {
  createPrescription,
  getPatientPrescriptions,
} from "../controllers/prescriptionController.js";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  verifyAccessToken,
  authorizeRoles("doctor"),
  createPrescription,
);

router.get(
  "/my",
  verifyAccessToken,
  authorizeRoles("patient"),
  getPatientPrescriptions,
);

export default router;
