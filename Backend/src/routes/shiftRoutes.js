import express from "express";
import {
  listShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
} from "../controllers/shiftController.js";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { createShiftSchema, updateShiftSchema } from "../validations/reportShiftUserWardValidation.js";

const router = express.Router();

router.use(verifyAccessToken, authorizeRoles("superadmin", "admin", "subadmin"));

router.get("/", listShifts);
router.get("/:id", getShiftById);
router.post("/", validate(createShiftSchema), createShift);
router.put("/:id", validate(updateShiftSchema), updateShift);
router.delete("/:id", deleteShift);

export default router;
