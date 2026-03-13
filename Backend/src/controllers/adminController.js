import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import Bed from "../models/Bed.js";
import User from "../models/User.js";
import CreationLog from "../models/CreationLog.js";
import bcrypt from "bcryptjs";
import {
  CREATION_PERMISSIONS,
  getCreatableRolesForRole,
  getRoleLabel,
  normalizeSystemRole,
} from "../constants/roles.js";
import HospitalSettings from "../models/HospitalSettings.js";

const MANAGEABLE_ROLE_OVERRIDES = {
  superadmin: ["admin", "subadmin", "doctor", "nurse", "receptionist", "labTechnician", "pharmacist", "patient"],
  admin: ["subadmin", "doctor", "nurse", "receptionist", "labTechnician", "pharmacist", "patient"],
  subadmin: ["nurse", "receptionist", "labTechnician", "pharmacist"],
};

const getManageableRolesForRole = (role) => MANAGEABLE_ROLE_OVERRIDES[normalizeSystemRole(role)] || [];

const canManageTargetRole = (actorRole, targetRole) => getManageableRolesForRole(actorRole).includes(normalizeSystemRole(targetRole));

const buildUserSummary = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: normalizeSystemRole(user.role),
  employeeId: user.employeeId,
  patientId: user.patientId,
  isActive: user.isActive,
  onboardingStatus: user.onboardingStatus,
  createdAt: user.createdAt,
  profileImage: user.profileImage,
});

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
    const totalAdmins = await User.countDocuments({ role: "admin", isActive: true });
    const totalSubadmins = await User.countDocuments({ role: "subadmin", isActive: true });
    const totalEmployees = await User.countDocuments({
      role: {
        $in: ["superadmin", "admin", "subadmin", "doctor", "nurse", "receptionist", "labTechnician", "pharmacist"],
      },
    });

    const recentUsers = await User.find({ role: { $ne: "patient" } })
      .select("name email role employeeId isActive createdAt createdBy onboardingStatus")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentActivity = await CreationLog.find()
      .sort({ createdAt: -1 })
      .limit(8);

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
      totalAdmins,
      totalSubadmins,
      totalEmployees,
      todayPatientActivity: {
        appointments: todayAppointments,
        completedAppointments,
        cancelledAppointments,
      },
      quickActions: [
        { label: "Manage Roles", path: "/employee/manage-roles" },
        { label: "Patient Directory", path: "/employee/patients" },
        { label: "Hospital Settings", path: "/employee/settings" },
      ],
      recentUsers: recentUsers.map((user) => ({
        ...buildUserSummary(user),
        createdBy: user.createdBy
          ? {
              id: user.createdBy._id,
              name: user.createdBy.name,
              role: normalizeSystemRole(user.createdBy.role),
            }
          : null,
      })),
      recentActivity: recentActivity.map((log) => ({
        id: log._id,
        action: log.action,
        creatorName: log.creatorName,
        creatorRole: normalizeSystemRole(log.creatorRole),
        createdUserName: log.createdUserName,
        createdUserRole: normalizeSystemRole(log.createdUserRole),
        createdAt: log.createdAt,
      })),
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
    const normalizedTargetRole = normalizeSystemRole(role);

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password, and role are required." });
    }

    // Check hierarchy permissions
    const allowedRoles = getCreatableRolesForRole(creatorRole);
    if (!allowedRoles.includes(normalizedTargetRole)) {
      return res.status(403).json({
        message: `A ${getRoleLabel(creatorRole)} cannot create a ${getRoleLabel(normalizedTargetRole)}. Allowed roles: ${allowedRoles.map(getRoleLabel).join(", ") || "none"}.`,
      });
    }

    if (normalizedTargetRole === "doctor") {
      return res.status(400).json({
        message: "Doctors must be created from the Doctor Administration module so the employee account and professional profile stay in sync.",
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
      role: normalizedTargetRole,
      phone,
      dob,
      gender,
      address,
      employeeId,
      createdBy: creatorId,
      onboardingStatus: "active",
    });

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
        ...buildUserSummary(user),
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
    const requesterRole = normalizeSystemRole(req.user.role);

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

    if (requesterRole === "subadmin") {
      const subadminRoles = getManageableRolesForRole(requesterRole);
      filter.role = role && subadminRoles.includes(role) ? role : { $in: subadminRoles };
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
      manageableRoles: getManageableRolesForRole(requesterRole),
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

export const getAuditHistory = async (req, res) => {
  try {
    const requesterRole = normalizeSystemRole(req.user.role);
    const { action, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (action) {
      filter.action = action;
    }

    if (requesterRole === "subadmin") {
      filter.creatorId = req.user.id;
    }

    const logs = await CreationLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    const total = await CreationLog.countDocuments(filter);

    res.json({
      logs: logs.map((log) => ({
        ...log.toObject(),
        creatorRole: normalizeSystemRole(log.creatorRole),
        createdUserRole: normalizeSystemRole(log.createdUserRole),
      })),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
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
    const requesterRole = normalizeSystemRole(req.user.role);
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Prevent deactivating superadmin
    if (normalizeSystemRole(user.role) === "superadmin") {
      return res.status(403).json({ message: "Cannot deactivate a SuperAdmin." });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(403).json({ message: "You cannot change your own active status." });
    }

    if (!canManageTargetRole(requesterRole, user.role)) {
      return res.status(403).json({ message: "You are not allowed to manage this user." });
    }

    user.isActive = !user.isActive;
    user.onboardingStatus = user.isActive ? "active" : "suspended";
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
    const allowed = getCreatableRolesForRole(req.user.role).filter((role) => role !== "doctor");
    res.json({
      allowedRoles: allowed,
      manageableRoles: getManageableRolesForRole(req.user.role),
      hierarchy: CREATION_PERMISSIONS,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHospitalSettings = async (req, res) => {
  try {
    let settings = await HospitalSettings.findOne({ isActive: true }).sort({ updatedAt: -1 });

    if (!settings) {
      settings = await HospitalSettings.create({
        hospitalName: "MediFlow Hospital",
        updatedBy: req.user.id,
      });
    }

    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const upsertHospitalSettings = async (req, res) => {
  try {
    const allowedFields = [
      "hospitalName",
      "logo",
      "email",
      "phone",
      "address",
      "emergencyNumber",
      "footerInfo",
      "publicInfo",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    let settings = await HospitalSettings.findOne({ isActive: true }).sort({ updatedAt: -1 });

    if (!settings) {
      settings = new HospitalSettings({
        hospitalName: updates.hospitalName || "MediFlow Hospital",
      });
    }

    Object.assign(settings, updates, { updatedBy: req.user.id, isActive: true });
    await settings.save();

    await CreationLog.create({
      creatorId: req.user.id,
      creatorName: req.user.name || "System",
      creatorRole: normalizeSystemRole(req.user.role),
      createdUserId: req.user.id,
      createdUserName: req.user.name || "System",
      createdUserEmail: req.user.email || "system@mediflow.local",
      createdUserRole: normalizeSystemRole(req.user.role),
      action: "updated",
    });

    return res.json({
      message: "Hospital settings updated successfully.",
      settings,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
