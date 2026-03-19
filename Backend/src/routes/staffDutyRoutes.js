import express from "express";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { EMPLOYEE_ROLES } from "../constants/roles.js";
import {
  startDuty,
  endDuty,
  markLeave,
  getStats,
} from "../controllers/staffDutyController.js";
import {
  startDutySchema,
  endDutySchema,
  leaveDutySchema,
  statsQuerySchema,
} from "../validations/staffDutyValidation.js";

const router = express.Router();

router.use(verifyAccessToken, authorizeRoles(...EMPLOYEE_ROLES));

router.post("/start", validate(startDutySchema), startDuty);
router.post("/end", validate(endDutySchema), endDuty);
router.post("/leave", validate(leaveDutySchema), markLeave);
router.get("/stats", validate(statsQuerySchema, { source: "query" }), getStats);

export default router;
