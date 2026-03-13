import express from "express";
import {
  createEscalationNote,
  createHandoverNote,
  createNursingNote,
  createNursingTask,
  getAssignments,
  getAssignedPatients,
  getDashboardStats,
  getEscalationNotes,
  getHandoverNotes,
  getMyProfile,
  getNursingNotes,
  getNursingTasks,
  getVitalsHistory,
  getWardOverview,
  recordVitals,
  updateMyProfile,
  updateNursingTask,
} from "../controllers/nurseController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyAccessToken);
router.use(authorizeRoles("nurse"));

router.get("/dashboard", getDashboardStats);
router.get("/assignments", getAssignments);
router.get("/patients", getAssignedPatients);
router.get("/ward-board", getWardOverview);
router.get("/tasks", getNursingTasks);
router.post("/tasks", createNursingTask);
router.patch("/tasks/:id", updateNursingTask);
router.get("/vitals", getVitalsHistory);
router.get("/vitals/:patientId/history", getVitalsHistory);
router.post("/vitals", recordVitals);
router.get("/notes", getNursingNotes);
router.post("/notes", createNursingNote);
router.get("/handover", getHandoverNotes);
router.post("/handover", createHandoverNote);
router.get("/escalations", getEscalationNotes);
router.post("/escalations", createEscalationNote);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);

export default router;
