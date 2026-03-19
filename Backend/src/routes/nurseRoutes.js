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
  getRoster,
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
import validate from "../middlewares/validate.js";
import {
  createNursingTaskSchema,
  updateNursingTaskSchema,
  recordVitalsSchema,
  createNursingNoteSchema,
  createHandoverSchema,
} from "../validations/nurseValidation.js";

const router = express.Router();

router.use(verifyAccessToken);
router.use(authorizeRoles("nurse"));

router.get("/dashboard", getDashboardStats);
router.get("/assignments", getAssignments);
router.get("/patients", getAssignedPatients);
router.get("/ward-board", getWardOverview);
router.get("/tasks", getNursingTasks);
router.post("/tasks", validate(createNursingTaskSchema), createNursingTask);
router.patch("/tasks/:id", validate(updateNursingTaskSchema), updateNursingTask);
router.get("/vitals", getVitalsHistory);
router.get("/vitals/:patientId/history", getVitalsHistory);
router.post("/vitals", validate(recordVitalsSchema), recordVitals);
router.get("/notes", getNursingNotes);
router.post("/notes", validate(createNursingNoteSchema), createNursingNote);
router.get("/handover", getHandoverNotes);
router.post("/handover", validate(createHandoverSchema), createHandoverNote);
router.get("/roster", getRoster);
router.get("/escalations", getEscalationNotes);
router.post("/escalations", validate(createNursingNoteSchema), createEscalationNote);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);

export default router;
