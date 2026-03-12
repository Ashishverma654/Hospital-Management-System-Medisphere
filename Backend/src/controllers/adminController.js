import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import Bed from "../models/Bed.js";
import User from "../models/User.js";
import CreationLog from "../models/CreationLog.js";
import bcrypt from "bcryptjs";
import {
  getCreatableRolesForRole,
  getRoleLabel,
  normalizeSystemRole,
} from "../constants/roles.js";

// Helper: Generate unique Employee ID (e.g., EMP-123456)
const generateEmployeeId = async () => {
  let isUnique = false;
  let newId;
  while (!isUnique) {
    newId = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
    const existing = await User.findOne({ employeeId: newId });
    if (!existing) isUnique = true;
  }
  return newId;
};

// 1. Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const totalDoctors = await Doctor.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    const todayAppointments = await Appointment.countDocuments({ date: today });
    const completedAppointments = await Appointment.countDocuments({ status: "completed" });
    const cancelledAppointments = await Appointment.countDocuments({ status: "cancelled" });

    const revenueData = await Invoice.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    const occupiedBeds = await Bed.countDocuments({ status: "occupied" });
    const availableBeds = await Bed.countDocuments({ status: "available" });

    const totalNurses = await User.countDocuments({ role: "nurse", isActive: true });
    const totalPharmacists = await User.countDocuments({ role: "pharmacist", isActive: true });
    const totalLabTechs = await User.countDocuments({ role: "labTechnician", isActive: true });
    const totalReceptionists = await User.countDocuments({ role: "receptionist", isActive: true });

    res.json({
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      completedAppointments,
      cancelledAppointments,
      totalRevenue,
      occupiedBeds,
      availableBeds,
      totalNurses,
      totalPharmacists,
      totalLabTechs,
      totalReceptionists,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create Staff User (hierarchy-aware)
export const createStaffUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, dob, gender, address } = req.body;
    const creatorRole = normalizeSystemRole(req.user.role);
    const creatorId = req.user.id;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password, and role are required." });
    }

    // Check hierarchy permissions
    const allowedRoles = getCreatableRolesForRole(creatorRole);
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: `A ${getRoleLabel(creatorRole)} cannot create a ${getRoleLabel(role)}. Allowed roles: ${allowedRoles.map(getRoleLabel).join(", ") || "none"}.`,
      });
    }

    // Check email uniqueness
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Generate employee ID
    const employeeId = await generateEmployeeId();

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      phone,
      dob,
      gender,
      address,
      employeeId,
      createdBy: creatorId,
    });

    // If role is doctor, create the Doctor record
    if (role === 'doctor') {
      const { 
        departmentId, 
        title, 
        qualifications, 
        experienceYears, 
        consultationFee, 
        about, 
        expertise,
        articles,
        media,
        specialization // Fallback or extra field
      } = req.body;

      await Doctor.create({
        userId: user._id,
        departmentId,
        title: title || "Consultant",
        qualifications: qualifications || [],
        experienceYears: experienceYears || 5,
        consultationFee: consultationFee || 500,
        about: about || "",
        expertise: expertise || [],
        articles: articles || [],
        media: media || [],
        specialization: specialization || ""
      });
    }

    // Log the creation
    const creator = await User.findById(creatorId).select("name role");
    await CreationLog.create({
      creatorId,
      creatorName: creator?.name || "System",
      creatorRole,
      createdUserId: user._id,
      createdUserName: user.name,
      createdUserEmail: user.email,
      createdUserRole: user.role,
      action: "created",
    });

    return res.status(201).json({
      message: `${getRoleLabel(role)} created successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: normalizeSystemRole(user.role),
        employeeId: user.employeeId,
        createdBy: creator?.name,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 3. Get All Users (with filters, search, pagination)
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password -pin -loginOtp -resetPasswordOtp")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    const normalizedUsers = users.map((user) => ({
      ...user.toObject(),
      role: normalizeSystemRole(user.role),
      createdBy: user.createdBy
        ? {
            ...user.createdBy.toObject(),
            role: normalizeSystemRole(user.createdBy.role),
          }
        : user.createdBy,
    }));

    res.json({
      users: normalizedUsers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Get Creation History (logs of users created by requesting user)
export const getCreationHistory = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const logs = await CreationLog.find({ creatorId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CreationLog.countDocuments({ creatorId });

    const normalizedLogs = logs.map((log) => ({
      ...log.toObject(),
      creatorRole: normalizeSystemRole(log.creatorRole),
      createdUserRole: normalizeSystemRole(log.createdUserRole),
    }));

    res.json({
      logs: normalizedLogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Deactivate User (soft-delete with log)
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Prevent deactivating superadmin
    if (normalizeSystemRole(user.role) === "superadmin") {
      return res.status(403).json({ message: "Cannot deactivate a SuperAdmin." });
    }

    user.isActive = !user.isActive;
    await user.save();

    // Log the action
    const creator = await User.findById(req.user.id).select("name role");
    await CreationLog.create({
      creatorId: req.user.id,
      creatorName: creator?.name || "System",
      creatorRole: normalizeSystemRole(req.user.role),
      createdUserId: user._id,
      createdUserName: user.name,
      createdUserEmail: user.email,
      createdUserRole: normalizeSystemRole(user.role),
      action: user.isActive ? "reactivated" : "deactivated",
    });

    res.json({
      message: `User ${user.isActive ? "reactivated" : "deactivated"} successfully.`,
      user: { id: user._id, name: user.name, isActive: user.isActive },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Get allowed roles the current user can create
export const getCreatableRoles = async (req, res) => {
  try {
    const allowed = getCreatableRolesForRole(req.user.role);
    res.json({ allowedRoles: allowed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
