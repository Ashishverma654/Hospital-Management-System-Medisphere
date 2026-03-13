import express from "express";
import {
  createSpecialization,
  getAllSpecializations,
  toggleSpecializationStatus,
  updateSpecialization,
} from "../controllers/specializationController.js";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyAccessToken, authorizeRoles("superadmin", "admin"), getAllSpecializations);
router.post("/", verifyAccessToken, authorizeRoles("superadmin", "admin"), createSpecialization);
router.put("/:id", verifyAccessToken, authorizeRoles("superadmin", "admin"), updateSpecialization);
router.put("/:id/toggle-active", verifyAccessToken, authorizeRoles("superadmin", "admin"), toggleSpecializationStatus);

export default router;
