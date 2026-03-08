import express from "express";

import {
    addBed,
    getBeds,
    assignBed,
    dischargePatient
} from "../controllers/bedController.js";

import {
    verifyAccessToken,
    authorizeRoles
} from "../middlewares/authMiddleware.js";

const router = express.Router();


// ADD BED
router.post(
    "/",
    verifyAccessToken,
    authorizeRoles("admin"),
    addBed
);


// GET ALL BEDS
router.get(
    "/",
    verifyAccessToken,
    authorizeRoles("admin", "doctor", "receptionist"),
    getBeds
);


// ASSIGN BED
router.put(
    "/assign/:id",
    verifyAccessToken,
    authorizeRoles("admin", "receptionist"),
    assignBed
);


// DISCHARGE PATIENT
router.put(
    "/discharge/:id",
    verifyAccessToken,
    authorizeRoles("admin", "receptionist"),
    dischargePatient
);

export default router;