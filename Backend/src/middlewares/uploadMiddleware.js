import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "hospital_reports",
    allowed_formats: ["jpg", "png", "pdf"],
  },
});

const upload = multer({ storage });
export default upload;
