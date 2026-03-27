import express from "express";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import { EMPLOYEE_ROLES } from "../constants/roles.js";
import {
  getEmployeeUnreadCount,
  getMyEmployeeNotifications,
  getMyNotifications,
  getUnreadCount,
  getEmployeeNotificationPreferences,
  updateEmployeeNotificationPreferences,
  markAllEmployeeNotificationsRead,
  markAllNotificationsRead,
  markEmployeeNotificationRead,
  markNotificationRead,
} from "../controllers/notificationController.js";
import validate from "../middlewares/validate.js";
import { emptyBodySchema } from "../validations/nurseAssignmentPrescriptionNotificationValidation.js";

const router = express.Router();

router.use(verifyAccessToken);
router.get("/my", authorizeRoles("patient"), getMyNotifications);
router.get("/unread-count", authorizeRoles("patient"), getUnreadCount);
router.patch("/read-all", authorizeRoles("patient"), validate(emptyBodySchema), markAllNotificationsRead);
router.patch("/:id/read", authorizeRoles("patient"), validate(emptyBodySchema), markNotificationRead);

router.get("/employee/my", authorizeRoles(...EMPLOYEE_ROLES), getMyEmployeeNotifications);
router.get("/employee/unread-count", authorizeRoles(...EMPLOYEE_ROLES), getEmployeeUnreadCount);
router.get("/employee/preferences", authorizeRoles(...EMPLOYEE_ROLES), getEmployeeNotificationPreferences);
router.put("/employee/preferences", authorizeRoles(...EMPLOYEE_ROLES), updateEmployeeNotificationPreferences);
router.patch("/employee/read-all", authorizeRoles(...EMPLOYEE_ROLES), validate(emptyBodySchema), markAllEmployeeNotificationsRead);
router.patch("/employee/:id/read", authorizeRoles(...EMPLOYEE_ROLES), validate(emptyBodySchema), markEmployeeNotificationRead);

export default router;
