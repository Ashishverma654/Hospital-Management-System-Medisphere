import express from "express";
import {
  createLabOrder,
  getDoctorLabOrders,
  getLabOrderById,
  getPatientLabOrders,
  downloadLabOrderPDF,
  updateLabOrderStatus,
} from "../controllers/labOrderController.js";

import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { createLabOrderSchema, updateLabOrderStatusSchema } from "../validations/labValidation.js";

const router = express.Router();

// Doctor creates lab order
router.post(
  "/",
  verifyAccessToken,
  authorizeRoles("doctor"),
  validate(createLabOrderSchema),
  createLabOrder
);

// Get doctor's lab orders
router.get(
  "/doctor",
  verifyAccessToken,
  authorizeRoles("doctor"),
  getDoctorLabOrders
);

// Get patient's lab orders
router.get(
  "/my",
  verifyAccessToken,
  authorizeRoles("patient"),
  getPatientLabOrders
);

// Get specific lab order
router.get("/:id", verifyAccessToken, getLabOrderById);

// Download lab order PDF
router.get(
  "/:id/pdf",
  verifyAccessToken,
  downloadLabOrderPDF
);

// Update lab order status (admin/lab tech)
router.put(
  "/:id/status",
  verifyAccessToken,
  authorizeRoles("admin", "superadmin", "labTechnician"),
  validate(updateLabOrderStatusSchema),
  updateLabOrderStatus
);

export default router;
