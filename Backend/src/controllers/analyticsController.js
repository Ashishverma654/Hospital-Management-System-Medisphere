import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import Admission from "../models/Admission.js";
import LabOrder from "../models/LabOrder.js";
import PharmacyOrder from "../models/PharmacyOrder.js";
import Bed from "../models/Bed.js";

export const getRevenueAnalytics = async (req, res) => {
  try {
    const revenueByType = await Invoice.aggregate([
      {
        $group: {
          _id: "$billType",
          total: { $sum: { $ifNull: ["$totalAmount", 0] } },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueByType.reduce((sum, entry) => sum + (entry.total || 0), 0);

    return res.json({
      success: true,
      message: "Revenue analytics loaded.",
      data: {
        totalRevenue,
        breakdown: revenueByType.map((entry) => ({
          billType: entry._id || "unknown",
          total: entry.total || 0,
          count: entry.count || 0,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

export const getPatientFlowAnalytics = async (req, res) => {
  try {
    const grouped = await Appointment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    return res.json({
      success: true,
      message: "Patient flow analytics loaded.",
      data: {
        flow: grouped.map((entry) => ({
          status: entry._id || "unknown",
          count: entry.count || 0,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

export const getDoctorAnalytics = async (req, res) => {
  try {
    const doctorStats = await Appointment.aggregate([
      {
        $group: {
          _id: "$doctorId",
          totalPatients: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          noShow: { $sum: { $cond: [{ $eq: ["$status", "no-show"] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "doctor.userId",
          foreignField: "_id",
          as: "doctorUser",
        },
      },
      { $unwind: { path: "$doctorUser", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          doctorId: "$_id",
          doctorName: "$doctorUser.name",
          totalPatients: 1,
          completed: 1,
          noShow: 1,
        },
      },
      { $sort: { totalPatients: -1 } },
    ]);

    return res.json({
      success: true,
      message: "Doctor analytics loaded.",
      data: { doctors: doctorStats },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

export const getBedOccupancyAnalytics = async (req, res) => {
  try {
    const totalBeds = await Bed.countDocuments();
    const occupiedBeds = await Bed.countDocuments({ status: "occupied" });
    const availableBeds = await Bed.countDocuments({ status: "available" });
    const occupancyPercentage = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return res.json({
      success: true,
      message: "Bed occupancy analytics loaded.",
      data: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyPercentage,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

export const getLabAnalytics = async (req, res) => {
  try {
    const totalTests = await LabOrder.countDocuments();
    const completed = await LabOrder.countDocuments({ status: "completed" });
    const pending = await LabOrder.countDocuments({ status: { $ne: "completed" } });

    const labRevenueAgg = await Invoice.aggregate([
      { $match: { billType: "lab" } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$totalAmount", 0] } } } },
    ]);
    const labRevenue = labRevenueAgg[0]?.total || 0;

    return res.json({
      success: true,
      message: "Lab analytics loaded.",
      data: {
        totalTests,
        completed,
        pending,
        revenue: labRevenue,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

export const getPharmacyAnalytics = async (req, res) => {
  try {
    const ordersCount = await PharmacyOrder.countDocuments();
    const revenueAgg = await Invoice.aggregate([
      { $match: { billType: "pharmacy" } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$totalAmount", 0] } } } },
    ]);
    const revenue = revenueAgg[0]?.total || 0;

    const topMedicines = await PharmacyOrder.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.medicineName",
          count: { $sum: 1 },
          quantity: { $sum: { $ifNull: ["$items.fulfilledQuantity", 0] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 },
    ]);

    return res.json({
      success: true,
      message: "Pharmacy analytics loaded.",
      data: {
        ordersCount,
        revenue,
        topMedicines: topMedicines.map((entry) => ({
          name: entry._id,
          count: entry.count,
          quantity: entry.quantity,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};
