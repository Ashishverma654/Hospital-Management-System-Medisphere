import express from "express";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { EMPLOYEE_ROLES } from "../constants/roles.js";
import {
  getAllShiftSchedules,
  getMyShiftSchedules,
  createShiftSchedule,
  updateShiftSchedule,
  deleteShiftSchedule,
} from "../controllers/shiftScheduleController.js";
import {
  createShiftScheduleSchema,
  updateShiftScheduleSchema,
  listShiftScheduleSchema,
} from "../validations/shiftScheduleValidation.js";
import { getShiftScheduleHistory } from "../controllers/shiftScheduleController.js";

const router = express.Router();

router.get("/all", verifyAccessToken, authorizeRoles("superadmin", "admin", "subadmin"), validate(listShiftScheduleSchema, { source: "query" }), getAllShiftSchedules);
router.get("/my", verifyAccessToken, authorizeRoles(...EMPLOYEE_ROLES), validate(listShiftScheduleSchema, { source: "query" }), getMyShiftSchedules);
router.post("/create", verifyAccessToken, authorizeRoles("superadmin", "admin", "subadmin"), validate(createShiftScheduleSchema), createShiftSchedule);
router.get("/history", verifyAccessToken, authorizeRoles("superadmin", "admin", "subadmin"), getShiftScheduleHistory);

// Use /schedule/:id to avoid clashing with existing Shift template routes.
router.put("/schedule/:id", verifyAccessToken, authorizeRoles("superadmin", "admin", "subadmin"), validate(updateShiftScheduleSchema), updateShiftSchedule);
router.delete("/schedule/:id", verifyAccessToken, authorizeRoles("superadmin", "admin", "subadmin"), deleteShiftSchedule);

export default router;
