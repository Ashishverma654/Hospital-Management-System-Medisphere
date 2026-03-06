import express from "express";
import {
  createAvailability,
  getAvailabilityByDoctorId,
} from "../controllers/availabilityController.js";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  verifyAccessToken,
  authorizeRoles("admin"),
  createAvailability,
);

router.get("/:doctorId", getAvailabilityByDoctorId);

export default router;
