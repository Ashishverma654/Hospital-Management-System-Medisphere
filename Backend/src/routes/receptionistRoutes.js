import express from "express";
import { createReceptionistStaff } from "../controllers/receptionistController.js";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Only superreceptionist can create receptionists (hierarchy enforced here)
router.post(
  "/create",
  verifyAccessToken,
  authorizeRoles("superreceptionist", "superadmin", "admin"),
  createReceptionistStaff
);

export default router;
