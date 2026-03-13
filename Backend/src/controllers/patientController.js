import Appointment from "../models/Appointment.js";
import Bed from "../models/Bed.js";
import Doctor from "../models/Doctor.js";
import Invoice from "../models/Invoice.js";
import LabOrder from "../models/LabOrder.js";
import LabReport from "../models/LabReport.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import { resolvePatientContext } from "../utils/patientContext.js";

const formatDateKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfDay = (dateValue) => {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (dateValue) => {
  const date = new Date(dateValue);
  date.setHours(23, 59, 59, 999);
  return date;
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

const mapPatientSummary = (patient) => ({
  id: patient._id,
  medicalRecordNumber: patient.medicalRecordNumber,
  profileStatus: patient.profileStatus,
  isActive: patient.isActive,
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
  dateOfBirth: patient.dateOfBirth,
  age: patient.age || calculateAge(patient.dateOfBirth),
  gender: patient.gender,
  bloodGroup: patient.bloodGroup,
  allergies: patient.allergies || [],
  chronicDiseases: patient.chronicDiseases || [],
  emergencyContact: patient.emergencyContact || {},
  insuranceProvider: patient.insuranceProvider,
  insuranceNumber: patient.insuranceNumber,
  notes: patient.notes,
  address: patient.userId?.address || "",
  user: patient.userId
    ? {
        id: patient.userId._id,
        name: patient.userId.name,
        email: patient.userId.email,
        phone: patient.userId.phone,
        patientId: patient.userId.patientId,
        gender: patient.userId.gender,
        dob: patient.userId.dob,
        isActive: patient.userId.isActive,
        createdAt: patient.userId.createdAt,
      }
    : null,
});

const buildTimeline = ({ patient, appointments, prescriptions, labOrders, labReports, invoices, bedEvents }) => {
  const events = [];

  if (patient?.createdAt) {
    events.push({
      type: "registration",
      title: "Patient registered",
      description: patient.userId?.name || "Patient record created",
      occurredAt: patient.createdAt,
    });
  }

  appointments.forEach((appointment) => {
    events.push({
      type: "appointment",
      title: `Appointment ${appointment.status}`,
      description: `${appointment.date} at ${appointment.slot}`,
      occurredAt: appointment.createdAt,
      id: appointment._id,
    });
  });

  prescriptions.forEach((prescription) => {
    events.push({
      type: "prescription",
      title: "Prescription issued",
      description: prescription.diagnosis || "Prescription created",
      occurredAt: prescription.createdAt,
      id: prescription._id,
    });
  });

  labOrders.forEach((order) => {
    events.push({
      type: "labOrder",
      title: `Lab order ${order.status}`,
      description: order.orderNumber || "Diagnostic order created",
      occurredAt: order.createdAt,
      id: order._id,
    });
  });

  labReports.forEach((report) => {
    events.push({
      type: "labReport",
      title: "Lab report uploaded",
      description: report.reportName,
      occurredAt: report.createdAt,
      id: report._id,
    });
  });

  invoices.forEach((invoice) => {
    events.push({
      type: "invoice",
      title: `Invoice ${invoice.paymentStatus}`,
      description: `${invoice.billType} bill`,
      occurredAt: invoice.createdAt,
      id: invoice._id,
    });
  });

  bedEvents.forEach((bed) => {
    if (bed.admittedAt) {
      events.push({
        type: "admission",
        title: "Patient admitted",
        description: `${bed.bedNumber}${bed.wardId?.name ? ` in ${bed.wardId.name}` : ""}`,
        occurredAt: bed.admittedAt,
        id: bed._id,
      });
    }
    if (bed.dischargedAt) {
      events.push({
        type: "discharge",
        title: "Patient discharged",
        description: `${bed.bedNumber}${bed.wardId?.name ? ` from ${bed.wardId.name}` : ""}`,
        occurredAt: bed.dischargedAt,
        id: bed._id,
      });
    }
  });

  return events.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
};

export const createPatient = async (req, res) => {
  try {
    const patient = new Patient({
      ...req.body,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    await patient.save();
    res.status(201).json({
      success: true,
      message: "Patient Profile Created.",
      data: patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate("userId");

    res.status(200).json({
      success: true,
      data: patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate("userId");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not Found.",
      });
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Patient Updated",
      data: patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAdminPatients = async (req, res) => {
  try {
    const { search = "", isActive, profileStatus, sort = "recent" } = req.query;

    const userFilter = { role: "patient" };
    if (typeof isActive === "string" && isActive !== "") {
      userFilter.isActive = isActive === "true";
    }

    if (search.trim()) {
      userFilter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
        { patientId: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const users = await User.find(userFilter).select(
      "_id name email phone patientId gender dob address isActive createdAt"
    );

    const patientFilter = { userId: { $in: users.map((user) => user._id) } };
    if (profileStatus) {
      patientFilter.profileStatus = profileStatus;
    }

    const patients = await Patient.find(patientFilter)
      .populate("userId", "name email phone patientId gender dob address isActive createdAt")
      .sort(sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 });

    return res.json({
      patients: patients.map(mapPatientSummary),
      total: patients.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAdminPatientById = async (req, res) => {
  try {
    const { patient, user } = await resolvePatientContext(req.params.id);

    const populatedPatient = await Patient.findById(patient._id)
      .populate("userId", "name email phone patientId gender dob address isActive createdAt")
      .populate({
        path: "primaryDoctorId",
        populate: { path: "userId", select: "name email" },
      })
      .populate("hospitalLocationId", "name city state address");

    const [appointments, prescriptions, labOrders, labReports, invoices, bedEvents] = await Promise.all([
      Appointment.find({
        $or: [{ patientProfileId: patient._id }, { patientId: user._id }],
      })
        .populate({
          path: "doctorId",
          populate: { path: "userId", select: "name email" },
        })
        .populate("hospitalLocationId", "name city")
        .sort({ createdAt: -1 })
        .limit(20),
      Prescription.find({ patientId: patient._id })
        .populate({
          path: "doctorId",
          populate: { path: "userId", select: "name email" },
        })
        .sort({ createdAt: -1 })
        .limit(20),
      LabOrder.find({ patientId: patient._id })
        .populate({
          path: "doctorId",
          populate: { path: "userId", select: "name email" },
        })
        .sort({ createdAt: -1 })
        .limit(20),
      LabReport.find({ patientId: patient._id })
        .populate({
          path: "doctorId",
          populate: { path: "userId", select: "name email" },
        })
        .sort({ createdAt: -1 })
        .limit(20),
      Invoice.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .limit(20),
      Bed.find({
        $or: [{ patientProfileId: patient._id }, { patientId: user._id }],
      })
        .populate("wardId", "name wardNumber")
        .sort({ updatedAt: -1 })
        .limit(10),
    ]);

    return res.json({
      patient: mapPatientSummary(populatedPatient),
      related: {
        appointments,
        prescriptions,
        labOrders,
        labReports,
        invoices,
        admissions: bedEvents,
      },
      timeline: buildTimeline({
        patient: populatedPatient,
        appointments,
        prescriptions,
        labOrders,
        labReports,
        invoices,
        bedEvents,
      }),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateAdminPatient = async (req, res) => {
  try {
    const { patient } = await resolvePatientContext(req.params.id);
    const currentPatient = await Patient.findById(patient._id).populate("userId");

    if (!currentPatient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    const {
      name,
      email,
      phone,
      gender,
      dateOfBirth,
      bloodGroup,
      address,
      emergencyContact,
      allergies,
      chronicDiseases,
      insuranceProvider,
      insuranceNumber,
      profileStatus,
      isActive,
      notes,
    } = req.body;

    if (email && email !== currentPatient.userId.email) {
      const duplicate = await User.findOne({
        _id: { $ne: currentPatient.userId._id },
        email,
      });

      if (duplicate) {
        return res.status(400).json({ message: "Email already exists." });
      }
      currentPatient.userId.email = email;
    }

    if (name !== undefined) currentPatient.userId.name = name;
    if (phone !== undefined) currentPatient.userId.phone = phone;
    if (address !== undefined) currentPatient.userId.address = address;
    if (gender !== undefined) currentPatient.userId.gender = gender;
    if (typeof isActive === "boolean") {
      currentPatient.userId.isActive = isActive;
      currentPatient.isActive = isActive;
    }

    if (dateOfBirth !== undefined) {
      currentPatient.dateOfBirth = dateOfBirth || null;
      currentPatient.userId.dob = dateOfBirth || null;
      currentPatient.age = calculateAge(dateOfBirth);
    }

    if (gender !== undefined) currentPatient.gender = gender;
    if (bloodGroup !== undefined) currentPatient.bloodGroup = bloodGroup || undefined;
    if (profileStatus !== undefined) currentPatient.profileStatus = profileStatus;
    if (notes !== undefined) currentPatient.notes = notes;
    if (insuranceProvider !== undefined) currentPatient.insuranceProvider = insuranceProvider;
    if (insuranceNumber !== undefined) currentPatient.insuranceNumber = insuranceNumber;
    if (emergencyContact !== undefined) currentPatient.emergencyContact = emergencyContact || {};
    if (allergies !== undefined) currentPatient.allergies = Array.isArray(allergies) ? allergies : [];
    if (chronicDiseases !== undefined) currentPatient.chronicDiseases = Array.isArray(chronicDiseases)
      ? chronicDiseases
      : [];
    currentPatient.updatedBy = req.user?.id;

    await currentPatient.userId.save();
    await currentPatient.save();

    const refreshedPatient = await Patient.findById(currentPatient._id).populate(
      "userId",
      "name email phone patientId gender dob address isActive createdAt"
    );

    return res.json({
      message: "Patient profile updated successfully.",
      patient: mapPatientSummary(refreshedPatient),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAdminPatientBoard = async (req, res) => {
  try {
    const date = req.query.date || formatDateKey();
    const rangeStart = startOfDay(date);
    const rangeEnd = endOfDay(date);
    const { doctorId, departmentId, status } = req.query;

    const appointmentFilter = { date };

    if (doctorId) {
      appointmentFilter.doctorId = doctorId;
    }

    if (status) {
      appointmentFilter.status = status;
    }

    if (departmentId) {
      const doctorIds = await Doctor.find({ departmentId }).distinct("_id");
      appointmentFilter.doctorId = doctorId
        ? doctorId
        : { $in: doctorIds };
    }

    const [registrations, appointments, admissions, discharges, cancellations] = await Promise.all([
      Patient.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd } })
        .populate("userId", "name patientId email phone")
        .sort({ createdAt: -1 })
        .limit(20),
      Appointment.find(appointmentFilter)
        .populate("patientId", "name patientId email phone")
        .populate({
          path: "doctorId",
          populate: { path: "userId", select: "name" },
        })
        .sort({ createdAt: -1 })
        .limit(20),
      Bed.find({ admittedAt: { $gte: rangeStart, $lte: rangeEnd } })
        .populate("patientId", "name patientId")
        .populate("patientProfileId")
        .sort({ admittedAt: -1 })
        .limit(20),
      Bed.find({ dischargedAt: { $gte: rangeStart, $lte: rangeEnd } })
        .populate("patientId", "name patientId")
        .populate("patientProfileId")
        .sort({ dischargedAt: -1 })
        .limit(20),
      Appointment.find({ ...appointmentFilter, status: "cancelled" })
        .populate("patientId", "name patientId email phone")
        .populate({
          path: "doctorId",
          populate: { path: "userId", select: "name" },
        })
        .sort({ updatedAt: -1 })
        .limit(20),
    ]);

    return res.json({
      date,
      summary: {
        registrations: registrations.length,
        appointments: appointments.length,
        admissions: admissions.length,
        discharges: discharges.length,
        cancellations: cancellations.length,
      },
      breakdown: {
        registrations: registrations.map((patient) => ({
          id: patient._id,
          name: patient.userId?.name,
          patientId: patient.userId?.patientId,
          email: patient.userId?.email,
          phone: patient.userId?.phone,
          createdAt: patient.createdAt,
        })),
        appointments: appointments.map((appointment) => ({
          id: appointment._id,
          status: appointment.status,
          slot: appointment.slot,
          date: appointment.date,
          patient: appointment.patientId,
          doctor: appointment.doctorId?.userId?.name || "Doctor",
          createdAt: appointment.createdAt,
        })),
        admissions: admissions.map((bed) => ({
          id: bed._id,
          bedNumber: bed.bedNumber,
          patientName: bed.patientId?.name,
          patientId: bed.patientId?.patientId,
          admittedAt: bed.admittedAt,
        })),
        discharges: discharges.map((bed) => ({
          id: bed._id,
          bedNumber: bed.bedNumber,
          patientName: bed.patientId?.name,
          patientId: bed.patientId?.patientId,
          dischargedAt: bed.dischargedAt,
        })),
        cancellations: cancellations.map((appointment) => ({
          id: appointment._id,
          status: appointment.status,
          slot: appointment.slot,
          date: appointment.date,
          patient: appointment.patientId,
          doctor: appointment.doctorId?.userId?.name || "Doctor",
          updatedAt: appointment.updatedAt,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
