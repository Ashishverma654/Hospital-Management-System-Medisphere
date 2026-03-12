import express from "express";
import {
  getDashboardStats,
  createStaffUser,
  getAllUsers,
  getCreationHistory,
  deactivateUser,
  getCreatableRoles,
} from "../controllers/adminController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyAccessToken);

// Routes accessible by superadmin & admin only
router.get("/dashboard", authorizeRoles("superadmin", "admin"), getDashboardStats);
router.get("/users", authorizeRoles("superadmin", "admin"), getAllUsers);
router.put("/users/:id/toggle-active", authorizeRoles("superadmin", "admin"), deactivateUser);

// Hierarchy-aware staff creation foundations
router.post("/create-user", authorizeRoles("superadmin", "admin", "subadmin"), createStaffUser);
router.get("/history", authorizeRoles("superadmin", "admin", "subadmin"), getCreationHistory);
router.get("/creatable-roles", authorizeRoles("superadmin", "admin", "subadmin"), getCreatableRoles);

export default router;
