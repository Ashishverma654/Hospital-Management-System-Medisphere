import express from "express";
import {
  createReceptionistStaff,
  getReceptionBookingOptions,
  getReceptionistDashboard,
  getPatientHistoryForDesk,
  registerPatientAtDesk,
  searchPatientsForDesk,
} from "../controllers/receptionistController.js";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { createReceptionistSchema, registerPatientAtDeskSchema } from "../validations/receptionistValidation.js";

const router = express.Router();

// Receptionists can be created only through approved management roles.
router.post(
  "/create",
  verifyAccessToken,
  authorizeRoles("superadmin", "admin", "subadmin"),
  validate(createReceptionistSchema),
  createReceptionistStaff
);

router.get(
  "/dashboard",
  verifyAccessToken,
  authorizeRoles("receptionist", "admin", "superadmin"),
  getReceptionistDashboard
);

router.post(
  "/patients",
  verifyAccessToken,
  authorizeRoles("receptionist", "admin", "superadmin"),
  validate(registerPatientAtDeskSchema),
  registerPatientAtDesk
);

router.get(
  "/patients/search",
  verifyAccessToken,
  authorizeRoles("receptionist", "admin", "superadmin"),
  searchPatientsForDesk
);

router.get(
  "/patients/:patientId/history",
  verifyAccessToken,
  authorizeRoles("receptionist", "admin", "superadmin"),
  getPatientHistoryForDesk
);

router.get(
  "/booking-options",
  verifyAccessToken,
  authorizeRoles("receptionist", "admin", "superadmin"),
  getReceptionBookingOptions
);

export default router;
