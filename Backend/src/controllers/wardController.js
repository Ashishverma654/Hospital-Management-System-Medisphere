import Bed from "../models/Bed.js";
import Ward from "../models/Ward.js";

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
  wardType: ward.wardType,
  floor: ward.floor,
  block: ward.block,
  hospitalLocationId: ward.hospitalLocationId,
  bedCount: ward.bedCount,
  defaultPrice: ward.defaultPrice,
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

export const listWards = async (req, res) => {
  try {
    const wards = await Ward.find(buildWardFilter(req.query))
      .populate("hospitalLocationId", "name city")
      .sort({ createdAt: -1 });

    const summaryMap = await buildWardSummaryMap(wards.map((ward) => ward._id));

    res.json(wards.map((ward) => mapWard(ward, summaryMap.get(String(ward._id)))));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWard = async (req, res) => {
  try {
    const ward = await Ward.create({
      ...req.body,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    res.status(201).json({
      message: "Ward created successfully.",
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

    Object.assign(ward, {
      name: req.body.name ?? ward.name,
      wardNumber: req.body.wardNumber ?? ward.wardNumber,
      wardType: req.body.wardType ?? ward.wardType,
      floor: req.body.floor ?? ward.floor,
      block: req.body.block ?? ward.block,
      hospitalLocationId: req.body.hospitalLocationId ?? ward.hospitalLocationId,
      bedCount: req.body.bedCount ?? ward.bedCount,
      defaultPrice: req.body.defaultPrice ?? ward.defaultPrice,
      isActive: req.body.isActive ?? ward.isActive,
      updatedBy: req.user.id,
    });
    await ward.save();

    await Bed.updateMany(
      { wardId: ward._id },
      { $set: { ward: ward.name, type: ward.wardType } }
    );

    res.json({
      message: "Ward updated successfully.",
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
    const ward = await Ward.findById(req.params.id).populate("hospitalLocationId", "name city");
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
