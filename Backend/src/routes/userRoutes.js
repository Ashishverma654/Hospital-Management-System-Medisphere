import express from "express";
import { uploadProfileImage } from "../controllers/userController.js";
import { verifyAccessToken } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Route specifically for uploading standard Cloudinary images
router.put("/profile-image", verifyAccessToken, upload.single("profileImage"), uploadProfileImage);

export default router;
