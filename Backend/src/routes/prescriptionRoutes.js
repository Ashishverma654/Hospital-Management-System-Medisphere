import express from "express";
import {
  createPrescription,
  downloadPrescriptionPDF,
  getPatientPrescriptions,
  getPrescriptionByAppointment
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

router.get("/appointment/:appointmentId", verifyAccessToken, authorizeRoles("doctor", "admin"), getPrescriptionByAppointment);

router.get("/pdf/:id", verifyAccessToken, authorizeRoles("doctor", "patient", "admin"), downloadPrescriptionPDF);


export default router;
