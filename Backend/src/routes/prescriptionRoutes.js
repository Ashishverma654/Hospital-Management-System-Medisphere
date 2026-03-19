import express from "express";
import {
  createPrescription,
  downloadPrescriptionPDF,
  getPatientPrescriptions,
  getMyPrescriptions,
  getPrescriptionByAppointment,
  getPrescriptionByPatient
} from "../controllers/prescriptionController.js";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { createPrescriptionSchema } from "../validations/nurseAssignmentPrescriptionNotificationValidation.js";

const router = express.Router();

router.post(
  "/",
  verifyAccessToken,
  authorizeRoles("doctor"),
  validate(createPrescriptionSchema),
  createPrescription,
);

router.get(
  "/my",
  verifyAccessToken,
  authorizeRoles("patient", "doctor"),
  getMyPrescriptions,
);

router.get("/appointment/:appointmentId", verifyAccessToken, authorizeRoles("doctor", "admin"), getPrescriptionByAppointment);

router.get("/patient/:patientId", verifyAccessToken, authorizeRoles("doctor", "admin", "receptionist"), getPrescriptionByPatient);

router.get("/pdf/:id", verifyAccessToken, authorizeRoles("doctor", "patient", "admin"), downloadPrescriptionPDF);


export default router;
