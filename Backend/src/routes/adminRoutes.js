import express from "express";
import { createStaffUser, getDashboardStats } from "../controllers/adminController.js";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin.js";

const router = express.Router();

router.get(
  "/dashboard",
  verifyAccessToken,
  authorizeRoles("admin"),
  getDashboardStats,
);

router.post(
  "/users",
  verifyAccessToken,
  authorizeRoles("admin"),
  requireSuperAdmin,
  createStaffUser,
);

export default router;
