import express from "express";
import {
  createAward,
  getPublicAwards,
  getAllAwards,
  toggleAwardStatus,
  updateAward,
  getAwardHistory,
} from "../controllers/awardController.js";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import validate from "../middlewares/validate.js";
import { createAwardSchema, updateAwardSchema } from "../validations/availabilityAwardFileValidation.js";

const router = express.Router();

// Public route - for homepage display
router.get("/public", getPublicAwards);

// Admin routes
router.use(verifyAccessToken, authorizeRoles("superadmin", "admin"));

router.get("/", getAllAwards);
router.get("/:id/history", getAwardHistory);
router.post("/", validate(createAwardSchema), upload.single("image"), createAward);
router.put("/:id", validate(updateAwardSchema), upload.single("image"), updateAward);
router.put("/:id/toggle-active", toggleAwardStatus);

export default router;
