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
  markAppointmentNoShow,
  rescheduleAppointment,
  recommendAdmission,
  startConsultation,
  startConsultationEarly,
  getDoctorTodayDetailed,
  getPatientSummary,
  getDoctorAppointmentById,
} from "../controllers/appointmentController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import {
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  recommendAdmissionSchema,
} from "../validations/appointmentValidation.js";

const router = express.Router();

router.post(
  "/",
  verifyAccessToken,
  authorizeRoles("patient", "receptionist", "admin", "superadmin"),
  validate(bookAppointmentSchema),
  bookAppointment
);

router.get("/", verifyAccessToken, authorizeRoles("patient", "receptionist", "admin", "superadmin"), getAllAppointments);
router.get("/queue/today", verifyAccessToken, authorizeRoles("receptionist", "admin", "superadmin"), getReceptionQueue);

router.put(
  "/:id/cancel",
  verifyAccessToken,
  authorizeRoles("patient", "receptionist", "admin", "superadmin"),
  validate(cancelAppointmentSchema),
  cancelAppointment
);
router.put("/:id/arrive", verifyAccessToken, authorizeRoles("receptionist", "admin", "superadmin"), markAppointmentArrived);
router.put("/:id/no-show", verifyAccessToken, authorizeRoles("receptionist", "admin", "superadmin"), markAppointmentNoShow);
router.put(
  "/:id/reschedule",
  verifyAccessToken,
  authorizeRoles("receptionist", "admin", "superadmin"),
  validate(rescheduleAppointmentSchema),
  rescheduleAppointment
);
router.put(
  "/:id/recommend-admission",
  verifyAccessToken,
  authorizeRoles("doctor"),
  validate(recommendAdmissionSchema),
  recommendAdmission
);

// Doctor workflow routes
router.post("/:appointmentId/start-consultation", verifyAccessToken, authorizeRoles("doctor"), startConsultation);
router.post(
  "/:appointmentId/start-consultation-early",
  verifyAccessToken,
  authorizeRoles("receptionist", "admin", "superadmin"),
  startConsultationEarly
);
router.get("/doctor/today", verifyAccessToken, authorizeRoles("doctor"), getDoctorTodayDetailed);
router.get("/doctor/all", verifyAccessToken, authorizeRoles("doctor"), getDoctorAppointments);
router.get("/doctor/:id", verifyAccessToken, authorizeRoles("doctor"), getDoctorAppointmentById);

router.put("/:id/complete", verifyAccessToken, authorizeRoles("doctor", "receptionist", "admin", "superadmin"), completeAppointment);

// Patient summary for doctor consultation
router.get("/patient/:patientId/summary", verifyAccessToken, authorizeRoles("doctor", "admin", "superadmin"), getPatientSummary);

router.get("/patient-history/:patientId", verifyAccessToken, authorizeRoles("doctor"), getPatientHistory);

export default router;
