import express from "express";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import {
  createLabRecommendation,
  getDoctorRecommendations,
  getPatientRecommendations,
  markRecommendationExternal,
  placeRecommendationOrder,
} from "../controllers/labRecommendationController.js";
import {
  createLabRecommendationSchema,
  markRecommendationExternalSchema,
  placeRecommendationOrderSchema,
} from "../validations/labValidation.js";

const router = express.Router();

// Doctor creates recommendation (no order placed)
router.post(
  "/",
  verifyAccessToken,
  authorizeRoles("doctor"),
  validate(createLabRecommendationSchema),
  createLabRecommendation
);

// Doctor list
router.get(
  "/doctor",
  verifyAccessToken,
  authorizeRoles("doctor"),
  getDoctorRecommendations
);

// Patient list
router.get(
  "/my",
  verifyAccessToken,
  authorizeRoles("patient"),
  getPatientRecommendations
);

// Patient marks external
router.post(
  "/:id/external",
  verifyAccessToken,
  authorizeRoles("patient"),
  validate(markRecommendationExternalSchema),
  markRecommendationExternal
);

// Patient places order for recommendation
router.post(
  "/:id/order",
  verifyAccessToken,
  authorizeRoles("patient"),
  validate(placeRecommendationOrderSchema),
  placeRecommendationOrder
);

export default router;
