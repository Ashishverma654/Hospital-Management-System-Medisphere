import express from "express";
import { listAdmissions, getAdmissionById, createAdmission } from "../controllers/admissionController.js";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { createAdmissionSchema } from "../validations/admissionBedValidation.js";

const router = express.Router();

router.use(verifyAccessToken);

router.get(
  "/",
  authorizeRoles("superadmin", "admin", "subadmin", "doctor", "nurse", "receptionist"),
  listAdmissions
);
router.post(
  "/",
  authorizeRoles("superadmin", "admin", "subadmin", "receptionist"),
  validate(createAdmissionSchema),
  createAdmission
);
router.get(
  "/:id",
  authorizeRoles("superadmin", "admin", "subadmin", "doctor", "nurse", "receptionist"),
  getAdmissionById
);

export default router;
