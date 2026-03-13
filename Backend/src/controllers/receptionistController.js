import bcrypt from "bcryptjs";
import Appointment from "../models/Appointment.js";
import Department from "../models/Department.js";
import Doctor from "../models/Doctor.js";
import Invoice from "../models/Invoice.js";
import Patient from "../models/Patient.js";
import Specialization from "../models/Specialization.js";
import User from "../models/User.js";
import { ensurePatientProfileForUser } from "../utils/patientContext.js";

const normalizeName = (value = "") => value.trim().replace(/\s+/g, " ");

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

const generateTemporaryPassword = () => `Pat@${Math.floor(100000 + Math.random() * 900000)}`;

const splitList = (value) => {
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

const mapPatientLookup = (patient) => ({
  id: patient._id,
  userId: patient.userId?._id,
  name: patient.userId?.name,
  email: patient.userId?.email,
  phone: patient.userId?.phone,
  patientId: patient.userId?.patientId,
  gender: patient.gender,
  dateOfBirth: patient.dateOfBirth,
  bloodGroup: patient.bloodGroup,
  isActive: patient.isActive && patient.userId?.isActive !== false,
  profileStatus: patient.profileStatus,
});

export const createReceptionistStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: "receptionist" });

    return res.status(201).json({
      message: "Receptionist created successfully.",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getReceptionistDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const todayStart = new Date(`${today}T00:00:00`);
    const todayEnd = new Date(`${today}T23:59:59.999`);

    const [todayAppointments, waitingAppointments, registrations, cancelledAppointments, pendingBilling] =
      await Promise.all([
        Appointment.find({ date: today })
          .populate("patientId", "name patientId email phone")
          .populate({
            path: "doctorId",
            populate: { path: "userId", select: "name" },
          })
          .sort({ slot: 1 })
          .limit(20),
        Appointment.find({ date: today, status: { $in: ["arrived", "waiting", "checked-in"] } })
          .populate("patientId", "name patientId")
          .populate({
            path: "doctorId",
            populate: { path: "userId", select: "name" },
          })
          .sort({ slot: 1 })
          .limit(20),
        Patient.find({ createdAt: { $gte: todayStart, $lte: todayEnd } })
          .populate("userId", "name patientId email phone")
          .sort({ createdAt: -1 })
          .limit(10),
        Appointment.find({ date: today, status: "cancelled" })
          .populate("patientId", "name patientId")
          .populate({
            path: "doctorId",
            populate: { path: "userId", select: "name" },
          })
          .sort({ updatedAt: -1 })
          .limit(10),
        Appointment.find({
          date: today,
          status: { $in: ["arrived", "waiting", "inConsultation", "completed"] },
        })
          .populate("patientId", "name patientId")
          .populate({
            path: "doctorId",
            populate: { path: "userId", select: "name" },
          })
          .sort({ slot: 1 }),
      ]);

    const billingInvoices = await Invoice.find({
      appointmentId: { $in: pendingBilling.map((item) => item._id) },
    }).select("appointmentId");

    const billedAppointmentIds = new Set(billingInvoices.map((invoice) => invoice.appointmentId?.toString()));
    const pendingBillingAppointments = pendingBilling.filter(
      (item) => !billedAppointmentIds.has(item._id.toString())
    );

    return res.json({
      date: today,
      stats: {
        todayAppointments: todayAppointments.length,
        waitingPatients: waitingAppointments.length,
        registrationsToday: registrations.length,
        cancelledToday: cancelledAppointments.length,
        pendingCheckIns: todayAppointments.filter((item) => item.status === "booked").length,
        pendingBillingActions: pendingBillingAppointments.length,
      },
      queue: todayAppointments,
      waitingQueue: waitingAppointments,
      registrations,
      cancelledAppointments,
      pendingBillingAppointments,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const registerPatientAtDesk = async (req, res) => {
  let user;

  try {
    const {
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      allergies,
      chronicDiseases,
      emergencyContact,
      insuranceProvider,
      insuranceNumber,
    } = req.body;

    if (!name || !email || !phone || !dateOfBirth) {
      return res.status(400).json({ message: "Name, email, phone, and date of birth are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A patient account already exists with this email or phone number.",
      });
    }

    const patientId = await generatePatientId();
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    user = await User.create({
      name: normalizeName(name),
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      role: "patient",
      patientId,
      gender,
      address,
      dob: dateOfBirth,
      createdBy: req.user.id,
      onboardingStatus: "passwordResetPending",
      mustResetPassword: true,
    });

    const { patient } = await ensurePatientProfileForUser(user._id, {
      dateOfBirth,
      gender,
      bloodGroup,
      allergies: splitList(allergies),
      chronicDiseases: splitList(chronicDiseases),
      emergencyContact: emergencyContact || {},
      insuranceProvider,
      insuranceNumber,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    const populatedPatient = await Patient.findById(patient._id).populate(
      "userId",
      "name email phone patientId gender dob address"
    );

    return res.status(201).json({
      message: "Patient registered successfully.",
      patient: mapPatientLookup(populatedPatient),
      temporaryCredential: {
        patientId,
        email: normalizedEmail,
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

export const searchPatientsForDesk = async (req, res) => {
  try {
    const { query = "" } = req.query;
    const trimmedQuery = query.trim();

    const userFilter = { role: "patient" };
    if (trimmedQuery) {
      if (/^[a-f\d]{24}$/i.test(trimmedQuery)) {
        const patientByProfile = await Patient.findById(trimmedQuery).populate(
          "userId",
          "name email phone patientId gender dob isActive"
        );
        if (patientByProfile) {
          return res.json({ patients: [mapPatientLookup(patientByProfile)] });
        }

        const patientByUser = await Patient.findOne({ userId: trimmedQuery }).populate(
          "userId",
          "name email phone patientId gender dob isActive"
        );
        if (patientByUser) {
          return res.json({ patients: [mapPatientLookup(patientByUser)] });
        }
      }

      userFilter.$or = [
        { name: { $regex: trimmedQuery, $options: "i" } },
        { email: { $regex: trimmedQuery, $options: "i" } },
        { phone: { $regex: trimmedQuery, $options: "i" } },
        { patientId: { $regex: trimmedQuery, $options: "i" } },
      ];
    }

    const users = await User.find(userFilter)
      .select("_id name email phone patientId gender dob isActive")
      .limit(20)
      .sort({ createdAt: -1 });

    const patients = await Patient.find({ userId: { $in: users.map((item) => item._id) } })
      .populate("userId", "name email phone patientId gender dob isActive")
      .sort({ createdAt: -1 });

    return res.json({
      patients: patients.map(mapPatientLookup),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getReceptionBookingOptions = async (req, res) => {
  try {
    const { departmentId, specializationId } = req.query;
    const doctorFilter = { isActive: true };

    if (departmentId) doctorFilter.departmentId = departmentId;
    if (specializationId) doctorFilter.specializationIds = specializationId;

    const [departments, specializations, doctors] = await Promise.all([
      Department.find({ isActive: true }).sort({ name: 1 }),
      Specialization.find({
        isActive: true,
        ...(departmentId ? { departmentId } : {}),
      })
        .populate("departmentId", "name")
        .sort({ name: 1 }),
      Doctor.find(doctorFilter)
        .populate("userId", "name email")
        .populate("departmentId", "name")
        .populate("specializationIds", "name")
        .sort({ createdAt: -1 }),
    ]);

    return res.json({
      departments,
      specializations,
      doctors,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
