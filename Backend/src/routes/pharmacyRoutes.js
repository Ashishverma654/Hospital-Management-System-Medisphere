import express from "express";

import { addMedicine, getMedicines, getMedicineById, updateMedicine, deleteMedicine } from "../controllers/pharmacyController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyAccessToken, authorizeRoles("admin", "receptionist"), addMedicine);

router.get("/", verifyAccessToken, authorizeRoles("admin", "doctor", "receptionist"), getMedicines);

router.get("/:id", verifyAccessToken, authorizeRoles("admin", "doctor", "receptionist"), getMedicineById);
router.put("/:id", verifyAccessToken, authorizeRoles("admin", "receptionist"), updateMedicine);
router.delete("/:id", verifyAccessToken, authorizeRoles("admin"), deleteMedicine);

export default router;