import express from "express";
import { createInvoice, getPatientInvoice, getMyInvoices, payInvoice } from "../controllers/billingController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyAccessToken, authorizeRoles("admin", "receptionist"), createInvoice);

router.get("/my", verifyAccessToken, authorizeRoles("patient"), getMyInvoices);
router.get("/patient/:patientId", verifyAccessToken, authorizeRoles("admin", "receptionist", "doctor"), getPatientInvoice);

router.put("/pay/:id", verifyAccessToken, authorizeRoles("admin", "receptionist"), payInvoice);

export default router;