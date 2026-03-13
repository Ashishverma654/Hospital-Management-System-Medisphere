import express from "express";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(verifyAccessToken);
router.get("/my", authorizeRoles("patient"), getMyNotifications);
router.patch("/read-all", authorizeRoles("patient"), markAllNotificationsRead);
router.patch("/:id/read", authorizeRoles("patient"), markNotificationRead);

export default router;
