import express from "express";
import { createReceptionistStaff } from "../controllers/receptionistController.js";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";
import { requireSuperReceptionist } from "../middlewares/requireSuperReceptionist.js";

const router = express.Router();

router.post(
  "/create",
  verifyAccessToken,
  authorizeRoles("receptionist"),
  requireSuperReceptionist,
  createReceptionistStaff
);

export default router;
