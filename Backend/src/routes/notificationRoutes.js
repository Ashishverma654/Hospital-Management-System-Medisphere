import express from "express";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import { EMPLOYEE_ROLES } from "../constants/roles.js";
import {
  getEmployeeUnreadCount,
  getMyEmployeeNotifications,
  getMyNotifications,
  getUnreadCount,
  markAllEmployeeNotificationsRead,
  markAllNotificationsRead,
  markEmployeeNotificationRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(verifyAccessToken);
router.get("/my", authorizeRoles("patient"), getMyNotifications);
router.get("/unread-count", authorizeRoles("patient"), getUnreadCount);
router.patch("/read-all", authorizeRoles("patient"), markAllNotificationsRead);
router.patch("/:id/read", authorizeRoles("patient"), markNotificationRead);

router.get("/employee/my", authorizeRoles(...EMPLOYEE_ROLES), getMyEmployeeNotifications);
router.get("/employee/unread-count", authorizeRoles(...EMPLOYEE_ROLES), getEmployeeUnreadCount);
router.patch("/employee/read-all", authorizeRoles(...EMPLOYEE_ROLES), markAllEmployeeNotificationsRead);
router.patch("/employee/:id/read", authorizeRoles(...EMPLOYEE_ROLES), markEmployeeNotificationRead);

export default router;
