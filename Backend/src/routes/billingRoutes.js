import express from "express";
import {
  createInvoice,
  getInvoiceById,
  getInvoicesByContext,
  getPatientInvoice,
  getMyInvoices,
  payInvoice,
  getAllInvoices,
  initiateConsultationBilling,
  downloadInvoicePdf,
  emailInvoice,
} from "../controllers/billingController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyAccessToken, authorizeRoles("admin", "receptionist"), createInvoice);
router.get("/", verifyAccessToken, authorizeRoles("admin", "receptionist"), getAllInvoices);
router.get("/context", verifyAccessToken, authorizeRoles("admin", "receptionist"), getInvoicesByContext);

router.get("/my", verifyAccessToken, authorizeRoles("patient"), getMyInvoices);
router.get("/:id", verifyAccessToken, authorizeRoles("admin", "receptionist", "patient"), getInvoiceById);
router.get("/:id/pdf", verifyAccessToken, authorizeRoles("admin", "receptionist", "patient"), downloadInvoicePdf);
router.post("/:id/email", verifyAccessToken, authorizeRoles("admin", "receptionist", "patient"), emailInvoice);
router.get("/patient/:patientId", verifyAccessToken, authorizeRoles("admin", "receptionist"), getPatientInvoice);
router.post("/appointments/:appointmentId/initiate", verifyAccessToken, authorizeRoles("admin", "receptionist"), initiateConsultationBilling);

router.put("/pay/:id", verifyAccessToken, authorizeRoles("admin", "receptionist", "patient"), payInvoice);

export default router;
