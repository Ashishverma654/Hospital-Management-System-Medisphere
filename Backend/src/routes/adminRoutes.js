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

// Routes that superreceptionist can also use (to create/track receptionists)
router.post("/create-user", authorizeRoles("superadmin", "admin", "superreceptionist"), createStaffUser);
router.get("/history", authorizeRoles("superadmin", "admin", "superreceptionist"), getCreationHistory);
router.get("/creatable-roles", authorizeRoles("superadmin", "admin", "superreceptionist"), getCreatableRoles);

export default router;

