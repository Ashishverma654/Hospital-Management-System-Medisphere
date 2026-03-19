import express from "express";
import { changeMyPassword, getMyProfile, updateMyProfile, uploadProfileImage } from "../controllers/userController.js";
import { verifyAccessToken } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import validate from "../middlewares/validate.js";
import { changePasswordSchema, updateMyProfileSchema, emptyBodySchema } from "../validations/reportShiftUserWardValidation.js";

const router = express.Router();

router.get("/me", verifyAccessToken, getMyProfile);
router.put("/me", verifyAccessToken, validate(updateMyProfileSchema), updateMyProfile);
router.put("/change-password", verifyAccessToken, validate(changePasswordSchema), changeMyPassword);

// Route specifically for uploading standard Cloudinary images
router.put("/profile-image", verifyAccessToken, validate(emptyBodySchema), upload.single("profileImage"), uploadProfileImage);

export default router;
