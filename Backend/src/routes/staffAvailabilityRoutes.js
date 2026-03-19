import express from "express";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import {
  getStaffAvailability,
  getStaffAvailabilitySummary,
} from "../controllers/staffAvailabilityController.js";

const router = express.Router();

router.use(verifyAccessToken, authorizeRoles("superadmin", "admin", "subadmin"));

router.get("/", getStaffAvailability);
router.get("/summary", getStaffAvailabilitySummary);

export default router;
