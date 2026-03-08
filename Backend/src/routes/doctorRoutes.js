import express from "express";

import {
  createDoctor,
  getDoctors,
  getDoctorById
} from "../controllers/doctorController.js";

import { getDoctorSlots } from "../controllers/slotController.js";

import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin.js";

const router = express.Router();

router.post("/", verifyAccessToken, authorizeRoles("admin"), requireSuperAdmin, createDoctor);
router.get("/", (req, res) => {
  console.log("GET DOCTORS ROUTE HIT");
  getDoctors(req, res);
});

router.get("/:doctorId/slots", getDoctorSlots);
router.get("/:id", getDoctorById);

export default router;
