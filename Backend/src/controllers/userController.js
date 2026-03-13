import User from "../models/User.js";
import { normalizeSystemRole } from "../constants/roles.js";

const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: normalizeSystemRole(user.role),
    phone: user.phone,
    gender: user.gender,
    address: user.address,
    profileImage: user.profileImage,
    patientId: user.patientId,
    employeeId: user.employeeId,
    isActive: user.isActive,
    onboardingStatus: user.onboardingStatus,
    dob: user.dob,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

export const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file provided." });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.profileImage = req.file.path;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile image updated successfully.",
            data: sanitizeUser(user)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -pin -loginOtp -resetPasswordOtp");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({
            success: true,
            data: sanitizeUser(user),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const allowedFields = ["name", "phone", "gender", "address"];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password -pin -loginOtp -resetPasswordOtp");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: sanitizeUser(user),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
