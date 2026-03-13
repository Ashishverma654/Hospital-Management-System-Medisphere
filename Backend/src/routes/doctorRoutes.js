import express from "express";

import {
  createDoctor,
  getDoctorsAdmin,
  getDoctorAdminById,
  getDoctors,
  getDoctorById,
  toggleDoctorActive,
  toggleDoctorPublished,
  updateDoctorAdmin,
  uploadDoctorProfileImage,
  getDoctorDashboard,
} from "../controllers/doctorController.js";

import { getDoctorSlots } from "../controllers/slotController.js";

import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Doctor dashboard
router.get("/dashboard", verifyAccessToken, authorizeRoles("doctor"), getDoctorDashboard);

router.get("/admin", verifyAccessToken, authorizeRoles("superadmin", "admin"), getDoctorsAdmin);
router.post("/admin", verifyAccessToken, authorizeRoles("superadmin", "admin"), createDoctor);
router.get("/admin/:id", verifyAccessToken, authorizeRoles("superadmin", "admin"), getDoctorAdminById);
router.put("/admin/:id", verifyAccessToken, authorizeRoles("superadmin", "admin"), updateDoctorAdmin);
router.put("/admin/:id/toggle-active", verifyAccessToken, authorizeRoles("superadmin", "admin"), toggleDoctorActive);
router.put("/admin/:id/toggle-published", verifyAccessToken, authorizeRoles("superadmin", "admin"), toggleDoctorPublished);
router.put("/admin/:id/profile-image", verifyAccessToken, authorizeRoles("superadmin", "admin"), upload.single("profileImage"), uploadDoctorProfileImage);

router.get("/", function(req, res) {
  getDoctors(req, res);
});

router.get("/:doctorId/slots", getDoctorSlots);
router.get("/:id", getDoctorById);

export default router;
