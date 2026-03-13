import express from "express";
import { createDepartment, getAllDepartment, updateDepartment, toggleDepartmentStatus } from "../controllers/departmentController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyAccessToken, authorizeRoles("superadmin", "admin"), getAllDepartment);
router.post("/", verifyAccessToken, authorizeRoles("superadmin", "admin"), createDepartment);
router.put("/:id", verifyAccessToken, authorizeRoles("superadmin", "admin"), updateDepartment);
router.put("/:id/toggle-active", verifyAccessToken, authorizeRoles("superadmin", "admin"), toggleDepartmentStatus);


export default router;
