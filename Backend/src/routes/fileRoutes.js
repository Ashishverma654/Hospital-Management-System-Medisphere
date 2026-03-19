import express from "express";
import { verifyAccessToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import validate from "../middlewares/validate.js";
import { fileUploadSchema } from "../validations/availabilityAwardFileValidation.js";

const router = express.Router();

router.post(
  "/upload",
  verifyAccessToken,
  authorizeRoles("superadmin", "admin", "subadmin", "doctor"),
  validate(fileUploadSchema),
  upload.single("image"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      return res.json({
        message: "File uploaded successfully",
        url: req.file.path,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

export default router;
