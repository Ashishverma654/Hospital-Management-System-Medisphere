import Bed from "../models/Bed.js";
import Department from "../models/Department.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import Ward from "../models/Ward.js";
import { resolvePatientContext } from "../utils/patientContext.js";
import { logAudit } from "../services/auditLogService.js";

const asOptionalObjectId = (value) => (value ? value : undefined);
const asOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const mapRecommendation = (prescription) =>
  prescription
    ? {
        prescriptionId: prescription._id,
        admissionRecommended: Boolean(prescription.admissionRecommended),
        admissionRecommendationNotes: prescription.admissionRecommendationNotes || "",
        diagnosis: prescription.diagnosis || prescription.clinicalNotes || "",
        advice: prescription.advice || "",
        createdAt: prescription.createdAt,
        doctor: prescription.doctorId
          ? {
              id: prescription.doctorId._id,
              name: prescription.doctorId.userId?.name,
              email: prescription.doctorId.userId?.email,
            }
          : null,
      }
    : null;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildBedFilter = ({ wardId, status, search, isActive }) => {
  const filter = {};

  if (wardId) filter.wardId = wardId;
  if (status) filter.status = status;
  if (typeof isActive === "string" && isActive !== "") {
    filter.isActive = isActive === "true";
  }
  if (search?.trim()) {
    filter.$or = [
      { bedNumber: { $regex: search.trim(), $options: "i" } },
      { ward: { $regex: search.trim(), $options: "i" } },
    ];
  }

  return filter;
};

const getLatestPrescriptionMap = async (patientIds) => {
  if (!patientIds.length) return new Map();

  const prescriptions = await Prescription.find({
    patientId: { $in: patientIds },
    status: { $ne: "cancelled" },
  })
    .populate({ path: "doctorId", populate: { path: "userId", select: "name email" } })
    .sort({ createdAt: -1 });

  const map = new Map();
  prescriptions.forEach((prescription) => {
    const key = String(prescription.patientId);
    if (!map.has(key)) {
      map.set(key, prescription);
    }
  });
  return map;
};

const mapBed = (bed, recommendation) => ({
  _id: bed._id,
  bedNumber: bed.bedNumber,
  ward: bed.ward,
  wardId: bed.wardId
    ? {
        _id: bed.wardId._id,
        name: bed.wardId.name,
        wardNumber: bed.wardId.wardNumber,
        wardType: bed.wardId.wardType,
        defaultPrice: bed.wardId.defaultPrice,
      }
    : null,
  type: bed.type,
  status: bed.status,
  isActive: bed.isActive,
  customPriceOverride: bed.customPriceOverride,
  effectivePrice: bed.customPriceOverride ?? bed.wardId?.defaultPrice ?? 0,
  admittedAt: bed.admittedAt,
  dischargedAt: bed.dischargedAt,
  patient: bed.patientProfileId
    ? {
        id: bed.patientProfileId._id,
        name: bed.patientProfileId.userId?.name || bed.patientId?.name,
        patientId: bed.patientProfileId.userId?.patientId || bed.patientId?.patientId,
        gender: bed.patientProfileId.gender,
        age: bed.patientProfileId.age,
      }
    : null,
  admissionRecommendation: recommendation || null,
  admissionHistory: (bed.admissionHistory || []).map((entry) => ({
    patientProfileId: entry.patientProfileId,
    patientId: entry.patientId,
    doctorId: entry.doctorId,
    prescriptionId: entry.prescriptionId,
    admissionRecommended: entry.admissionRecommended,
    admissionRecommendationNotes: entry.admissionRecommendationNotes,
    admittedAt: entry.admittedAt,
    dischargedAt: entry.dischargedAt,
    status: entry.status,
  })),
});

