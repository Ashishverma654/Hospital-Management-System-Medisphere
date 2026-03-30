import express from "express";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import {
  createLabTest,
  getLabTests,
  updateLabTest,
} from "../controllers/labTestController.js";
import {
  createLabTestSchema,
  updateLabTestSchema,
} from "../validations/labMasterValidation.js";

const router = express.Router();

router.get("/", verifyAccessToken, authorizeRoles("admin", "superadmin", "subadmin", "doctor", "labTechnician", "patient"), getLabTests);
router.post("/", verifyAccessToken, authorizeRoles("admin", "superadmin"), validate(createLabTestSchema), createLabTest);
router.put("/:id", verifyAccessToken, authorizeRoles("admin", "superadmin"), validate(updateLabTestSchema), updateLabTest);

export default router;
