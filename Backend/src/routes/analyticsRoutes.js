import express from "express";
import {
  getRevenueAnalytics,
  getPatientFlowAnalytics,
  getDoctorAnalytics,
  getBedOccupancyAnalytics,
  getLabAnalytics,
  getPharmacyAnalytics,
} from "../controllers/analyticsController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/revenue", verifyAccessToken, authorizeRoles("admin", "superadmin"), getRevenueAnalytics);
router.get("/patient-flow", verifyAccessToken, authorizeRoles("admin", "superadmin"), getPatientFlowAnalytics);
router.get("/doctor", verifyAccessToken, authorizeRoles("admin", "superadmin"), getDoctorAnalytics);
router.get("/bed-occupancy", verifyAccessToken, authorizeRoles("admin", "superadmin"), getBedOccupancyAnalytics);
router.get("/lab", verifyAccessToken, authorizeRoles("admin", "superadmin"), getLabAnalytics);
router.get("/pharmacy", verifyAccessToken, authorizeRoles("admin", "superadmin"), getPharmacyAnalytics);

export default router;
