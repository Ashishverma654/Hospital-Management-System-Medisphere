import express from "express";
import { createDepartment, getAllDepartment, updateDepartment, deleteDepartment } from "../controllers/departmentController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create",verifyAccessToken, authorizeRoles("admin"), createDepartment );
router.get("/",verifyAccessToken, authorizeRoles("admin"), getAllDepartment);
router.patch("/update/:id",verifyAccessToken, authorizeRoles("admin"), updateDepartment);
router.delete("/delete/:id",verifyAccessToken, authorizeRoles("admin"),  deleteDepartment);


export default router;
