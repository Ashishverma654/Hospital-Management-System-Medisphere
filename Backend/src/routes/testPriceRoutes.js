import express from "express";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import {
  createTestPrice,
  updateTestPrice,
  getTestPrices,
} from "../controllers/testPriceController.js";
import {
  createTestPriceSchema,
  updateTestPriceSchema,
} from "../validations/labMasterValidation.js";

const router = express.Router();

router.get("/", verifyAccessToken, authorizeRoles("admin", "superadmin", "subadmin"), getTestPrices);
router.post("/", verifyAccessToken, authorizeRoles("admin", "superadmin"), validate(createTestPriceSchema), createTestPrice);
router.put("/:id", verifyAccessToken, authorizeRoles("admin", "superadmin"), validate(updateTestPriceSchema), updateTestPrice);

export default router;
