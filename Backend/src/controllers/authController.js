import User from "../models/User.js";
import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens.js";
import {
  ALL_ROLES,
  normalizeSystemRole,
  PATIENT_ROLE,
  ID_PREFIXES,
  isEmployeeRole,
} from "../constants/roles.js";
import { ensurePatientProfileForUser } from "../utils/patientContext.js";
import { logAudit } from "../services/auditLogService.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateUniqueId } from "../utils/idGenerator.js";
import { buildForgotPasswordTemplate } from "../utils/emailTemplates.js";

// Helper to generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const normalizeRole = (role) => {
  if (!role) return role;
  return normalizeSystemRole(role);
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role),
  firstName: user.firstName,
  middleName: user.middleName,
  lastName: user.lastName,
  patientId: user.patientId,
  employeeId: user.employeeId,
  profileImage: user.profileImage,
  isActive: user.isActive,
  onboardingStatus: user.onboardingStatus,
  mustResetPassword: user.mustResetPassword,
});

const buildAuthResponse = (user) => {
  const accessToken = generateAccessToken(user);

  return {
    message: "Login successful",
    accessToken,
    token: accessToken,
    refreshToken: generateRefreshToken(user),
    user: sanitizeUser(user),
  };
};

const findUserByIdentifier = async (identifier, fields = ["email"]) => {
  if (!identifier) return null;
  const orFilters = fields.map((field) => {
    let value = identifier;
    if (field === "email") value = identifier.toLowerCase().trim();
    if (field === "patientId" || field === "employeeId") value = identifier.toUpperCase().trim();
    return { [field]: value };
  });
  return User.findOne({ $or: orFilters });
};

