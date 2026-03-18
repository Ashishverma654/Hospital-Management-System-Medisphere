import Bed from "../models/Bed.js";
import Department from "../models/Department.js";
import Ward from "../models/Ward.js";
import AuditLog from "../models/AuditLog.js";
import { logAudit } from "../services/auditLogService.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildWardFilter = ({ search, isActive, wardType }) => {
  const filter = {};

  if (typeof isActive === "string" && isActive !== "") {
    filter.isActive = isActive === "true";
  }

  if (wardType) {
    filter.wardType = wardType;
  }

  if (search?.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { wardNumber: { $regex: search.trim(), $options: "i" } },
      { wardCode: { $regex: search.trim(), $options: "i" } },
      { floor: { $regex: search.trim(), $options: "i" } },
      { block: { $regex: search.trim(), $options: "i" } },
    ];
  }

  return filter;
};

const buildWardSummaryMap = async (wardIds) => {
  const counts = await Bed.aggregate([
    { $match: { wardId: { $in: wardIds } } },
    {
      $group: {
        _id: { wardId: "$wardId", status: "$status" },
        count: { $sum: 1 },
      },
    },
  ]);

  const summaryMap = new Map();
  counts.forEach((entry) => {
    const wardKey = String(entry._id.wardId);
    const summary = summaryMap.get(wardKey) || {
      totalBeds: 0,
      availableBeds: 0,
      occupiedBeds: 0,
      maintenanceBeds: 0,
      reservedBeds: 0,
    };

    summary.totalBeds += entry.count;
    if (entry._id.status === "available") summary.availableBeds += entry.count;
    if (entry._id.status === "occupied") summary.occupiedBeds += entry.count;
    if (entry._id.status === "maintenance") summary.maintenanceBeds += entry.count;
    if (entry._id.status === "reserved") summary.reservedBeds += entry.count;

    summaryMap.set(wardKey, summary);
  });

  return summaryMap;
};

const mapWard = (ward, bedSummary = {}) => ({
  _id: ward._id,
  name: ward.name,
  wardNumber: ward.wardNumber,
  wardCode: ward.wardCode,
  wardType: ward.wardType,
  departmentId: ward.departmentId,
  floor: ward.floor,
  block: ward.block,
  hospitalLocationId: ward.hospitalLocationId,
  bedCount: ward.bedCount,
  occupiedBeds: ward.occupiedBeds,
  availableBeds: ward.availableBeds,
  defaultPrice: ward.defaultPrice,
  wardInCharge: ward.wardInCharge,
  assignedDoctor: ward.assignedDoctor,
  nurseCount: ward.nurseCount,
  equipment: ward.equipment || [],
  cleaningStatus: ward.cleaningStatus,
  lastSanitized: ward.lastSanitized,
  contactNumber: ward.contactNumber,
  isActive: ward.isActive,
  createdAt: ward.createdAt,
  updatedAt: ward.updatedAt,
  bedSummary: {
    totalBeds: bedSummary.totalBeds || 0,
    availableBeds: bedSummary.availableBeds || 0,
    occupiedBeds: bedSummary.occupiedBeds || 0,
    maintenanceBeds: bedSummary.maintenanceBeds || 0,
    reservedBeds: bedSummary.reservedBeds || 0,
  },
});

const generateBedsForWard = async (ward, count, startFrom = 1) => {
  const code = ward.wardCode || ward.wardNumber;
  const beds = [];
  for (let i = 0; i < count; i++) {
    const num = startFrom + i;
    const bedNumber = `BED-${code}-${num}`;
    beds.push({
      bedNumber,
      ward: ward.name,
      wardId: ward._id,
      type: ward.wardType,
      status: "available",
      customPriceOverride: undefined,
      isActive: true,
    });
  }

  if (beds.length > 0) {
    await Bed.insertMany(beds, { ordered: false }).catch(() => {
      // If some beds already exist, insert individually
      return Promise.allSettled(beds.map((b) => Bed.create(b)));
    });
  }

  return beds.length;
};

