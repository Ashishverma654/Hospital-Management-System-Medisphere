import express from "express";
import {
  getMyPharmacyOrders,
  getPharmacyOrderById,
  placeOrderFromPrescription,
} from "../controllers/pharmacyOrderController.js";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { placeOrderFromPrescriptionSchema } from "../validations/pharmacyValidation.js";

const router = express.Router();

router.use(verifyAccessToken);

router.post(
  "/from-prescription/:prescriptionId",
  authorizeRoles("patient"),
  validate(placeOrderFromPrescriptionSchema),
  placeOrderFromPrescription
);
router.get("/my", authorizeRoles("patient"), getMyPharmacyOrders);
router.get("/:id", authorizeRoles("patient", "pharmacist", "admin"), getPharmacyOrderById);

export default router;
