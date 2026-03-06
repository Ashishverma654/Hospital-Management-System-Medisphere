import express from "express";

import {
  createDoctor,
  getDoctors,
  getDoctorById
} from "../controllers/doctorController.js";

import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyAccessToken, authorizeRoles("admin"), createDoctor);
router.get("/", (req, res) => {
  console.log("GET DOCTORS ROUTE HIT");
  getDoctors(req, res);
});

router.get("/:id", getDoctorById);

export default router;
