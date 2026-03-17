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
import { normalizeSystemRole, ID_PREFIXES } from "../constants/roles.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateUniqueId } from "../utils/idGenerator.js";

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
  education: doctor.education || [],
  certifications: doctor.certifications || [],
  licenseNumber: doctor.licenseNumber,
  licenseExpiryDate: doctor.licenseExpiryDate,
  joiningDate: doctor.joiningDate,
  roomNumber: doctor.roomNumber,
  emergencyContactName: doctor.emergencyContactName,
  emergencyContactNumber: doctor.emergencyContactNumber,
  emergencyContactRelationship: doctor.emergencyContactRelationship,
  docLicense: doctor.docLicense,
  docEducation: doctor.docEducation,
  docAdditional: doctor.docAdditional,
  isActive: doctor.isActive,
  isPublished: doctor.isPublished,
  onboardingStatus: doctor.onboardingStatus,
  history: doctor.history || [],
  createdAt: doctor.createdAt,
  updatedAt: doctor.updatedAt,
  userId: doctor.userId,
});

export const createDoctor = async (req, res) => {
  let user;

  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      phone,
      alternativeContact,
      bloodGroup,
      address,
      city,
      state,
      postalCode,
      departmentId,
      specializationIds,
      hospitalLocations,
      title,
      qualifications,
      education,
      certifications,
      licenseNumber,
      licenseExpiryDate,
      joiningDate,
      roomNumber,
      emergencyContactName,
      emergencyContactNumber,
      emergencyContactRelationship,
      docLicense,
      docEducation,
      docAdditional,
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
    } = req.body;

    if ((!firstName || !lastName) && !req.body.name) {
      return res.status(400).json({ message: "First name, last name, email, and department are required." });
    }
    if (!email || !departmentId) {
      return res.status(400).json({ message: "Email and department are required." });
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
    const employeeId = await generateUniqueId(User, "employeeId", ID_PREFIXES.doctor);

    user = await User.create({
      name: req.body.name || `${firstName} ${lastName}`.trim(),
      firstName: firstName || req.body.name?.split(' ')[0],
      middleName,
      lastName: lastName || req.body.name?.split(' ').slice(1).join(' '),
      email,
      phone,
      alternativeContact,
      bloodGroup,
      address,
      city,
      state,
      postalCode,
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
      education: parseStringArray(education),
      certifications: parseStringArray(certifications),
      licenseNumber,
      licenseExpiryDate,
      joiningDate,
      roomNumber,
      emergencyContactName,
      emergencyContactNumber,
      emergencyContactRelationship,
      docLicense,
      docEducation,
      docAdditional,
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
      onboardingStatus: "created",
      history: [
        {
          action: "created",
          performedBy: {
            id: req.user.id,
            name: req.user.name || "System",
            role: normalizeSystemRole(req.user.role),
          },
          details: "Doctor profile created by Admin",
        },
      ],
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

    // Send welcome email with credentials
    const emailSubject = `Welcome to Mediflow Hospital - Your Doctor Account`;
    const emailBody = `Dear Dr. ${user.lastName || user.firstName},

Your doctor account has been successfully created in Mediflow Hospital Management System.

Here are your login credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Username: ${user.email}
Password: ${temporaryPassword}
Employee ID: ${user.employeeId}
Role: Doctor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Important: Please change your password after your first login.

To access your account, visit: ${process.env.FRONTEND_URL || 'https://your-hospital-url.com'}/employee/login

If you have any questions or issues, please contact the IT support team.

Best regards,
Mediflow Hospital Management System`;

    await sendEmail(user.email, emailSubject, emailBody);

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
    const filter = { isDeleted: { $ne: true } };

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

export const getDoctorsForBooking = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const filter = { isActive: true, isDeleted: { $ne: true } };

    if (departmentId) {
      filter.departmentId = departmentId;
    }

    const doctors = await Doctor.find(filter)
      .populate("userId", "name email phone profileImage")
      .populate("departmentId", "name")
      .populate("specializationIds", "name")
      .populate("hospitalLocations", "name city")
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
      firstName,
      middleName,
      lastName,
      email,
      phone,
      alternativeContact,
      bloodGroup,
      address,
      city,
      state,
      postalCode,
      departmentId,
      specializationIds,
      hospitalLocations,
      title,
      qualifications,
      education,
      certifications,
      licenseNumber,
      licenseExpiryDate,
      joiningDate,
      roomNumber,
      emergencyContactName,
      emergencyContactNumber,
      emergencyContactRelationship,
      docLicense,
      docEducation,
      docAdditional,
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

    if (firstName !== undefined) doctor.userId.firstName = firstName;
    if (middleName !== undefined) doctor.userId.middleName = middleName;
    if (lastName !== undefined) doctor.userId.lastName = lastName;
    
    if (req.body.name !== undefined) {
      doctor.userId.name = req.body.name;
    } else if (firstName !== undefined || lastName !== undefined) {
      doctor.userId.name = `${firstName ?? doctor.userId.firstName} ${lastName ?? doctor.userId.lastName}`.trim();
    }
    if (email && email !== doctor.userId.email) {
      const duplicate = await User.findOne({ _id: { $ne: doctor.userId._id }, email });
      if (duplicate) {
        return res.status(400).json({ message: "Email already exists." });
      }
      doctor.userId.email = email;
    }

    if (phone !== undefined) doctor.userId.phone = phone;
    if (alternativeContact !== undefined) doctor.userId.alternativeContact = alternativeContact;
    if (bloodGroup !== undefined) doctor.userId.bloodGroup = bloodGroup;
    if (address !== undefined) doctor.userId.address = address;
    if (city !== undefined) doctor.userId.city = city;
    if (state !== undefined) doctor.userId.state = state;
    if (postalCode !== undefined) doctor.userId.postalCode = postalCode;
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
    if (education !== undefined) doctor.education = parseStringArray(education);
    if (certifications !== undefined) doctor.certifications = parseStringArray(certifications);
    if (licenseNumber !== undefined) doctor.licenseNumber = licenseNumber;
    if (licenseExpiryDate !== undefined) doctor.licenseExpiryDate = licenseExpiryDate;
    if (joiningDate !== undefined) doctor.joiningDate = joiningDate;
    if (roomNumber !== undefined) doctor.roomNumber = roomNumber;
    if (emergencyContactName !== undefined) doctor.emergencyContactName = emergencyContactName;
    if (emergencyContactNumber !== undefined) doctor.emergencyContactNumber = emergencyContactNumber;
    if (emergencyContactRelationship !== undefined) doctor.emergencyContactRelationship = emergencyContactRelationship;
    if (docLicense !== undefined) doctor.docLicense = docLicense;
    if (docEducation !== undefined) doctor.docEducation = docEducation;
    if (docAdditional !== undefined) doctor.docAdditional = docAdditional;
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

    doctor.history.push({
      action: "updated",
      performedBy: {
        id: req.user.id,
        name: req.user.name || "System",
        role: normalizeSystemRole(req.user.role),
      },
      details: "Doctor profile updated by Admin",
    });

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

    doctor.history.push({
      action: doctor.isActive ? "activated" : "deactivated",
      performedBy: {
        id: req.user.id,
        name: req.user.name || "System",
        role: normalizeSystemRole(req.user.role),
      },
      details: `Doctor status changed to ${doctor.isActive ? "Active" : "Inactive"}`,
    });

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
    doctor.history.push({
      action: doctor.isPublished ? "published" : "unpublished",
      performedBy: {
        id: req.user.id,
        name: req.user.name || "System",
        role: normalizeSystemRole(req.user.role),
      },
      details: `Doctor visibility changed to ${doctor.isPublished ? "Published" : "Unpublished"}`,
    });

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

export const softDeleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("userId");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    doctor.isDeleted = true;
    doctor.isActive = false;
    doctor.isPublished = false;

    if (doctor.userId) {
      doctor.userId.isActive = false;
      doctor.userId.onboardingStatus = "suspended";
      await doctor.userId.save();
    }

    doctor.history.push({
      action: "deleted",
      performedBy: {
        id: req.user.id,
        name: req.user.name || "System",
        role: normalizeSystemRole(req.user.role),
      },
      details: "Doctor soft-deleted from the system",
    });

    await doctor.save();

    return res.json({
      message: "Doctor soft-deleted successfully.",
      id: doctor._id,
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
    const doctors = await Doctor.find({ isActive: true, isPublished: true, isDeleted: { $ne: true } })
      .populate("userId", "name email phone profileImage")
      .populate("departmentId", "name")
      .populate("specializationIds", "name")
      .populate("hospitalLocations", "name city")
      .sort({ createdAt: -1 });

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
