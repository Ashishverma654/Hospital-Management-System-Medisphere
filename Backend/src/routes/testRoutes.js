import express from "express";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/admin", verifyAccessToken, authorizeRoles("admin"), (req, res) => {
  res.json({
    message: "Welcome Admin"
  });
});

export default router;
