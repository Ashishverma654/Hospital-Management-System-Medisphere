import express from "express";
import {
  bookAppointment,
  getAllAppointments,
  cancelAppointment,
  getTodayAppointments,
  getDoctorAppointments,
  completeAppointment,
  getPatientHistory,
  getReceptionQueue,
  markAppointmentArrived,
  rescheduleAppointment,
  startConsultation,
  getDoctorTodayDetailed,
  getPatientSummary,
} from "../controllers/appointmentController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyAccessToken, authorizeRoles("patient", "receptionist", "admin", "superadmin"), bookAppointment);

router.get("/", verifyAccessToken, authorizeRoles("patient", "receptionist", "admin", "superadmin"), getAllAppointments);
router.get("/queue/today", verifyAccessToken, authorizeRoles("receptionist", "admin", "superadmin"), getReceptionQueue);

router.put("/:id/cancel", verifyAccessToken, authorizeRoles("patient", "receptionist", "admin", "superadmin"), cancelAppointment);
router.put("/:id/arrive", verifyAccessToken, authorizeRoles("receptionist", "admin", "superadmin"), markAppointmentArrived);
router.put("/:id/reschedule", verifyAccessToken, authorizeRoles("receptionist", "admin", "superadmin"), rescheduleAppointment);

// Doctor workflow routes
router.post("/:appointmentId/start-consultation", verifyAccessToken, authorizeRoles("doctor"), startConsultation);
router.get("/doctor/today", verifyAccessToken, authorizeRoles("doctor"), getDoctorTodayDetailed);
router.get("/doctor/all", verifyAccessToken, authorizeRoles("doctor"), getDoctorAppointments);

router.put("/:id/complete", verifyAccessToken, authorizeRoles("doctor"), completeAppointment);

// Patient summary for doctor consultation
router.get("/patient/:patientId/summary", verifyAccessToken, authorizeRoles("doctor", "admin", "superadmin"), getPatientSummary);

router.get("/patient-history/:patientId", verifyAccessToken, authorizeRoles("doctor"), getPatientHistory);

export default router;
