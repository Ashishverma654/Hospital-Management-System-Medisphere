import express from "express";
import {
  getDashboardStats,
  createStaffUser,
  getAllUsers,
  getCreationHistory,
  getAuditHistory,
  deactivateUser,
  getCreatableRoles,
  getHospitalSettings,
  upsertHospitalSettings,
} from "../controllers/adminController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyAccessToken);

// Routes accessible by superadmin & admin only
router.get("/dashboard", authorizeRoles("superadmin", "admin"), getDashboardStats);
router.get("/users", authorizeRoles("superadmin", "admin", "subadmin"), getAllUsers);
router.put("/users/:id/toggle-active", authorizeRoles("superadmin", "admin", "subadmin"), deactivateUser);
router.get("/audit", authorizeRoles("superadmin", "admin", "subadmin"), getAuditHistory);
router.get("/settings", authorizeRoles("superadmin", "admin"), getHospitalSettings);
router.put("/settings", authorizeRoles("superadmin", "admin"), upsertHospitalSettings);

// Hierarchy-aware staff creation foundations
router.post("/create-user", authorizeRoles("superadmin", "admin", "subadmin"), createStaffUser);
router.get("/history", authorizeRoles("superadmin", "admin", "subadmin"), getCreationHistory);
router.get("/creatable-roles", authorizeRoles("superadmin", "admin", "subadmin"), getCreatableRoles);

export default router;
