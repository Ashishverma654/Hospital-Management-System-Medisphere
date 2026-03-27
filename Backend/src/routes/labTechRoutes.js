import express from "express";
import {
  getDashboardStats,
  getMyProfile,
  updateMyProfile,
  getPendingReports,
  listWorkflowOrders,
  getWorkflowOrderById,
  scheduleSampleCollection,
  scheduleReportPickup,
  markAccessioned,
  rejectLabOrder,
  markSampleCollected,
  markInProcessing,
  markReportReady,
  releaseReportToPortal,
} from "../controllers/labTechController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyAccessToken);
router.use(authorizeRoles("labTechnician"));

router.get("/dashboard", getDashboardStats);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.get("/pending-reports", getPendingReports);
router.get("/orders", listWorkflowOrders);
router.get("/orders/:id", getWorkflowOrderById);
router.patch("/orders/:id/sample-schedule", scheduleSampleCollection);
router.patch("/orders/:id/report-pickup", scheduleReportPickup);
router.patch("/orders/:id/accession", markAccessioned);
router.patch("/orders/:id/reject", rejectLabOrder);
router.patch("/orders/:id/sample-collected", markSampleCollected);
router.patch("/orders/:id/processing", markInProcessing);
router.patch("/orders/:id/report-ready", markReportReady);
router.patch("/orders/:id/release", releaseReportToPortal);

export default router;
