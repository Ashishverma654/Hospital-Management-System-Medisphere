import express from "express";

import { addMedicine, getMedicines, getMedicineById, updateMedicine, deleteMedicine, getMedicineStockLedger, getRecentStockLedger } from "../controllers/pharmacyController.js";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import { addMedicineSchema, updateMedicineSchema } from "../validations/pharmacyValidation.js";

const router = express.Router();

router.post("/", verifyAccessToken, authorizeRoles("admin", "pharmacist"), validate(addMedicineSchema), addMedicine);

router.get("/", verifyAccessToken, authorizeRoles("admin", "doctor", "receptionist", "pharmacist"), getMedicines);
router.get("/stock-ledger/recent", verifyAccessToken, authorizeRoles("admin", "pharmacist"), getRecentStockLedger);

router.get("/:id", verifyAccessToken, authorizeRoles("admin", "doctor", "receptionist", "pharmacist"), getMedicineById);
router.get("/:id/stock-ledger", verifyAccessToken, authorizeRoles("admin", "pharmacist"), getMedicineStockLedger);
router.put("/:id", verifyAccessToken, authorizeRoles("admin", "pharmacist"), validate(updateMedicineSchema), updateMedicine);
router.delete("/:id", verifyAccessToken, authorizeRoles("admin", "pharmacist"), deleteMedicine);

export default router;
