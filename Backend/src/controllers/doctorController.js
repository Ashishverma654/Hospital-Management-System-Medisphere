import bcrypt from "bcryptjs";
import crypto from "crypto";
import Award from "../models/Award.js";
import CreationLog from "../models/CreationLog.js";
import Department from "../models/Department.js";
import Doctor from "../models/Doctor.js";
import HospitalLocation from "../models/HospitalLocation.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import LabOrder from "../models/LabOrder.js";
import Specialization from "../models/Specialization.js";
import User from "../models/User.js";
import { normalizeSystemRole } from "../constants/roles.js";

const parseStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const parseIdArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value].filter(Boolean);
};

const parseObjectArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const sanitizeArticles = (value) =>
  parseObjectArray(value)
    .map((item) => ({
      title: item?.title?.trim() || "",
      date: item?.date?.trim() || "",
      link: item?.link?.trim() || "",
      image: item?.image?.trim() || "",
    }))
    .filter((item) => item.title || item.link || item.date || item.image);

const sanitizeMedia = (value) =>
  parseObjectArray(value)
    .map((item) => ({
      type: item?.type || "video",
      title: item?.title?.trim() || "",
      url: item?.url?.trim() || "",
      thumbnail: item?.thumbnail?.trim() || "",
    }))
    .filter((item) => item.title || item.url || item.thumbnail);

const sanitizeLocationFees = (value) =>
  parseObjectArray(value)
    .map((item) => ({
      locationId: item?.locationId,
      fee: Number(item?.fee) || 0,
    }))
    .filter((item) => item.locationId && item.fee >= 0);

const generateEmployeeId = async () => {
  let employeeId;
  let exists = true;

  while (exists) {
    employeeId = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
    exists = await User.findOne({ employeeId });
  }

  return employeeId;
};

const generateTemporaryPassword = () => `Doc@${crypto.randomBytes(4).toString("hex")}`;

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: normalizeSystemRole(user.role),
  employeeId: user.employeeId,
  profileImage: user.profileImage,
  isActive: user.isActive,
  onboardingStatus: user.onboardingStatus,
  mustResetPassword: user.mustResetPassword,
});

const determineDoctorOnboardingStatus = (doctor) => {
  if (!doctor.isActive) {
    return "suspended";
  }

  if (doctor.isPublished) {
    return "published";
  }

  const hasRequiredProfile =
    !!doctor.departmentId &&
    Array.isArray(doctor.specializationIds) &&
    doctor.specializationIds.length > 0 &&
    Array.isArray(doctor.hospitalLocations) &&
    doctor.hospitalLocations.length > 0 &&
    !!doctor.title &&
    Array.isArray(doctor.qualifications) &&
    doctor.qualifications.length > 0 &&
    !!doctor.about;

  return hasRequiredProfile ? "active" : "profileIncomplete";
};

const validateDoctorReferences = async ({ departmentId, specializationIds, locationIds }) => {
  const department = await Department.findOne({ _id: departmentId, isActive: true });
  if (!department) {
    return { error: "A valid active department is required." };
  }

  const specializationIdList = parseIdArray(specializationIds);
  const locationIdList = parseIdArray(locationIds);

  if (specializationIdList.length) {
    const specializations = await Specialization.find({
      _id: { $in: specializationIdList },
      isActive: true,
    });

    if (specializations.length !== specializationIdList.length) {
      return { error: "All selected specializations must be valid and active." };
    }

    const mismatched = specializations.find(
      (item) => item.departmentId.toString() !== departmentId.toString()
    );

    if (mismatched) {
      return { error: "Selected specializations must belong to the chosen department." };
    }
  }

  if (locationIdList.length) {
    const locations = await HospitalLocation.find({
      _id: { $in: locationIdList },
      isActive: true,
    });

    if (locations.length !== locationIdList.length) {
      return { error: "All selected hospital locations must be valid and active." };
    }
  }

  return {
    department,
    specializationIds: specializationIdList,
    locationIds: locationIdList,
  };
};

const buildDoctorPayload = (doctor) => ({
  id: doctor._id,
  title: doctor.title,
  departmentId: doctor.departmentId,
  specializationIds: doctor.specializationIds,
  qualifications: doctor.qualifications,
  experienceYears: doctor.experienceYears,
  consultationFee: doctor.consultationFee,
  consultationFeeVideo: doctor.consultationFeeVideo,
  consultationFeePhone: doctor.consultationFeePhone,
  about: doctor.about,
  expertise: doctor.expertise,
  articles: doctor.articles || [],
  media: doctor.media || [],
  hospitalLocations: doctor.hospitalLocations,
  locationFees: doctor.locationFees || [],
  profileImage: doctor.profileImage,
  isActive: doctor.isActive,
  isPublished: doctor.isPublished,
  isFeatured: doctor.isFeatured,
  featureOrder: doctor.featureOrder,
  onboardingStatus: doctor.onboardingStatus,
  createdAt: doctor.createdAt,
  updatedAt: doctor.updatedAt,
  userId: doctor.userId,
});

