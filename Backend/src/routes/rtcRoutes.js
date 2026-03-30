import express from "express";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import { getIceServers } from "../controllers/rtcController.js";

const router = express.Router();

router.get(
  "/ice",
  verifyAccessToken,
  authorizeRoles("doctor", "patient"),
  getIceServers
);

export default router;
