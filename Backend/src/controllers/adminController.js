import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import Bed from "../models/Bed.js";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Nurse from "../models/Nurse.js";
import Pharmacist from "../models/Pharmacist.js";
import LabTechnician from "../models/LabTechnician.js";
import Receptionist from "../models/Receptionist.js";
import CreationLog from "../models/CreationLog.js";
import AuditLog from "../models/AuditLog.js";
import bcrypt from "bcryptjs";
import {
  CREATION_PERMISSIONS,
  getCreatableRolesForRole,
  getRoleLabel,
  normalizeSystemRole,
} from "../constants/roles.js";
import HospitalSettings from "../models/HospitalSettings.js";
import { logAudit } from "../services/auditLogService.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateUniqueId } from "../utils/idGenerator.js";
import { ID_PREFIXES } from "../constants/roles.js";

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
    const { 
      name, email, password, role, 
      firstName, middleName, lastName, 
      phone, alternativeContact, dob, gender, bloodGroup,
      address, city, state, postalCode, maritalStatus, nationality,
      profileImage,
      
      // Professional fields
      title, departmentId, joiningDate, roomNumber, experienceYears,
      qualifications, education, certifications, skills,
      licenseNumber, licenseExpiryDate, shift, specialization,
      emergencyContactName, emergencyContactNumber, emergencyContactRelationship,
      labSection
    } = req.body;

    const creatorRole = normalizeSystemRole(req.user.role);
    const creatorId = req.user.id;
    const normalizedTargetRole = normalizeSystemRole(role);

    // Validate required fields
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();
    if (!fullName || !email || !normalizedTargetRole) {
      return res.status(400).json({ message: "name, email, and role are required." });
    }

    // Check hierarchy permissions
    const allowedRoles = getCreatableRolesForRole(creatorRole);
    if (!allowedRoles.includes(normalizedTargetRole)) {
      return res.status(403).json({
        message: `A ${getRoleLabel(creatorRole)} cannot create a ${getRoleLabel(normalizedTargetRole)}. Allowed roles: ${allowedRoles.map(getRoleLabel).join(", ") || "none"}.`,
      });
    }

    // Check email uniqueness
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    // Auto-generate temporary password if not provided
    const tempPassword = password || Math.random().toString(36).slice(-12) + 'A1';
    const hashed = await bcrypt.hash(tempPassword, 10);

    // Generate employee ID
    const employeeId = await generateUniqueId(User, "employeeId", ID_PREFIXES[normalizedTargetRole] || "EMP");

    // Create user
    const user = await User.create({
      name: fullName,
      email,
      password: hashed,
      role: normalizedTargetRole,
      firstName,
      middleName,
      lastName,
      phone,
      alternativeContact,
      bloodGroup,
      city,
      state,
      postalCode,
      gender,
      address,
      maritalStatus,
      nationality,
      profileImage,
      dob,
      employeeId,
      createdBy: creatorId,
      onboardingStatus: "passwordResetPending",
      mustResetPassword: true,
    });

    // Create role-specific profile
    const profileData = {
      joiningDate: joiningDate || undefined,
      experienceYears: experienceYears ? Number(experienceYears) : 0,
      qualifications: qualifications || [],
      education: education || [],
      certifications: certifications || [],
      skills: skills || [],
      title: title || (normalizedTargetRole.charAt(0).toUpperCase() + normalizedTargetRole.slice(1)),
      emergencyContact: {
        name: emergencyContactName,
        phone: emergencyContactNumber,
        relationship: emergencyContactRelationship
      }
    };

    if (normalizedTargetRole === "nurse") {
      await Nurse.create({
        ...profileData,
        userId: user._id,
        departmentId: departmentId || undefined,
        licenseNumber,
        licenseExpiryDate: licenseExpiryDate || undefined,
        shift,
        specialization,
      });
    } else if (normalizedTargetRole === "pharmacist") {
      await Pharmacist.create({
        ...profileData,
        userId: user._id,
        licenseNumber,
        licenseExpiryDate: licenseExpiryDate || undefined,
        shift,
      });
    } else if (normalizedTargetRole === "labTechnician") {
      await LabTechnician.create({
        ...profileData,
        userId: user._id,
        departmentId: departmentId || undefined,
        licenseNumber,
        licenseExpiryDate: licenseExpiryDate || undefined,
        labSection: req.body.labSection,
      });
    } else if (normalizedTargetRole === "receptionist") {
      await Receptionist.create({
        ...profileData,
        user: user._id,
        employeeId: user.employeeId,
        department: departmentId || undefined,
      });
    } else if (normalizedTargetRole === "doctor") {
      // Create doctor profile if called from here (though usually called via doctorController)
      await Doctor.create({
        userId: user._id,
        departmentId: departmentId || undefined,
        title: title || "Consultant",
        qualifications: qualifications || [],
        experienceYears: experienceYears ? Number(experienceYears) : 0,
        about: req.body.about || "",
        onboardingStatus: "created",
      });
    }

    // Log the creation
    try {
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

      await logAudit({
        actor: { id: creatorId, name: creator?.name, role: creatorRole },
        action: "user_created",
        entityType: "User",
        entityId: user._id,
        details: { role: user.role, email: user.email },
      });
      console.log(`Creation Log & Audit Log created for user: ${user.email}`);
    } catch (logErr) {
      console.error("SECONDARY LOGGING ERROR (NON-BLOCKING):", logErr);
    }

    // Send welcome email with credentials
    try {
      const emailSubject = `Welcome to Mediflow Hospital - Your ${getRoleLabel(normalizedTargetRole)} Account`;
      const emailBody = `Dear ${user.name},
  
  Your account has been successfully created in Mediflow Hospital Management System.
  
  Here are your login credentials:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Username: ${user.email}
  Password: ${tempPassword}
  Role: ${getRoleLabel(normalizedTargetRole)}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  Important: Please change your password after your first login.
  
  To access your account, visit: ${process.env.FRONTEND_URL || 'https://your-hospital-url.com'}/employee/login
  
  If you have any questions or issues, please contact the IT support team.
  
  Best regards,
  Mediflow Hospital Management System`;
  
      await sendEmail(user.email, emailSubject, emailBody);
      console.log(`Welcome email sent to: ${user.email}`);
    } catch (emailErr) {
      console.error("EMAIL SENDING ERROR (NON-BLOCKING):", emailErr);
    }

    return res.status(201).json({
      message: `${getRoleLabel(role)} created successfully.`,
      user: {
        ...buildUserSummary(user),
        createdBy: creator?.name,
      },
      temporaryCredential: {
        temporaryPassword: tempPassword,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("ERROR IN CREATE_STAFF_USER:", error);
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

    const [creationLogs, auditLogs] = await Promise.all([
      CreationLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit)),
      AuditLog.find(requesterRole === "subadmin" ? { actorId: req.user.id } : {})
        .sort({ createdAt: -1 })
        .limit(Number(limit)),
    ]);

    const normalizedCreation = creationLogs.map((log) => ({
      ...log.toObject(),
      creatorRole: normalizeSystemRole(log.creatorRole),
      createdUserRole: normalizeSystemRole(log.createdUserRole),
    }));

    const normalizedAudit = auditLogs.map((log) => ({
      _id: log._id,
      action: log.action,
      creatorName: log.actorName,
      creatorRole: normalizeSystemRole(log.actorRole),
      createdUserName: `${log.entityType}${log.entityId ? ` ${String(log.entityId).slice(-6)}` : ""}`,
      createdUserRole: "system",
      createdAt: log.createdAt,
      details: log.details,
    }));

    const combined = [...normalizedCreation, ...normalizedAudit]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, Number(limit));

    const total = await CreationLog.countDocuments(filter);
    const auditTotal = await AuditLog.countDocuments(requesterRole === "subadmin" ? { actorId: req.user.id } : {});

    res.json({
      logs: combined,
      pagination: {
        total: total + auditTotal,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((total + auditTotal) / Number(limit)),
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

    await logAudit({
      actor: { id: req.user.id, name: creator?.name, role: normalizeSystemRole(req.user.role) },
      action: user.isActive ? "user_reactivated" : "user_deactivated",
      entityType: "User",
      entityId: user._id,
      details: { isActive: user.isActive },
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