export const createDoctor = async (req, res) => {
  let user;

  try {
    const {
      name,
      email,
      phone,
      departmentId,
      specializationIds,
      hospitalLocations,
      title,
      qualifications,
      experienceYears,
      consultationFee,
      consultationFeeVideo,
      consultationFeePhone,
      about,
      expertise,
      articles,
      media,
      locationFees,
      profileImage,
      isPublished = false,
      isActive = true,
      isFeatured = false,
      featureOrder = 0,
    } = req.body;

    if (!name || !email || !departmentId) {
      return res.status(400).json({ message: "Name, email, and department are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const validated = await validateDoctorReferences({
      departmentId,
      specializationIds,
      locationIds: hospitalLocations,
    });

    if (validated.error) {
      return res.status(400).json({ message: validated.error });
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    const employeeId = await generateEmployeeId();

    user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "doctor",
      employeeId,
      createdBy: req.user.id,
      isActive,
      profileImage,
      onboardingStatus: "invited",
      mustResetPassword: true,
    });

    const doctor = new Doctor({
      userId: user._id,
      departmentId,
      specializationIds: validated.specializationIds,
      hospitalLocations: validated.locationIds,
      title: title || "Consultant",
      qualifications: parseStringArray(qualifications),
      experienceYears: Number(experienceYears) || 0,
      consultationFee: Number(consultationFee) || 0,
      consultationFeeVideo: consultationFeeVideo !== undefined && consultationFeeVideo !== null ? Number(consultationFeeVideo) || 0 : null,
      consultationFeePhone: consultationFeePhone !== undefined && consultationFeePhone !== null ? Number(consultationFeePhone) || 0 : null,
      about: about || "",
      expertise: parseStringArray(expertise),
      articles: sanitizeArticles(articles),
      media: sanitizeMedia(media),
      locationFees: sanitizeLocationFees(locationFees),
      profileImage: profileImage || user.profileImage,
      isActive,
      isPublished: Boolean(isPublished),
      isFeatured: Boolean(isFeatured),
      featureOrder: Number(featureOrder) || 0,
      onboardingStatus: "created",
    });

    doctor.onboardingStatus = determineDoctorOnboardingStatus(doctor);
    if (doctor.isPublished && doctor.onboardingStatus !== "published") {
      doctor.isPublished = false;
    }

    if (doctor.onboardingStatus === "profileIncomplete") {
      user.onboardingStatus = "profileIncomplete";
    }
    if (doctor.onboardingStatus === "published") {
      user.onboardingStatus = "active";
    }

    await user.save();
    await doctor.save();

    await CreationLog.create({
      creatorId: req.user.id,
      creatorName: req.user.name || "System",
      creatorRole: normalizeSystemRole(req.user.role),
      createdUserId: user._id,
      createdUserName: user.name,
      createdUserEmail: user.email,
      createdUserRole: "doctor",
      action: "created",
    });

    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate("userId", "name email phone employeeId profileImage isActive onboardingStatus mustResetPassword")
      .populate("departmentId", "name")
      .populate("specializationIds", "name departmentId")
      .populate("hospitalLocations", "name city state");

    return res.status(201).json({
      message: "Doctor created successfully.",
      doctor: buildDoctorPayload(populatedDoctor),
      temporaryCredential: {
        email: user.email,
        employeeId: user.employeeId,
        temporaryPassword,
      },
    });
  } catch (error) {
    if (user?._id) {
      await User.findByIdAndDelete(user._id);
    }
    return res.status(500).json({ message: error.message });
  }
};

