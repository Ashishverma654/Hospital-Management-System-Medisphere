import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens.js";
import {
  ALL_ROLES,
  EMPLOYEE_ROLES,
  isEmployeeRole,
  normalizeSystemRole,
  PATIENT_ROLE,
} from "../constants/roles.js";

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
  patientId: user.patientId,
  employeeId: user.employeeId,
});

const buildAuthResponse = (user) => ({
  message: "Login successful",
  accessToken: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
  user: sanitizeUser(user),
});

const findUserByIdentifier = async (identifier, fields = ["email"]) => {
  const orFilters = fields.map((field) => ({ [field]: identifier }));
  return User.findOne({ $or: orFilters });
};

// Helper to generate unique Patient ID (e.g., PAT-123456)
const generatePatientId = async () => {
  let isUnique = false;
  let newId;
  while (!isUnique) {
    newId = `PAT-${Math.floor(100000 + Math.random() * 900000)}`;
    const existing = await User.findOne({ patientId: newId });
    if (!existing) isUnique = true;
  }
  return newId;
};

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
      patientId = await generatePatientId();
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

    res.status(201).json({
      message: "User registered successfully",
      accessToken: generateAccessToken(user),
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

    if (!user || !user.password || normalizeRole(user.role) === PATIENT_ROLE) {
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

    // Attempt to match name exactly (case-insensitive)
    const fullNameRegex = new RegExp(`^${firstName}\\s+${lastName}$`, 'i');
    
    // Find users by name
    const users = await User.find({ name: fullNameRegex });
    
    // Filter by DOB (ignoring time components)
    const targetDate = new Date(dob);
    const user = users.find(u => {
      if (!u.dob) return false;
      const uDate = new Date(u.dob);
      return uDate.getUTCFullYear() === targetDate.getUTCFullYear() &&
             uDate.getUTCMonth() === targetDate.getUTCMonth() &&
             uDate.getUTCDate() === targetDate.getUTCDate();
    });

    if (!user || normalizeRole(user.role) !== PATIENT_ROLE) {
      return res.status(404).json({ message: "No account found matching these details" });
    }
    
    // Obfuscate email for return
    const emailParts = user.email.split('@');
    const obfuscatedEmail = `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`;

    res.json({ 
      message: "Account found", 
      email: user.email, // Passing real email back to frontend to trigger OTP flow
      obfuscatedEmail,
      patientId: user.patientId
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

    if (!user || normalizeRole(user.role) !== PATIENT_ROLE) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();
    // Expiration time: 15 mins
    user.resetPasswordOtp = {
      code: otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    };
    await user.save();

    // MOCK SENDING OTP
    res.json({ message: "Password reset OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Reset Password (and/or PIN)
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, newPin } = req.body;
    
    if (!email || !otp) {
       return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user || normalizeRole(user.role) !== PATIENT_ROLE || !user.resetPasswordOtp || !user.resetPasswordOtp.code) {
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
