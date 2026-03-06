import express from "express";
import { bookAppointment } from "../controllers/appointmentController.js";
import { verifyAccessToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyAccessToken, bookAppointment);
export default router;
