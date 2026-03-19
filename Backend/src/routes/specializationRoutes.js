import express from "express";
import {
  createSpecialization,
  getAllSpecializations,
  toggleSpecializationStatus,
  updateSpecialization,
} from "../controllers/specializationController.js";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { createSpecializationSchema, updateSpecializationSchema } from "../validations/adminMasterValidation.js";

const router = express.Router();

router.get("/", verifyAccessToken, authorizeRoles("superadmin", "admin"), getAllSpecializations);
router.post("/", verifyAccessToken, authorizeRoles("superadmin", "admin"), validate(createSpecializationSchema), createSpecialization);
router.put("/:id", verifyAccessToken, authorizeRoles("superadmin", "admin"), validate(updateSpecializationSchema), updateSpecialization);
router.put("/:id/toggle-active", verifyAccessToken, authorizeRoles("superadmin", "admin"), toggleSpecializationStatus);

export default router;
