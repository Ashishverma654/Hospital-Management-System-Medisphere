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
    authorizeRoles("admin"),
    createBed
);


// GET ALL BEDS
router.get(
    "/",
    verifyAccessToken,
    authorizeRoles("admin"),
    getBeds
);

router.get(
    "/admission-candidates",
    verifyAccessToken,
    authorizeRoles("admin"),
    getAdmissionCandidates
);

router.get(
    "/admissions/current",
    verifyAccessToken,
    authorizeRoles("admin"),
    getCurrentAdmissions
);

router.put(
    "/:id",
    verifyAccessToken,
    authorizeRoles("admin"),
    updateBed
);


// ASSIGN BED
router.put(
    "/assign/:id",
    verifyAccessToken,
    authorizeRoles("admin"),
    assignBed
);


// DISCHARGE PATIENT
router.put(
    "/discharge/:id",
    verifyAccessToken,
    authorizeRoles("admin"),
    dischargePatient
);

export default router;
