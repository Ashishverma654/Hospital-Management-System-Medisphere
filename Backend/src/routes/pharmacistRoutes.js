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
} from "../controllers/pharmacyOrderController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyAccessToken);
router.use(authorizeRoles("pharmacist"));

router.get("/dashboard", getDashboardStats);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.get("/orders", getPharmacistOrders);
router.get("/orders/:id", getPharmacyOrderById);
router.patch("/orders/:id/accept", acceptPharmacyOrder);
router.patch("/orders/:id/preparing", markOrderPreparing);
router.patch("/orders/:id/ready", markOrderReady);
router.patch("/orders/:id/complete", completePharmacyOrder);
router.patch("/orders/:id/cancel", cancelPharmacyOrder);

export default router;
