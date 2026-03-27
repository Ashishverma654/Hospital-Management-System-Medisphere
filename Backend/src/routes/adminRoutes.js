import express from "express";
import {
  getDashboardStats,
  getSubadminDashboard,
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
import validate from "../middlewares/validate.js";
import { createStaffUserSchema, upsertHospitalSettingsSchema } from "../validations/adminMasterValidation.js";

const router = express.Router();

router.use(verifyAccessToken);

// Routes accessible by superadmin & admin only
router.get("/dashboard", authorizeRoles("superadmin", "admin"), getDashboardStats);
router.get("/subadmin-dashboard", authorizeRoles("superadmin", "admin", "subadmin"), getSubadminDashboard);
router.get("/users", authorizeRoles("superadmin", "admin", "subadmin"), getAllUsers);
router.put("/users/:id/toggle-active", authorizeRoles("superadmin", "admin", "subadmin"), deactivateUser);
router.get("/audit", authorizeRoles("superadmin", "admin", "subadmin"), getAuditHistory);
router.get("/settings", authorizeRoles("superadmin", "admin"), getHospitalSettings);
router.put("/settings", authorizeRoles("superadmin", "admin"), validate(upsertHospitalSettingsSchema), upsertHospitalSettings);

// Hierarchy-aware staff creation foundations
router.post("/create-user", authorizeRoles("superadmin", "admin", "subadmin"), validate(createStaffUserSchema), createStaffUser);
router.get("/history", authorizeRoles("superadmin", "admin", "subadmin"), getCreationHistory);
router.get("/creatable-roles", authorizeRoles("superadmin", "admin", "subadmin"), getCreatableRoles);

export default router;
