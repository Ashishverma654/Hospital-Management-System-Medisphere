import express from "express";
import { getMyProfile, updateMyProfile, getDashboardStats } from "../controllers/nurseController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyAccessToken);
router.use(authorizeRoles("nurse"));

router.get("/dashboard", getDashboardStats);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);

export default router;
