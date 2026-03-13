import express from "express";
import {
  createAward,
  getAllAwards,
  toggleAwardStatus,
  updateAward,
} from "../controllers/awardController.js";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyAccessToken, authorizeRoles("superadmin", "admin"));

router.get("/", getAllAwards);
router.post("/", createAward);
router.put("/:id", updateAward);
router.put("/:id/toggle-active", toggleAwardStatus);

export default router;
