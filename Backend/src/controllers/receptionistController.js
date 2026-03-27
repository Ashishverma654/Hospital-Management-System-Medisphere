import bcrypt from "bcryptjs";
import Appointment from "../models/Appointment.js";
import Department from "../models/Department.js";
import Doctor from "../models/Doctor.js";
import Invoice from "../models/Invoice.js";
import Patient from "../models/Patient.js";
import Specialization from "../models/Specialization.js";
import Admission from "../models/Admission.js";
import Prescription from "../models/Prescription.js";
import LabOrder from "../models/LabOrder.js";
import LabReport from "../models/LabReport.js";
import PharmacyOrder from "../models/PharmacyOrder.js";
import Token from "../models/Token.js";
import User from "../models/User.js";
import { ensurePatientProfileForUser, resolvePatientContext } from "../utils/patientContext.js";
import { generateUniqueId } from "../utils/idGenerator.js";
import { ID_PREFIXES } from "../constants/roles.js";

const normalizeName = (value = "") => value.trim().replace(/\s+/g, " ");


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

    const [todayAppointments, waitingAppointments, registrations, cancelledAppointments, pendingBilling, admittedToday] =
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
        Admission.countDocuments({
          status: { $in: ["Admitted", "Transferred"] },
          admissionDate: { $gte: todayStart, $lte: todayEnd },
        }),
      ]);

    const billingInvoices = await Invoice.find({
      appointmentId: { $in: pendingBilling.map((item) => item._id) },
    }).select("appointmentId");

    const billedAppointmentIds = new Set(billingInvoices.map((invoice) => invoice.appointmentId?.toString()));
    const pendingBillingAppointments = pendingBilling.filter(
      (item) => !billedAppointmentIds.has(item._id.toString())
    );

    const tokens = await Token.find({ appointmentId: { $in: todayAppointments.map((item) => item._id) } }).select(
      "appointmentId tokenNumber status"
    );
    const tokenMap = new Map(tokens.map((token) => [String(token.appointmentId), token]));
    const queueWithTokens = todayAppointments.map((appointment) => {
      const token = tokenMap.get(String(appointment._id));
      return {
        ...appointment.toObject(),
        tokenNumber: token?.tokenNumber,
        tokenStatus: token?.status,
      };
    });
    const sortedQueue = queueWithTokens
      .filter((item) => ["booked", "confirmed", "arrived", "waiting", "checked-in", "inConsultation"].includes(item.status))
      .sort((a, b) => {
        const aPriority = a.priority === "Emergency" ? 0 : 1;
        const bPriority = b.priority === "Emergency" ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        const aTime = a.checkInAt ? new Date(a.checkInAt) : new Date(a.createdAt);
        const bTime = b.checkInAt ? new Date(b.checkInAt) : new Date(b.createdAt);
        if (aTime.getTime() !== bTime.getTime()) return aTime.getTime() - bTime.getTime();
        return (a.tokenNumber || Number.MAX_SAFE_INTEGER) - (b.tokenNumber || Number.MAX_SAFE_INTEGER);
      });
    const positionMap = new Map(sortedQueue.map((item, index) => [String(item._id), index + 1]));

    return res.json({
      date: today,
      stats: {
        todayAppointments: todayAppointments.length,
        waitingPatients: waitingAppointments.length,
        arrivedPatients: todayAppointments.filter((item) => item.status === "arrived").length,
        admittedPatients: admittedToday,
        registrationsToday: registrations.length,
        cancelledToday: cancelledAppointments.length,
        pendingCheckIns: todayAppointments.filter((item) => item.status === "booked").length,
        pendingBillingActions: pendingBillingAppointments.length,
      },
      queue: sortedQueue.map((item) => ({
        ...item,
        queuePosition: positionMap.get(String(item._id)) || null,
      })),
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
      age,
      gender,
      address,
      bloodGroup,
      allergies,
      chronicDiseases,
      emergencyContact,
      insuranceProvider,
      insuranceNumber,
    } = req.body;

    if (!name || !phone || (!dateOfBirth && age === undefined)) {
      return res.status(400).json({ message: "Name, phone, and either date of birth or age are required." });
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : "";
    const fallbackEmail = normalizedEmail || `noemail+${phone}@mediflow.local`;
    const existingUser = await User.findOne(
      normalizedEmail
        ? { $or: [{ email: normalizedEmail }, { phone }] }
        : { phone }
    );

    if (existingUser) {
      return res.status(400).json({
        message: "A patient account already exists with this email or phone number.",
      });
    }

    const now = new Date();
    const resolvedDob = dateOfBirth
      ? new Date(dateOfBirth)
      : new Date(now.getFullYear() - Number(age || 0), 0, 1);

    const patientId = await generateUniqueId(User, "patientId", ID_PREFIXES.patient);
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    user = await User.create({
      name: normalizeName(name),
      email: fallbackEmail,
      phone,
      password: hashedPassword,
      role: "patient",
      patientId,
      gender,
      address,
      dob: resolvedDob,
      createdBy: req.user.id,
      onboardingStatus: "passwordResetPending",
      mustResetPassword: true,
    });

    const { patient } = await ensurePatientProfileForUser(user._id, {
      dateOfBirth: resolvedDob,
      age: age !== undefined ? Number(age) : undefined,
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
        email: fallbackEmail,
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
    const { query = "", departmentId, doctorId } = req.query;
    const trimmedQuery = query.trim();

    const userFilter = { role: "patient" };
    if (departmentId || doctorId) {
      let doctorIds = [];
      if (departmentId) {
        const doctors = await Doctor.find({ departmentId }).select("_id").lean();
        doctorIds = doctors.map((doc) => doc._id.toString());
      }

      if (doctorId) {
        if (doctorIds.length && !doctorIds.includes(doctorId)) {
          return res.json({ patients: [] });
        }
        doctorIds = doctorIds.length ? doctorIds.filter((id) => id === doctorId) : [doctorId];
      }

      if (!doctorIds.length) {
        return res.json({ patients: [] });
      }

      const appointmentUserIds = await Appointment.find({
        doctorId: { $in: doctorIds },
      }).distinct("patientId");

      userFilter._id = { $in: appointmentUserIds };
    }
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

export const getPatientHistoryForDesk = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { patient, user } = await resolvePatientContext(patientId);

    const [appointments, admissions, prescriptions, labOrders, labReports, pharmacyOrders] = await Promise.all([
      Appointment.find({
        $or: [{ patientId: user._id }, { patientProfileId: patient._id }],
      })
        .populate({
          path: "doctorId",
          populate: { path: "userId", select: "name" },
        })
        .sort({ date: -1 }),
      Admission.find({ patientProfileId: patient._id })
        .populate("wardId", "name wardNumber")
        .populate("bedId", "bedNumber")
        .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
        .sort({ admissionDate: -1 }),
      Prescription.find({ patientId: patient._id })
        .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
        .sort({ issuedAt: -1 })
        .limit(10),
      LabOrder.find({ patientId: patient._id })
        .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
        .sort({ createdAt: -1 })
        .limit(10),
      LabReport.find({ patientId: patient._id })
        .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
        .sort({ createdAt: -1 })
        .limit(10),
      PharmacyOrder.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return res.json({
      patient: {
        id: patient._id,
        name: user.name,
        patientId: user.patientId,
        phone: user.phone,
        email: user.email,
        bloodGroup: patient.bloodGroup,
        age: patient.age,
        gender: patient.gender,
      },
      appointments,
      admissions,
      discharges: admissions.filter((item) => item.status === "Discharged"),
      prescriptions: prescriptions.map((item) => ({
        id: item._id,
        issuedAt: item.issuedAt,
        diagnosis: item.diagnosis || item.clinicalNotes,
        advice: item.advice,
        status: item.status,
        doctor: item.doctorId?.userId?.name || "Doctor",
        admissionRecommended: Boolean(item.admissionRecommended),
        medicines: item.medicines || [],
      })),
      labOrders: labOrders.map((order) => ({
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        urgency: order.urgency,
        doctor: order.doctorId?.userId?.name || "Doctor",
        createdAt: order.createdAt,
        reportReadyAt: order.reportReadyAt,
        releasedToPortal: order.releasedToPortal,
      })),
      labReports: labReports.map((report) => ({
        id: report._id,
        reportName: report.reportName,
        reportType: report.reportType,
        status: report.status,
        releasedToPortal: report.releasedToPortal,
        releasedAt: report.releasedAt,
        doctor: report.doctorId?.userId?.name || "Doctor",
        createdAt: report.createdAt,
        fileUrl: report.reportFile,
      })),
      pharmacyOrders: pharmacyOrders.map((order) => ({
        id: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        items: order.items || [],
        orderedAt: order.orderedAt || order.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