export const listWards = async (req, res) => {
  try {
    const filter = buildWardFilter(req.query);
    const departmentName = req.query.departmentName?.trim();
    let departmentId = req.query.departmentId?.trim();

    if (!departmentId && departmentName) {
      const department = await Department.findOne({
        name: { $regex: `^${escapeRegex(departmentName)}$`, $options: "i" },
      }).select("_id");
      if (!department) {
        return res.json([]);
      }
      departmentId = department._id;
    }

    if (departmentId) {
      filter.departmentId = departmentId;
    }

    const wards = await Ward.find(filter)
      .populate("hospitalLocationId", "name city")
      .populate("departmentId", "name")
      .populate("wardInCharge", "name role")
      .populate({ path: "assignedDoctor", populate: { path: "userId", select: "name" } })
      .sort({ createdAt: -1 });

    const summaryMap = await buildWardSummaryMap(wards.map((ward) => ward._id));

    res.json(wards.map((ward) => mapWard(ward, summaryMap.get(String(ward._id)))));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWard = async (req, res) => {
  try {
    let { name, wardNumber, wardCode, bedCount = 0, occupiedBeds = 0, defaultPrice = 0 } = req.body;

    // Sanitization & Basic Validation
    name = name?.trim();
    wardNumber = wardNumber?.trim();
    if (!name || !wardNumber) {
      return res.status(400).json({ message: "Ward name and number are required." });
    }

    if (Number(bedCount) <= 0) {
      return res.status(400).json({ message: "Total beds must be greater than 0." });
    }

    if (Number(defaultPrice) < 0) {
      return res.status(400).json({ message: "Default price cannot be negative." });
    }

    if (Number(occupiedBeds) > Number(bedCount)) {
      return res.status(400).json({ message: "Occupied beds cannot exceed total bed count." });
    }

    // Auto-generate wardCode if not provided
    if (!wardCode) {
      wardCode = wardNumber.toUpperCase().replace(/\s+/g, "-");
    } else {
      wardCode = wardCode.trim().toUpperCase().replace(/\s+/g, "-");
    }

    // Check uniqueness
    const existing = await Ward.findOne({ $or: [{ wardNumber }, { wardCode }] });
    if (existing) {
      return res.status(400).json({ message: "Ward number or code already exists." });
    }

    const ward = await Ward.create({
      ...req.body,
      name,
      wardNumber,
      wardCode,
      bedCount: Number(bedCount),
      occupiedBeds: 0, // Force 0 on creation as per requirements
      defaultPrice: Number(defaultPrice),
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    // Auto-generate beds
    const bedsCreated = await generateBedsForWard(ward, Number(bedCount));

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "ward_created",
      entityType: "Ward",
      entityId: ward._id,
      details: { name: ward.name, wardCode: ward.wardCode, bedCount, bedsGenerated: bedsCreated },
    });

    res.status(201).json({
      message: `Ward created successfully with ${bedsCreated} beds auto-generated.`,
      ward,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateWard = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({ message: "Ward not found." });
    }

    const newBedCount = req.body.bedCount !== undefined ? Number(req.body.bedCount) : ward.bedCount;
    const currentOccupied = ward.occupiedBeds || 0;

    if (newBedCount < currentOccupied) {
      return res.status(400).json({
        message: `Cannot reduce bed count below occupied beds (${currentOccupied}).`,
      });
    }

    const oldBedCount = ward.bedCount;
    const oldWardCode = ward.wardCode;

    Object.assign(ward, {
      name: req.body.name ?? ward.name,
      wardNumber: req.body.wardNumber ?? ward.wardNumber,
      wardCode: req.body.wardCode ? req.body.wardCode.toUpperCase().replace(/\s+/g, "-") : ward.wardCode,
      wardType: req.body.wardType ?? ward.wardType,
      departmentId: req.body.departmentId ?? ward.departmentId,
      floor: req.body.floor ?? ward.floor,
      block: req.body.block ?? ward.block,
      hospitalLocationId: req.body.hospitalLocationId ?? ward.hospitalLocationId,
      bedCount: newBedCount,
      defaultPrice: req.body.defaultPrice ?? ward.defaultPrice,
      wardInCharge: req.body.wardInCharge ?? ward.wardInCharge,
      assignedDoctor: req.body.assignedDoctor ?? ward.assignedDoctor,
      nurseCount: req.body.nurseCount ?? ward.nurseCount,
      equipment: req.body.equipment ?? ward.equipment,
      cleaningStatus: req.body.cleaningStatus ?? ward.cleaningStatus,
      lastSanitized: req.body.lastSanitized ?? ward.lastSanitized,
      contactNumber: req.body.contactNumber ?? ward.contactNumber,
      isActive: req.body.isActive ?? ward.isActive,
      updatedBy: req.user.id,
    });
    await ward.save();

    // Sync beds meta
    await Bed.updateMany(
      { wardId: ward._id },
      { $set: { ward: ward.name, type: ward.wardType } }
    );

    // Auto-generate additional beds if bedCount increased
    let bedsGenerated = 0;
    if (newBedCount > oldBedCount) {
      const existingBedCount = await Bed.countDocuments({ wardId: ward._id });
      const toGenerate = newBedCount - existingBedCount;
      if (toGenerate > 0) {
        bedsGenerated = await generateBedsForWard(ward, toGenerate, existingBedCount + 1);
      }
    }

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "ward_updated",
      entityType: "Ward",
      entityId: ward._id,
      details: { name: ward.name, wardCode: ward.wardCode, bedsGenerated },
    });

    res.json({
      message: `Ward updated successfully.${bedsGenerated > 0 ? ` ${bedsGenerated} new beds generated.` : ""}`,
      ward,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleWardActive = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({ message: "Ward not found." });
    }

    ward.isActive = !ward.isActive;
    ward.updatedBy = req.user.id;
    await ward.save();

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: ward.isActive ? "ward_activated" : "ward_deactivated",
      entityType: "Ward",
      entityId: ward._id,
      details: { isActive: ward.isActive, name: ward.name },
    });

    res.json({
      message: `Ward ${ward.isActive ? "activated" : "deactivated"} successfully.`,
      ward,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWardDetail = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id)
      .populate("hospitalLocationId", "name city")
      .populate("departmentId", "name")
      .populate("wardInCharge", "name role")
      .populate({ path: "assignedDoctor", populate: { path: "userId", select: "name" } });

    if (!ward) {
      return res.status(404).json({ message: "Ward not found." });
    }

    const beds = await Bed.find({ wardId: ward._id })
      .populate("patientId", "name patientId")
      .populate({ path: "patientProfileId", populate: { path: "userId", select: "name patientId" } })
      .sort({ bedNumber: 1 });

    const summaryMap = await buildWardSummaryMap([ward._id]);

    res.json({
      ward: mapWard(ward, summaryMap.get(String(ward._id))),
      beds: beds.map((bed) => ({
        _id: bed._id,
        bedNumber: bed.bedNumber,
        status: bed.status,
        customPriceOverride: bed.customPriceOverride,
        effectivePrice: bed.customPriceOverride ?? ward.defaultPrice ?? 0,
        admittedAt: bed.admittedAt,
        dischargedAt: bed.dischargedAt,
        patient: bed.patientProfileId
          ? {
              id: bed.patientProfileId._id,
              name: bed.patientProfileId.userId?.name || bed.patientId?.name,
              patientId: bed.patientProfileId.userId?.patientId || bed.patientId?.patientId,
            }
          : null,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWardOccupancySummary = async (req, res) => {
  try {
    const [totalWards, totalBeds, availableBeds, occupiedBeds, maintenanceBeds, reservedBeds, wards] = await Promise.all([
      Ward.countDocuments({ isActive: true }),
      Bed.countDocuments(),
      Bed.countDocuments({ status: "available" }),
      Bed.countDocuments({ status: "occupied" }),
      Bed.countDocuments({ status: "maintenance" }),
      Bed.countDocuments({ status: "reserved" }),
      Ward.find({}).sort({ name: 1 }),
    ]);

    const summaryMap = await buildWardSummaryMap(wards.map((ward) => ward._id));

    res.json({
      totalWards,
      totalBeds,
      availableBeds,
      occupiedBeds,
      maintenanceBeds,
      reservedBeds,
      wards: wards.map((ward) => mapWard(ward, summaryMap.get(String(ward._id)))),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWardHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await AuditLog.find({
      entityType: "Ward",
      entityId: id,
    }).sort({ createdAt: -1 });

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
