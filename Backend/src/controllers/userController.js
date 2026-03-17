import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { normalizeSystemRole } from "../constants/roles.js";

const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: normalizeSystemRole(user.role),
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    phone: user.phone,
    gender: user.gender,
    address: user.address,
    city: user.city,
    state: user.state,
    postalCode: user.postalCode,
    maritalStatus: user.maritalStatus,
    nationality: user.nationality,
    emergencyContactName: user.emergencyContactName,
    emergencyContactPhone: user.emergencyContactPhone,
    emergencyContactRelationship: user.emergencyContactRelationship,
    profileImage: user.profileImage,
    patientId: user.patientId,
    employeeId: user.employeeId,
    isActive: user.isActive,
    onboardingStatus: user.onboardingStatus,
    mustResetPassword: user.mustResetPassword,
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
        const allowedFields = [
            "phone", "alternativeContact", "gender",
            "bloodGroup", "maritalStatus", "nationality",
            "address", "city", "state", "postalCode",
            "emergencyContactName", "emergencyContactPhone", "emergencyContactRelationship"
        ];
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

export const changeMyPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "A new password (min 6 chars) is required." });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (!user.mustResetPassword) {
            if (!oldPassword) {
                return res.status(400).json({ success: false, message: "Current password is required." });
            }
            const isMatch = await bcrypt.compare(oldPassword, user.password || "");
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Current password is incorrect." });
            }
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        user.mustResetPassword = false;
        if (user.onboardingStatus === "passwordResetPending" || user.onboardingStatus === "invited") {
            user.onboardingStatus = "active";
        }
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully.",
            data: sanitizeUser(user),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
