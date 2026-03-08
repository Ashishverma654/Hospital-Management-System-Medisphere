import express from "express";
import { createPatient, getAllPatients, getPatientById, updatePatient } from "../controllers/patientController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { patientSchema } from "../validations/patientValidation.js";

const router = express.Router();

router.post("/", verifyAccessToken, authorizeRoles("admin", "receptionist"), validate(patientSchema), createPatient);

router.get("/", verifyAccessToken, authorizeRoles("admin", "doctor", "receptionist"), getAllPatients);

router.get("/:id", verifyAccessToken, authorizeRoles("admin", "doctor", "receptionist", "patient"), getPatientById);

router.put("/:id", verifyAccessToken, authorizeRoles("admin", "receptionist"), updatePatient);

export default router;