export const createBed = async (req, res) => {
  try {
    const ward = await Ward.findById(req.body.wardId);
    if (!ward) {
      return res.status(404).json({ message: "Ward not found." });
    }

    let bedNumber = req.body.bedNumber?.trim();

    // Auto-generate bed number if not provided
    if (!bedNumber) {
      const code = ward.wardCode || ward.wardNumber;
      const existingCount = await Bed.countDocuments({ wardId: ward._id });
      bedNumber = `BED-${code}-${existingCount + 1}`;

      // Ensure uniqueness
      let counter = existingCount + 1;
      while (await Bed.findOne({ bedNumber })) {
        counter++;
        bedNumber = `BED-${code}-${counter}`;
      }
    } else {
      const existing = await Bed.findOne({ bedNumber });
      if (existing) {
        return res.status(400).json({ message: "Bed number already exists." });
      }
    }

    const bed = await Bed.create({
      bedNumber,
      ward: ward.name,
      wardId: ward._id,
      type: ward.wardType,
      status: req.body.status || "available",
      customPriceOverride: asOptionalNumber(req.body.customPriceOverride),
      isActive: req.body.isActive ?? true,
    });

    res.status(201).json({
      message: "Bed created successfully.",
      bed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBed = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id).populate("wardId");
    if (!bed) {
      return res.status(404).json({ message: "Bed not found." });
    }

    if (req.body.wardId && String(req.body.wardId) !== String(bed.wardId?._id) && bed.status === "occupied") {
      return res.status(400).json({ message: "Occupied beds cannot be moved to another ward." });
    }

    if (req.body.status && req.body.status !== "occupied" && bed.status === "occupied") {
      return res.status(400).json({ message: "Use discharge workflow before changing an occupied bed status." });
    }

    if (req.body.bedNumber && req.body.bedNumber !== bed.bedNumber) {
      const existing = await Bed.findOne({ bedNumber: req.body.bedNumber, _id: { $ne: bed._id } });
      if (existing) {
        return res.status(400).json({ message: "Bed number already exists." });
      }
    }

    let ward = bed.wardId;
    if (req.body.wardId) {
      ward = await Ward.findById(req.body.wardId);
      if (!ward) {
        return res.status(404).json({ message: "Ward not found." });
      }
      bed.wardId = ward._id;
      bed.ward = ward.name;
      bed.type = ward.wardType;
    }

    if (req.body.bedNumber !== undefined) bed.bedNumber = req.body.bedNumber;
    if (req.body.status !== undefined) bed.status = req.body.status;
    if (req.body.isActive !== undefined) bed.isActive = req.body.isActive;
    if (req.body.customPriceOverride !== undefined) {
      bed.customPriceOverride = asOptionalNumber(req.body.customPriceOverride);
    }

    await bed.save();

    const populated = await Bed.findById(bed._id)
      .populate("wardId", "name wardNumber wardType defaultPrice")
      .populate("patientId", "name patientId")
      .populate({ path: "patientProfileId", populate: { path: "userId", select: "name patientId" } });

    res.json({
      message: "Bed updated successfully.",
      bed: mapBed(populated, null),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBeds = async (req, res) => {
  try {
    const filter = buildBedFilter(req.query);
    const departmentName = req.query.departmentName?.trim();
    let departmentId = req.query.departmentId?.trim();
    const wardName = req.query.wardName?.trim();

    if (!departmentId && departmentName) {
      const department = await Department.findOne({
        name: { $regex: `^${escapeRegex(departmentName)}$`, $options: "i" },
      }).select("_id");
      if (!department) {
        return res.json([]);
      }
      departmentId = department._id;
    }

    if (departmentId || wardName) {
      const wardQuery = {};
      if (departmentId) wardQuery.departmentId = departmentId;
      if (wardName) {
        const wardPattern = escapeRegex(wardName.trim());
        wardQuery.$or = [
          { name: { $regex: wardPattern, $options: "i" } },
          { wardNumber: { $regex: wardPattern, $options: "i" } },
          { wardCode: { $regex: wardPattern, $options: "i" } },
        ];
      }

      const wardIds = (await Ward.find(wardQuery).select("_id")).map((ward) => String(ward._id));
      if (!wardIds.length) {
        return res.json([]);
      }

      if (filter.wardId) {
        const wardIdValue = String(filter.wardId);
        if (!wardIds.includes(wardIdValue)) {
          return res.json([]);
        }
        filter.wardId = wardIdValue;
      } else {
        filter.wardId = { $in: wardIds };
      }
    }

    const beds = await Bed.find(filter)
      .populate("wardId", "name wardNumber wardType defaultPrice")
      .populate("patientId", "name patientId")
      .populate({ path: "patientProfileId", populate: { path: "userId", select: "name email patientId" } })
      .sort({ createdAt: -1, bedNumber: 1 });

    const patientIds = [...new Set(beds.map((bed) => bed.patientProfileId?._id?.toString()).filter(Boolean))];
    const latestPrescriptionMap = await getLatestPrescriptionMap(patientIds);

    res.json(
      beds.map((bed) => mapBed(bed, latestPrescriptionMap.get(String(bed.patientProfileId?._id)) ? mapRecommendation(latestPrescriptionMap.get(String(bed.patientProfileId?._id))) : null))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCurrentAdmissions = async (req, res) => {
  try {
    const { search = "", wardId } = req.query;
    const filter = { status: "occupied" };
    if (wardId) {
      filter.wardId = wardId;
    }

    const beds = await Bed.find(filter)
      .populate("wardId", "name wardNumber wardType defaultPrice")
      .populate({ path: "patientProfileId", populate: { path: "userId", select: "name patientId phone" } })
      .sort({ admittedAt: -1 });

    const patientIds = beds.map((bed) => bed.patientProfileId?._id).filter(Boolean);
    const latestPrescriptionMap = await getLatestPrescriptionMap(patientIds.map(String));

    const admissions = beds
      .map((bed) => {
        const prescription = latestPrescriptionMap.get(String(bed.patientProfileId?._id));
        const recommendation = mapRecommendation(prescription);
        const haystack = [
          bed.patientProfileId?.userId?.name,
          bed.patientProfileId?.userId?.patientId,
          bed.bedNumber,
          bed.wardId?.name,
          recommendation?.doctor?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (search.trim() && !haystack.includes(search.trim().toLowerCase())) {
          return null;
        }

        return {
          id: bed._id,
          bedNumber: bed.bedNumber,
          admittedAt: bed.admittedAt,
          ward: bed.wardId
            ? {
                id: bed.wardId._id,
                name: bed.wardId.name,
                wardNumber: bed.wardId.wardNumber,
                wardType: bed.wardId.wardType,
              }
            : null,
          patient: bed.patientProfileId
            ? {
                id: bed.patientProfileId._id,
                name: bed.patientProfileId.userId?.name,
                patientId: bed.patientProfileId.userId?.patientId,
                phone: bed.patientProfileId.userId?.phone,
              }
            : null,
          doctor: recommendation?.doctor || null,
          admissionRecommendation: recommendation,
          effectivePrice: bed.customPriceOverride ?? bed.wardId?.defaultPrice ?? 0,
          status: bed.status,
        };
      })
      .filter(Boolean);

    res.json(admissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdmissionCandidates = async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";

    const userFilter = { role: "patient" };
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(userFilter)
      .select("name patientId phone email")
      .sort({ createdAt: -1 })
      .limit(25);

    const patients = await Patient.find({ userId: { $in: users.map((user) => user._id) } })
      .populate("userId", "name patientId phone email")
      .populate("primaryDoctorId")
      .sort({ createdAt: -1 });

    const patientMap = new Map(patients.map((patient) => [String(patient.userId?._id), patient]));
    const patientIds = patients.map((patient) => patient._id);
    const latestPrescriptionMap = await getLatestPrescriptionMap(patientIds.map(String));

    const occupiedPatientIds = new Set(
      (await Bed.find({ status: "occupied", patientProfileId: { $exists: true, $ne: null } }).select("patientProfileId")).map((bed) =>
        String(bed.patientProfileId)
      )
    );

    const results = users
      .map((user) => {
        const patient = patientMap.get(String(user._id));
        if (!patient) return null;
        const prescription = latestPrescriptionMap.get(String(patient._id));

        return {
          id: patient._id,
          patientId: user.patientId,
          name: user.name,
          phone: user.phone,
          email: user.email,
          gender: patient.gender,
          age: patient.age,
          allergies: patient.allergies || [],
          chronicDiseases: patient.chronicDiseases || [],
          admissionRecommendation: mapRecommendation(prescription),
          isCurrentlyAdmitted: occupiedPatientIds.has(String(patient._id)),
        };
      })
      .filter(Boolean);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignBed = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id).populate("wardId");
    if (!bed) {
      return res.status(404).json({ message: "Bed not found." });
    }

    if (bed.status !== "available") {
      return res.status(400).json({ message: "Only available beds can be assigned." });
    }

    const { patient, user } = await resolvePatientContext(req.body.patientId);
    const existingAdmission = await Bed.findOne({
      _id: { $ne: bed._id },
      patientProfileId: patient._id,
      status: "occupied",
    });

    if (existingAdmission) {
      return res.status(400).json({ message: "This patient is already admitted to another bed." });
    }

    const prescriptionId = asOptionalObjectId(req.body.prescriptionId);
    const prescription = prescriptionId
      ? await Prescription.findById(prescriptionId).populate({ path: "doctorId", populate: { path: "userId", select: "name email" } })
      : await Prescription.findOne({
          patientId: patient._id,
          admissionRecommended: true,
          status: { $ne: "cancelled" },
        })
          .populate({ path: "doctorId", populate: { path: "userId", select: "name email" } })
          .sort({ createdAt: -1 });

    bed.status = "occupied";
    bed.patientId = user._id;
    bed.patientProfileId = patient._id;
    bed.admittedAt = req.body.admittedAt || new Date();
    bed.dischargedAt = null;
    bed.admissionHistory.push({
      patientId: user._id,
      patientProfileId: patient._id,
      doctorId: prescription?.doctorId?._id,
      prescriptionId: prescription?._id,
      admissionRecommended: Boolean(prescription?.admissionRecommended),
      admissionRecommendationNotes: prescription?.admissionRecommendationNotes || req.body.admissionRecommendationNotes,
      admittedAt: bed.admittedAt,
      admittedBy: req.user.id,
      status: "admitted",
    });

    await bed.save();

    // Sync ward occupiedBeds
    if (bed.wardId?._id) {
      await Ward.findByIdAndUpdate(bed.wardId._id, { $inc: { occupiedBeds: 1 } });
    }

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "patient_admitted",
      entityType: "Bed",
      entityId: bed._id,
      details: { bedNumber: bed.bedNumber, patientId: user._id },
    });

    const populated = await Bed.findById(bed._id)
      .populate("wardId", "name wardNumber wardType defaultPrice")
      .populate("patientId", "name patientId")
      .populate({ path: "patientProfileId", populate: { path: "userId", select: "name patientId phone" } });

    res.json({
      message: "Patient admitted successfully.",
      bed: mapBed(populated, mapRecommendation(prescription)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const dischargePatient = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);

    if (!bed) {
      return res.status(404).json({ message: "Bed not found." });
    }

    if (bed.status !== "occupied") {
      return res.status(400).json({ message: "This bed is not currently occupied." });
    }

    bed.status = "available";
    bed.dischargedAt = new Date();
    const historyEntry = [...(bed.admissionHistory || [])]
      .reverse()
      .find((entry) => entry.status === "admitted" && !entry.dischargedAt);
    if (historyEntry) {
      historyEntry.dischargedAt = bed.dischargedAt;
      historyEntry.dischargedBy = req.user.id;
      historyEntry.status = "discharged";
    }
    bed.patientId = null;
    bed.patientProfileId = null;

    await bed.save();

    // Sync ward occupiedBeds
    if (bed.wardId) {
      await Ward.findByIdAndUpdate(bed.wardId, { $inc: { occupiedBeds: -1 } });
    }

    res.json({
      message: "Patient discharged successfully.",
      bed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
