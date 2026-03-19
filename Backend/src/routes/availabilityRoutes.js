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
import validate from "../middlewares/validate.js";
import { createAvailabilitySchema, updateAvailabilitySchema } from "../validations/availabilityAwardFileValidation.js";

const router = express.Router();

router.post(
  "/",
  verifyAccessToken,
  authorizeRoles("admin", "superadmin"),
  validate(createAvailabilitySchema),
  createAvailability,
);

router.put(
  "/:id",
  verifyAccessToken,
  authorizeRoles("admin", "superadmin"),
  validate(updateAvailabilitySchema),
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