export const getDoctorsAdmin = async (req, res) => {
  try {
    const { search, departmentId, isActive, isPublished, onboardingStatus } = req.query;
    const filter = {};

    if (departmentId) filter.departmentId = departmentId;
    if (typeof isActive === "string" && isActive !== "") filter.isActive = isActive === "true";
    if (typeof isPublished === "string" && isPublished !== "") filter.isPublished = isPublished === "true";
    if (onboardingStatus) filter.onboardingStatus = onboardingStatus;

    if (search) {
      const matchedUsers = await User.find({
        role: "doctor",
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      filter.userId = { $in: matchedUsers.map((item) => item._id) };
    }

    const doctors = await Doctor.find(filter)
      .populate("userId", "name email phone employeeId profileImage isActive onboardingStatus mustResetPassword")
      .populate("departmentId", "name")
      .populate("specializationIds", "name")
      .populate("hospitalLocations", "name city state")
      .sort({ createdAt: -1 });

    return res.json(doctors.map(buildDoctorPayload));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getDoctorAdminById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate("userId", "name email phone employeeId profileImage isActive onboardingStatus mustResetPassword createdAt updatedAt")
      .populate("departmentId", "name description")
      .populate("specializationIds", "name departmentId")
      .populate("hospitalLocations", "name city state address phone");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    return res.json(buildDoctorPayload(doctor));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateDoctorAdmin = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("userId");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const {
      name,
      email,
      phone,
      departmentId,
      specializationIds,
      hospitalLocations,
      title,
      qualifications,
      experienceYears,
      consultationFee,
      consultationFeeVideo,
      consultationFeePhone,
      about,
      expertise,
      articles,
      media,
      locationFees,
      profileImage,
      isPublished,
      isActive,
      isFeatured,
      featureOrder,
    } = req.body;

    const nextDepartmentId = departmentId || doctor.departmentId;
    const validated = await validateDoctorReferences({
      departmentId: nextDepartmentId,
      specializationIds: specializationIds ?? doctor.specializationIds,
      locationIds: hospitalLocations ?? doctor.hospitalLocations,
    });

    if (validated.error) {
      return res.status(400).json({ message: validated.error });
    }

    if (email && email !== doctor.userId.email) {
      const duplicate = await User.findOne({ _id: { $ne: doctor.userId._id }, email });
      if (duplicate) {
        return res.status(400).json({ message: "Email already exists." });
      }
      doctor.userId.email = email;
    }

    if (name) doctor.userId.name = name;
    if (phone !== undefined) doctor.userId.phone = phone;
    if (profileImage !== undefined) {
      doctor.userId.profileImage = profileImage;
      doctor.profileImage = profileImage;
    }
    if (typeof isActive === "boolean") {
      doctor.userId.isActive = isActive;
      doctor.isActive = isActive;
      doctor.userId.onboardingStatus = isActive ? doctor.userId.onboardingStatus : "suspended";
    }

    doctor.departmentId = nextDepartmentId;
    doctor.specializationIds = validated.specializationIds;
    doctor.hospitalLocations = validated.locationIds;
    doctor.title = title ?? doctor.title;
    if (qualifications !== undefined) doctor.qualifications = parseStringArray(qualifications);
    if (experienceYears !== undefined) doctor.experienceYears = Number(experienceYears) || 0;
    if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee) || 0;
    if (consultationFeeVideo !== undefined) doctor.consultationFeeVideo = consultationFeeVideo === null || consultationFeeVideo === '' ? null : Number(consultationFeeVideo) || 0;
    if (consultationFeePhone !== undefined) doctor.consultationFeePhone = consultationFeePhone === null || consultationFeePhone === '' ? null : Number(consultationFeePhone) || 0;
    if (about !== undefined) doctor.about = about;
    if (expertise !== undefined) doctor.expertise = parseStringArray(expertise);
    if (articles !== undefined) doctor.articles = sanitizeArticles(articles);
    if (media !== undefined) doctor.media = sanitizeMedia(media);
    if (locationFees !== undefined) doctor.locationFees = sanitizeLocationFees(locationFees);
    if (typeof isPublished === "boolean") doctor.isPublished = isPublished;
    if (typeof isFeatured === "boolean") doctor.isFeatured = isFeatured;
    if (featureOrder !== undefined) doctor.featureOrder = Number(featureOrder) || 0;

    doctor.onboardingStatus = determineDoctorOnboardingStatus(doctor);
    if (doctor.onboardingStatus !== "published") {
      doctor.isPublished = false;
    }

    doctor.userId.onboardingStatus =
      doctor.onboardingStatus === "profileIncomplete"
        ? "profileIncomplete"
        : doctor.isActive
          ? "active"
          : "suspended";

    await doctor.userId.save();
    await doctor.save();

    const refreshedDoctor = await Doctor.findById(doctor._id)
      .populate("userId", "name email phone employeeId profileImage isActive onboardingStatus mustResetPassword")
      .populate("departmentId", "name")
      .populate("specializationIds", "name departmentId")
      .populate("hospitalLocations", "name city state");

    return res.json({
      message: "Doctor profile updated successfully.",
      doctor: buildDoctorPayload(refreshedDoctor),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleDoctorActive = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("userId");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    doctor.isActive = !doctor.isActive;
    doctor.userId.isActive = doctor.isActive;
    doctor.onboardingStatus = determineDoctorOnboardingStatus(doctor);
    doctor.userId.onboardingStatus = doctor.isActive ? "active" : "suspended";
    if (!doctor.isActive) {
      doctor.isPublished = false;
    }

    await doctor.userId.save();
    await doctor.save();

    return res.json({
      message: `Doctor ${doctor.isActive ? "activated" : "deactivated"} successfully.`,
      doctor: buildDoctorPayload(doctor),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleDoctorPublished = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("userId");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const nextPublished = !doctor.isPublished;
    if (nextPublished) {
      const nextStatus = determineDoctorOnboardingStatus({
        ...doctor.toObject(),
        isPublished: true,
        isActive: doctor.isActive,
      });

      if (nextStatus !== "published") {
        return res.status(400).json({
          message: "Doctor profile must include department, specializations, locations, qualifications, title, and bio before publishing.",
        });
      }
    }

    doctor.isPublished = nextPublished;
    doctor.onboardingStatus = determineDoctorOnboardingStatus(doctor);
    doctor.userId.onboardingStatus = doctor.isPublished ? "active" : doctor.userId.onboardingStatus;
    await doctor.userId.save();
    await doctor.save();

    return res.json({
      message: `Doctor ${doctor.isPublished ? "published" : "unpublished"} successfully.`,
      doctor: buildDoctorPayload(doctor),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const uploadDoctorProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided." });
    }

    const doctor = await Doctor.findById(req.params.id).populate("userId");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    doctor.profileImage = req.file.path;
    doctor.userId.profileImage = req.file.path;
    await doctor.userId.save();
    await doctor.save();

    return res.json({
      message: "Doctor profile image updated successfully.",
      doctor: buildDoctorPayload(doctor),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true, isPublished: true })
      .populate("userId", "name email phone profileImage")
      .populate("departmentId", "name")
      .populate("specializationIds", "name")
      .populate("hospitalLocations", "name city")
      .sort({ isFeatured: -1, featureOrder: 1, createdAt: -1 });

    res.status(200).json(doctors);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    let doctor = await Doctor.findOne({ _id: id, isActive: true, isPublished: true })
      .populate("userId", "name email phone profileImage")
      .populate("departmentId", "name description")
      .populate("specializationIds", "name")
      .populate("hospitalLocations", "name city state");

    if (!doctor) {
      doctor = await Doctor.findOne({ userId: id, isActive: true, isPublished: true })
        .populate("userId", "name email phone profileImage")
        .populate("departmentId", "name description")
        .populate("specializationIds", "name")
        .populate("hospitalLocations", "name city state");
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const awards = await Award.find({
      doctorId: doctor._id,
      type: "doctor",
      isActive: true,
    }).sort({ year: -1, createdAt: -1 });

    res.json({
      ...doctor.toObject(),
      awards,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Doctor Dashboard
export const getDoctorDashboard = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id })
      .populate("userId", "name email phone profileImage employeeId")
      .populate("departmentId", "name");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }

    const today = new Date().toISOString().split("T")[0];
    // Today's appointment stats
    const todayAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: today,
    });

    const todayStats = {
      total: todayAppointments.length,
      completed: todayAppointments.filter((a) => a.status === "completed").length,
      inProgress: todayAppointments.filter((a) =>
        ["arrived", "checked-in", "inConsultation"].includes(a.status)
      ).length,
      pending: todayAppointments.filter((a) =>
        ["booked", "confirmed"].includes(a.status)
      ).length,
    };

    // Upcoming appointments
    const upcomingAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: { $gt: today },
      status: { $ne: "cancelled" },
    })
      .limit(5)
      .sort({ date: 1, slot: 1 })
      .populate("patientId", "name email phone");

    // Recent prescriptions
    const recentPrescriptions = await Prescription.find({
      doctorId: doctor._id,
    })
      .limit(5)
      .sort({ createdAt: -1 });

    // Pending lab orders
    const pendingLabOrders = await LabOrder.find({
      doctorId: doctor._id,
      status: { $in: ["ordered", "awaitingPayment", "paid", "sampleCollected", "inProcessing", "pending", "inProgress"] },
    }).limit(5);

    res.json({
      success: true,
      data: {
        doctor: doctor,
        todayStats,
        upcomingAppointments,
        recentPrescriptions,
        pendingLabOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
