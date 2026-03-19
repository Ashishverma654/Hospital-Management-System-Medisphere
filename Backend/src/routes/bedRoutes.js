import express from "express";

import {
    assignBed,
    assignBedAuto,
    createBed,
    dischargePatient,
    getAdmissionCandidates,
    getBeds,
    getCurrentAdmissions,
    transferBed,
    updateBed,
} from "../controllers/bedController.js";

import {
    verifyAccessToken,
    authorizeRoles
} from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validate.js";
import {
    createBedSchema,
    updateBedSchema,
    assignBedSchema,
    assignBedAutoSchema,
    transferBedSchema,
} from "../validations/admissionBedValidation.js";

const router = express.Router();

// ADD BED
router.post(
    "/",
    verifyAccessToken,
    authorizeRoles("superadmin", "admin", "subadmin"),
    validate(createBedSchema),
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
    validate(updateBedSchema),
    updateBed
);

// ASSIGN BED
router.put(
    "/assign/:id",
    verifyAccessToken,
    authorizeRoles("superadmin", "admin", "subadmin"),
    validate(assignBedSchema),
    assignBed
);

// AUTO ASSIGN BED
router.post(
    "/assign",
    verifyAccessToken,
    authorizeRoles("superadmin", "admin", "subadmin"),
    validate(assignBedAutoSchema),
    assignBedAuto
);

// DISCHARGE PATIENT
router.put(
    "/discharge/:id",
    verifyAccessToken,
    authorizeRoles("superadmin", "admin", "subadmin"),
    dischargePatient
);

// TRANSFER PATIENT
router.put(
    "/transfer",
    verifyAccessToken,
    authorizeRoles("superadmin", "admin", "subadmin"),
    validate(transferBedSchema),
    transferBed
);

export default router;
