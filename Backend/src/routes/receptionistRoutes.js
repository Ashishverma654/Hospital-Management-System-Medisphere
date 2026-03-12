import express from "express";
import { createReceptionistStaff } from "../controllers/receptionistController.js";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Receptionists can be created only through approved management roles.
router.post(
  "/create",
  verifyAccessToken,
  authorizeRoles("superadmin", "admin", "subadmin"),
  createReceptionistStaff
);

export default router;
