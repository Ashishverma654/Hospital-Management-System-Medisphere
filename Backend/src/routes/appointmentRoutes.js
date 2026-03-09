import express from "express";
import { bookAppointment, getAllAppointments, cancelAppointment, getTodayAppointments, getDoctorAppointments, completeAppointment, getPatientHistory } from "../controllers/appointmentController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyAccessToken, bookAppointment);

router.get("/", verifyAccessToken, authorizeRoles("patient", "receptionist", "admin"), getAllAppointments);

router.put("/:id/cancel", verifyAccessToken, authorizeRoles("patient", "receptionist", "admin"), cancelAppointment);

router.get("/doctor/today", verifyAccessToken, authorizeRoles("doctor"), getTodayAppointments);

router.get("/doctor/all", verifyAccessToken, authorizeRoles("doctor"), getDoctorAppointments);

router.put("/:id/complete", verifyAccessToken, authorizeRoles("doctor"), completeAppointment);

router.get("/patient-history/:patientId", verifyAccessToken, authorizeRoles("doctor"), getPatientHistory);

export default router;
