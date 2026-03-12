import express from "express";
import { getDashboardStats, getMyProfile, updateMyProfile, getPendingReports } from "../controllers/labTechController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyAccessToken);
router.use(authorizeRoles("labTechnician"));

router.get("/dashboard", getDashboardStats);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.get("/pending-reports", getPendingReports);

export default router;
