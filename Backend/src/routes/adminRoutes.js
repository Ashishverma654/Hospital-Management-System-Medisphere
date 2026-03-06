import express from "express";
import { getDashboardStats } from "../controllers/adminController.js";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  verifyAccessToken,
  authorizeRoles("admin"),
  getDashboardStats,
);

export default router;
