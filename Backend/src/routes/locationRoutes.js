import express from "express";
import {
  createLocation,
  getAllLocations,
  toggleLocationStatus,
  updateLocation,
} from "../controllers/locationController.js";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyAccessToken, authorizeRoles("superadmin", "admin"), getAllLocations);
router.post("/", verifyAccessToken, authorizeRoles("superadmin", "admin"), createLocation);
router.put("/:id", verifyAccessToken, authorizeRoles("superadmin", "admin"), updateLocation);
router.put("/:id/toggle-active", verifyAccessToken, authorizeRoles("superadmin", "admin"), toggleLocationStatus);

export default router;
