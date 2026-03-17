import express from "express";

import {
    assignBed,
    createBed,
    dischargePatient,
    getAdmissionCandidates,
    getBeds,
    getCurrentAdmissions,
    updateBed,
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
    authorizeRoles("superadmin", "admin", "subadmin"),
    createBed
);

// GET ALL BEDS
router.get(
    "/",
    verifyAccessToken,
    authorizeRoles("superadmin", "admin", "subadmin"),
    getBeds
);

router.get(
    "/admission-candidates",
    verifyAccessToken,
    authorizeRoles("superadmin", "admin", "subadmin"),
    getAdmissionCandidates
);

router.get(
    "/admissions/current",
    verifyAccessToken,
    authorizeRoles("superadmin", "admin", "subadmin"),
    getCurrentAdmissions
);

router.put(
    "/:id",
    verifyAccessToken,
    authorizeRoles("superadmin", "admin", "subadmin"),
    updateBed
);

// ASSIGN BED
router.put(
    "/assign/:id",
    verifyAccessToken,
    authorizeRoles("superadmin", "admin", "subadmin"),
    assignBed
);

// DISCHARGE PATIENT
router.put(
    "/discharge/:id",
    verifyAccessToken,
    authorizeRoles("superadmin", "admin", "subadmin"),
    dischargePatient
);

export default router;
