import express from "express";
import {
  createLocation,
  getAllLocations,
  toggleLocationStatus,
  updateLocation,
} from "../controllers/locationController.js";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { createLocationSchema, updateLocationSchema } from "../validations/adminMasterValidation.js";

const router = express.Router();

router.get("/", verifyAccessToken, authorizeRoles("superadmin", "admin", "subadmin"), getAllLocations);
router.post("/", verifyAccessToken, authorizeRoles("superadmin", "admin"), validate(createLocationSchema), createLocation);
router.put("/:id", verifyAccessToken, authorizeRoles("superadmin", "admin"), validate(updateLocationSchema), updateLocation);
router.put("/:id/toggle-active", verifyAccessToken, authorizeRoles("superadmin", "admin"), toggleLocationStatus);

export default router;
