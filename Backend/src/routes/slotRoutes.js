import express from "express";
import { getDoctorSlots } from "../controllers/slotController.js";

const router = express.Router();
router.get("/:doctorId/slots", getDoctorSlots);

export default router;
