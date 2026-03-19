import express from "express";
import {
  createWard,
  getWardDetail,
  getWardHistory,
  getWardOccupancySummary,
  listWards,
  toggleWardActive,
  updateWard,
} from "../controllers/wardController.js";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { createWardSchema, updateWardSchema, emptyBodySchema } from "../validations/reportShiftUserWardValidation.js";

const router = express.Router();

router.use(verifyAccessToken);
router.use(authorizeRoles("superadmin", "admin", "subadmin"));

router.get("/", listWards);
router.get("/summary", getWardOccupancySummary);
router.get("/:id", getWardDetail);
router.get("/:id/history", getWardHistory);
router.post("/", validate(createWardSchema), createWard);
router.put("/:id", validate(updateWardSchema), updateWard);
router.put("/:id/toggle-active", validate(emptyBodySchema), toggleWardActive);

export default router;
