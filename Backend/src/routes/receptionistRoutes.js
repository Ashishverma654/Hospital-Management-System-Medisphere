import express from "express";
import {
  createReceptionistStaff,
  getReceptionBookingOptions,
  getReceptionistDashboard,
  registerPatientAtDesk,
  searchPatientsForDesk,
} from "../controllers/receptionistController.js";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Receptionists can be created only through approved management roles.
router.post(
  "/create",
  verifyAccessToken,
  authorizeRoles("superadmin", "admin", "subadmin"),
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
  registerPatientAtDesk
);

router.get(
  "/patients/search",
  verifyAccessToken,
  authorizeRoles("receptionist", "admin", "superadmin"),
  searchPatientsForDesk
);

router.get(
  "/booking-options",
  verifyAccessToken,
  authorizeRoles("receptionist", "admin", "superadmin"),
  getReceptionBookingOptions
);

export default router;