// Helper to generate unique Patient ID (e.g., PAT-123456)

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, pin, dob } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }
    
    if (!password && !pin) {
       return res.status(400).json({ message: "Please set either a password or a 4-digit PIN." });
    }
    
    // Check if phone already exists
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
         return res.status(400).json({ message: "User already exists with this phone number" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    
    let hashedPassword;
    if (password) {
       hashedPassword = await bcrypt.hash(password, salt);
    }
    
    let hashedPin;
    if (pin) {
      hashedPin = await bcrypt.hash(pin, salt);
    }

    const assignedRole = normalizeRole(role || PATIENT_ROLE);
    let patientId;

    if (!ALL_ROLES.includes(assignedRole)) {
      return res.status(400).json({ message: "Invalid role selected." });
    }
    
    if (assignedRole === PATIENT_ROLE) {
      patientId = await generateUniqueId(User, "patientId", ID_PREFIXES.patient);
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
      phone,
      pin: hashedPin,
      dob,
      patientId
    });

    if (assignedRole === PATIENT_ROLE) {
      await ensurePatientProfileForUser(user._id, {
        dateOfBirth: dob,
      });
    }

    await logAudit({
      actor: { id: user._id, name: user.name, role: user.role },
      action: "user_registered",
      entityType: "User",
      entityId: user._id,
      details: { role: user.role, email: user.email },
    });

    const accessToken = generateAccessToken(user);

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      token: accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const registerPatient = async (req, res) => {
  req.body.role = PATIENT_ROLE;
  return register(req, res);
};

// 1. Login with Email or Patient ID and Password
export const login = async (req, res) => {
  try {
    const { email, password } = req.body; // 'email' can be email or patientId

    const user = await findUserByIdentifier(email, ["email", "patientId", "employeeId"]);

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email or Patient ID and password are required" });
    }

    const user = await findUserByIdentifier(email, ["email", "patientId"]);

    if (!user || normalizeRole(user.role) !== PATIENT_ROLE || !user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginEmployee = async (req, res) => {
  try {
    const { identifier, email, password, role } = req.body;
    const loginIdentifier = identifier || email;
    const selectedRole = normalizeRole(role);

    if (!loginIdentifier || !password || !selectedRole) {
      return res.status(400).json({ message: "Identifier, password, and role are required" });
    }

    if (!isEmployeeRole(selectedRole)) {
      return res.status(400).json({ message: "Invalid employee role selection" });
    }

    const user = await findUserByIdentifier(loginIdentifier, ["email", "employeeId"]);

    if (!user || !user.password || normalizeRole(user.role) === PATIENT_ROLE || !user.isActive) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch || normalizeRole(user.role) !== selectedRole) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Login with Phone and PIN
export const loginWithPhonePin = async (req, res) => {
  try {
    const { phone, pin } = req.body;
    
    if (!phone || !pin) {
       return res.status(400).json({ message: "Phone and PIN are required" });
    }

    const user = await User.findOne({ phone });

    if (!user || !user.pin || normalizeRole(user.role) !== PATIENT_ROLE) {
      return res.status(400).json({ message: "Invalid phone number or PIN not set" });
    }

    const isMatch = await bcrypt.compare(pin, user.pin);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid PIN" });
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Send Login OTP (to Email)
export const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body; // Can be email or patientId
    
    if (!email) {
      return res.status(400).json({ message: "Email or Patient ID is required" });
    }

    const user = await User.findOne({
      $or: [{ email: email }, { patientId: email }]
    });

    if (!user || normalizeRole(user.role) !== PATIENT_ROLE) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();
    // Expiration time: 10 mins
    user.loginOtp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    await user.save();

    // MOCK SENDING OTP (In production, use nodemailer/sendgrid)
    res.json({ message: "OTP sent to your registered email address" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Verify Login OTP
export const loginWithOtp = async (req, res) => {
  try {
    const { email, otp } = req.body; // Can be email or patientId
    
    if (!email || !otp) {
       return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({
      $or: [{ email: email }, { patientId: email }]
    });

    if (!user || normalizeRole(user.role) !== PATIENT_ROLE || !user.loginOtp || !user.loginOtp.code) {
      return res.status(400).json({ message: "Invalid request or OTP expired" });
    }

    if (user.loginOtp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.loginOtp.expiresAt < new Date()) {
       return res.status(400).json({ message: "OTP has expired" });
    }

    // Clear OTP after successful use
    user.loginOtp = undefined;
    await user.save();

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Find Account for "Need Help Logging In"
export const findAccountForHelp = async (req, res) => {
  try {
    const { firstName, lastName, dob } = req.body;
    
    if (!firstName || !lastName || !dob) {
      return res.status(400).json({ message: "First name, last name, and date of birth are required" });
    }

    const normalize = (value = "") => value.trim().toLowerCase().replace(/\s+/g, " ");
    const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const first = normalize(firstName);
    const last = normalize(lastName);
    const firstRegex = new RegExp(`\\b${escapeRegex(first)}\\b`, "i");
    const lastRegex = new RegExp(`\\b${escapeRegex(last)}\\b`, "i");
    const fullNameRegex = new RegExp(`\\b${escapeRegex(first)}\\b.*\\b${escapeRegex(last)}\\b`, "i");
    const reverseNameRegex = new RegExp(`\\b${escapeRegex(last)}\\b.*\\b${escapeRegex(first)}\\b`, "i");

    // Find patient users by name (flexible match)
    const users = await User.find({
      role: PATIENT_ROLE,
      $or: [
        { name: { $regex: fullNameRegex } },
        { name: { $regex: reverseNameRegex } },
        { $and: [{ name: { $regex: firstRegex } }, { name: { $regex: lastRegex } }] },
        {
          $and: [
            { firstName: { $regex: new RegExp(`^${escapeRegex(first)}$`, "i") } },
            { lastName: { $regex: new RegExp(`^${escapeRegex(last)}$`, "i") } },
          ],
        },
      ],
    });
    
    // Filter by DOB (ignoring time components)
    const targetDate = new Date(dob);
    const matchesDate = (value) => {
      if (!value) return false;
      const check = new Date(value);
      return check.getUTCFullYear() === targetDate.getUTCFullYear() &&
             check.getUTCMonth() === targetDate.getUTCMonth() &&
             check.getUTCDate() === targetDate.getUTCDate();
    };

    let user = users.find((u) => matchesDate(u.dob));

    if (!user && users.length) {
      const patientRecords = await Patient.find({
        userId: { $in: users.map((u) => u._id) },
      }).populate("userId", "email patientId employeeId name");

      const matchedPatient = patientRecords.find((record) => matchesDate(record.dateOfBirth));
      if (matchedPatient?.userId) {
        user = matchedPatient.userId;
      }
    }

    if (!user) {
      return res.status(404).json({ message: "No account found matching these details" });
    }
    
    // Obfuscate email for return
    const emailParts = user.email.split('@');
    const obfuscatedEmail = `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`;

    res.json({ 
      message: "Account found", 
      email: user.email, 
      obfuscatedEmail,
      patientId: user.patientId,
      employeeId: user.employeeId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Send Forgot Password OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();
    // Expiration time: 15 mins
    user.resetPasswordOtp = {
      code: otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    };
    await user.save();

    // Send OTP via email
    try {
      const emailPayload = buildForgotPasswordTemplate({
        name: user.name || user.firstName,
        otp,
        expiresMinutes: 15,
      });
      await sendEmail(user.email, emailPayload.subject, emailPayload.text, emailPayload.html);
      return res.json({ message: "Password reset OTP sent to your email" });
    } catch (mailError) {
      return res.status(503).json({
        message:
          "Password reset OTP generated, but email delivery failed. Please contact support or try again later.",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Verify Reset OTP
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtp.code) {
      return res.status(400).json({ message: "Invalid request or OTP expired" });
    }

    if (user.resetPasswordOtp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetPasswordOtp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. Reset Password (and/or PIN)
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, newPin } = req.body;
    
    if (!email || !otp) {
       return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtp.code) {
      return res.status(400).json({ message: "Invalid request or OTP expired" });
    }

    if (user.resetPasswordOtp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetPasswordOtp.expiresAt < new Date()) {
       return res.status(400).json({ message: "OTP has expired" });
    }

    const salt = await bcrypt.genSalt(10);
    
    if (newPassword) {
      user.password = await bcrypt.hash(newPassword, salt);
    }
    
    if (newPin && newPin.length === 4) {
      user.pin = await bcrypt.hash(newPin, salt);
    }

    // Clear reset OTP
    user.resetPasswordOtp = undefined;
    await user.save();

    res.json({ message: "Password/PIN has been reset successfully. You can now login." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

