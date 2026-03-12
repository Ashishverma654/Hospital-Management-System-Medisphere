import express from "express";
import { getDashboardStats, getMyProfile, updateMyProfile } from "../controllers/pharmacistController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyAccessToken);
router.use(authorizeRoles("pharmacist"));

router.get("/dashboard", getDashboardStats);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);

export default router;
