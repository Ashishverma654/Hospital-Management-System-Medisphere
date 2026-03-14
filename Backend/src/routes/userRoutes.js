import express from "express";
import { changeMyPassword, getMyProfile, updateMyProfile, uploadProfileImage } from "../controllers/userController.js";
import { verifyAccessToken } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", verifyAccessToken, getMyProfile);
router.put("/me", verifyAccessToken, updateMyProfile);
router.put("/change-password", verifyAccessToken, changeMyPassword);

// Route specifically for uploading standard Cloudinary images
router.put("/profile-image", verifyAccessToken, upload.single("profileImage"), uploadProfileImage);

export default router;
