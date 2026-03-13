import Pharmacist from "../models/Pharmacist.js";
import Medicine from "../models/Medicine.js";
import PharmacyOrder from "../models/PharmacyOrder.js";
import { PHARMACY_STATUS } from "../utils/pharmacyWorkflow.js";

// Dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const pharm = await Pharmacist.findOne({ userId: req.user.id });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [
      newOrders,
      acceptedOrders,
      preparingOrders,
      readyForPickupOrders,
      completedToday,
      lowStockMedicines,
      outOfStockMedicines,
      urgentInventory,
    ] = await Promise.all([
      PharmacyOrder.countDocuments({ status: { $in: [PHARMACY_STATUS.ORDER_PLACED, PHARMACY_STATUS.AWAITING_PAYMENT, PHARMACY_STATUS.PAID] } }),
      PharmacyOrder.countDocuments({ status: PHARMACY_STATUS.ORDER_ACCEPTED }),
      PharmacyOrder.countDocuments({ status: { $in: [PHARMACY_STATUS.PREPARING, PHARMACY_STATUS.PARTIALLY_FULFILLED] } }),
      PharmacyOrder.countDocuments({ status: PHARMACY_STATUS.READY_FOR_PICKUP }),
      PharmacyOrder.countDocuments({ completedAt: { $gte: todayStart, $lt: todayEnd } }),
      Medicine.countDocuments({
        isActive: true,
        $expr: { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$lowStockThreshold"] }] },
      }),
      Medicine.countDocuments({ isActive: true, stock: 0 }),
      Medicine.find({
        isActive: true,
        $or: [
          { stock: 0 },
          { $expr: { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$lowStockThreshold"] }] } },
        ],
      })
        .sort({ stock: 1, name: 1 })
        .limit(8)
        .select("name stock lowStockThreshold price"),
    ]);

    res.json({
      assignedCounter: pharm?.assignedCounter || "Not assigned",
      shift: pharm?.shift || "Not set",
      newOrders,
      acceptedOrders,
      preparingOrders,
      readyForPickupOrders,
      completedToday,
      lowStockMedicines,
      outOfStockMedicines,
      urgentInventory: urgentInventory.map((medicine) => ({
        id: medicine._id,
        name: medicine.name,
        stock: medicine.stock,
        lowStockThreshold: medicine.lowStockThreshold ?? 10,
        price: medicine.price,
      })),
      quickActions: [
        { label: "Open Pharmacy Orders", path: "/employee/pharmacist/orders" },
        { label: "Mark Ready", path: "/employee/pharmacist/orders?status=readyForPickup" },
        { label: "Update Stock", path: "/employee/pharmacist/inventory" },
        { label: "View History", path: "/employee/pharmacist/history" },
      ],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get profile
export const getMyProfile = async (req, res) => {
  try {
    const pharm = await Pharmacist.findOne({ userId: req.user.id })
      .populate("userId", "name email phone gender profileImage employeeId");
    if (!pharm) return res.status(404).json({ message: "Pharmacist profile not found." });
    res.json(pharm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update profile
export const updateMyProfile = async (req, res) => {
  try {
    const { licenseNumber, assignedCounter, shift } = req.body;
    let pharm = await Pharmacist.findOne({ userId: req.user.id });
    if (!pharm) {
      pharm = await Pharmacist.create({ userId: req.user.id, ...req.body });
    } else {
      if (licenseNumber) pharm.licenseNumber = licenseNumber;
      if (assignedCounter) pharm.assignedCounter = assignedCounter;
      if (shift) pharm.shift = shift;
      await pharm.save();
    }
    res.json({ message: "Profile updated.", pharm });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
