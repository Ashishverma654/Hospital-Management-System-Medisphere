import express from "express";
import {
  listAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/nurseAssignmentController.js";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { createNurseAssignmentSchema, updateNurseAssignmentSchema } from "../validations/nurseAssignmentPrescriptionNotificationValidation.js";

const router = express.Router();

router.use(verifyAccessToken, authorizeRoles("superadmin", "admin", "subadmin"));

router.get("/", listAssignments);
router.get("/:id", getAssignmentById);
router.post("/", validate(createNurseAssignmentSchema), createAssignment);
router.put("/:id", validate(updateNurseAssignmentSchema), updateAssignment);
router.delete("/:id", deleteAssignment);

export default router;
