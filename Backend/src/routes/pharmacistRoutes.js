import express from "express";
import { getDashboardStats, getMyProfile, updateMyProfile } from "../controllers/pharmacistController.js";
import {
  acceptPharmacyOrder,
  cancelPharmacyOrder,
  completePharmacyOrder,
  getPharmacistOrders,
  getPharmacyOrderById,
  markOrderPreparing,
  markOrderReady,
  verifyPharmacyOrder,
} from "../controllers/pharmacyOrderController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { pharmacyOrderItemsSchema } from "../validations/pharmacyValidation.js";

const router = express.Router();

router.use(verifyAccessToken);
router.use(authorizeRoles("pharmacist"));

router.get("/dashboard", getDashboardStats);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.get("/orders", getPharmacistOrders);
router.get("/orders/:id", getPharmacyOrderById);
router.patch("/orders/:id/accept", validate(pharmacyOrderItemsSchema), acceptPharmacyOrder);
router.patch("/orders/:id/verify", validate(pharmacyOrderItemsSchema), verifyPharmacyOrder);
router.patch("/orders/:id/preparing", validate(pharmacyOrderItemsSchema), markOrderPreparing);
router.patch("/orders/:id/ready", validate(pharmacyOrderItemsSchema), markOrderReady);
router.patch("/orders/:id/complete", completePharmacyOrder);
router.patch("/orders/:id/cancel", cancelPharmacyOrder);

export default router;
