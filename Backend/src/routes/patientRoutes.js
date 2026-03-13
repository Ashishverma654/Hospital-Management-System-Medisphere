import express from "express";
import {
  createPatient,
  getAdminPatientBoard,
  getAdminPatientById,
  getAdminPatients,
  getAllPatients,
  getPatientById,
  updateAdminPatient,
  updatePatient,
} from "../controllers/patientController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { patientSchema } from "../validations/patientValidation.js";

const router = express.Router();

router.post("/", verifyAccessToken, authorizeRoles("admin", "subadmin", "receptionist"), validate(patientSchema), createPatient);

router.get("/", verifyAccessToken, authorizeRoles("admin", "subadmin", "doctor", "receptionist"), getAllPatients);

router.get("/admin/list", verifyAccessToken, authorizeRoles("superadmin", "admin"), getAdminPatients);
router.get("/admin/board", verifyAccessToken, authorizeRoles("superadmin", "admin"), getAdminPatientBoard);
router.get("/admin/:id", verifyAccessToken, authorizeRoles("superadmin", "admin"), getAdminPatientById);
router.put("/admin/:id", verifyAccessToken, authorizeRoles("superadmin", "admin"), updateAdminPatient);

router.get("/:id", verifyAccessToken, authorizeRoles("admin", "subadmin", "doctor", "receptionist", "patient"), getPatientById);

router.put("/:id", verifyAccessToken, authorizeRoles("admin", "subadmin", "receptionist"), updatePatient);

export default router;
