import express from "express";
import {
  createAvailability,
  deleteAvailability,
  getAvailabilityByDoctorId,
  updateAvailability,
} from "../controllers/availabilityController.js";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  verifyAccessToken,
  authorizeRoles("admin", "superadmin"),
  createAvailability,
);

router.put(
  "/:id",
  verifyAccessToken,
  authorizeRoles("admin", "superadmin"),
  updateAvailability,
);

router.delete(
  "/:id",
  verifyAccessToken,
  authorizeRoles("admin", "superadmin"),
  deleteAvailability,
);

router.get("/:doctorId", getAvailabilityByDoctorId);

export default router;
