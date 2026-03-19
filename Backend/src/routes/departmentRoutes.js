import express from "express";
import { createDepartment, getAllDepartment, updateDepartment, toggleDepartmentStatus, getDepartmentHistory } from "../controllers/departmentController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { createDepartmentSchema, updateDepartmentSchema } from "../validations/adminMasterValidation.js";

const router = express.Router();

router.get("/", verifyAccessToken, authorizeRoles("superadmin", "admin", "subadmin"), getAllDepartment);
router.post("/", verifyAccessToken, authorizeRoles("superadmin", "admin"), validate(createDepartmentSchema), createDepartment);
router.get("/:id/history", verifyAccessToken, authorizeRoles("superadmin", "admin"), getDepartmentHistory);
router.put("/:id", verifyAccessToken, authorizeRoles("superadmin", "admin"), validate(updateDepartmentSchema), updateDepartment);
router.put("/:id/toggle-active", verifyAccessToken, authorizeRoles("superadmin", "admin"), toggleDepartmentStatus);


export default router;
