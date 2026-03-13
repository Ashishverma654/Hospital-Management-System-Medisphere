import express from "express";
import {
  createWard,
  getWardDetail,
  getWardOccupancySummary,
  listWards,
  toggleWardActive,
  updateWard,
} from "../controllers/wardController.js";
import { authorizeRoles, verifyAccessToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyAccessToken);
router.use(authorizeRoles("admin"));

router.get("/", listWards);
router.get("/summary", getWardOccupancySummary);
router.get("/:id", getWardDetail);
router.post("/", createWard);
router.put("/:id", updateWard);
router.put("/:id/toggle-active", toggleWardActive);

export default router;
