import Medicine from "../models/Medicine.js";
import MedicineStockLog from "../models/MedicineStockLog.js";
import { notifyRole } from "../services/notificationService.js";

const buildMedicineFilters = (query = {}) => {
  const { search, status, stockState } = query;
  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { manufacturer: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { batchNumber: { $regex: search, $options: "i" } },
    ];
  }

  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;

  if (stockState === "low") {
    filter.$expr = {
      $and: [
        { $gt: ["$stock", 0] },
        { $lte: ["$stock", "$lowStockThreshold"] },
      ],
    };
  }

  if (stockState === "out") {
    filter.stock = 0;
  }

  return filter;
};

const toMedicinePayload = (medicine) => ({
  id: medicine._id,
  name: medicine.name,
  manufacturer: medicine.manufacturer,
  category: medicine.category,
  price: medicine.price,
  stock: medicine.stock,
  lowStockThreshold: medicine.lowStockThreshold ?? 10,
  stockState:
    medicine.stock <= 0
      ? "outOfStock"
      : medicine.stock <= (medicine.lowStockThreshold ?? 10)
        ? "lowStock"
        : "healthy",
  expiryDate: medicine.expiryDate,
  supplier: medicine.supplier,
  batchNumber: medicine.batchNumber,
  unit: medicine.unit || "unit",
  supplier: medicine.supplier,
  batchNumber: medicine.batchNumber,
  isActive: medicine.isActive,
  createdAt: medicine.createdAt,
  updatedAt: medicine.updatedAt,
});

const recordStockLog = async ({
  medicine,
  changeType,
  quantityChange,
  previousStock,
  newStock,
  referenceType,
  referenceId,
  performedBy,
  notes,
}) => {
  if (!medicine) return;
  await MedicineStockLog.create({
    medicineId: medicine._id,
    changeType,
    quantityChange,
    previousStock,
    newStock,
    referenceType,
    referenceId,
    performedByUserId: performedBy?.id,
    performedByName: performedBy?.name,
    performedByRole: performedBy?.role,
    notes,
  });
};

export const addMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.create({
      ...req.body,
      lowStockThreshold: Number(req.body.lowStockThreshold ?? 10),
      price: Number(req.body.price || 0),
      stock: Number(req.body.stock || 0),
    });

    await recordStockLog({
      medicine,
      changeType: "initial",
      quantityChange: medicine.stock,
      previousStock: 0,
      newStock: medicine.stock,
      referenceType: "inventory",
      performedBy: { id: req.user.id, name: req.user.name, role: req.user.role },
      notes: "Initial stock entry",
    });

    if (medicine.stock <= 0 || medicine.stock <= (medicine.lowStockThreshold ?? 10)) {
      const stockState = medicine.stock <= 0 ? "outOfStock" : "lowStock";
      await notifyRole({
        role: "pharmacist",
        key: `stock:${medicine._id}:${stockState}`,
        type: "stock",
        title: stockState === "outOfStock" ? "Medicine out of stock" : "Low stock alert",
        message: `${medicine.name} is ${stockState === "outOfStock" ? "out of stock" : "running low"}.`,
        priority: stockState === "outOfStock" ? "urgent" : "normal",
        sourceType: "medicine",
        sourceId: medicine._id,
        metadata: { stock: medicine.stock, lowStockThreshold: medicine.lowStockThreshold },
      });
    }

    res.status(201).json({
      success: true,
      message: "Medicine added successfully.",
      data: toMedicinePayload(medicine),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find(buildMedicineFilters(req.query)).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: medicines.map(toMedicinePayload),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    res.status(200).json({ success: true, data: toMedicinePayload(medicine) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    const previousStock = medicine.stock ?? 0;

    if (req.body.price !== undefined) medicine.price = Number(req.body.price || 0);
    if (req.body.stock !== undefined) medicine.stock = Number(req.body.stock || 0);
    if (req.body.lowStockThreshold !== undefined) {
      medicine.lowStockThreshold = Number(req.body.lowStockThreshold || 0);
    }
    if (req.body.name !== undefined) medicine.name = req.body.name;
    if (req.body.manufacturer !== undefined) medicine.manufacturer = req.body.manufacturer;
    if (req.body.category !== undefined) medicine.category = req.body.category;
    if (req.body.unit !== undefined) medicine.unit = req.body.unit;
    if (req.body.supplier !== undefined) medicine.supplier = req.body.supplier;
    if (req.body.batchNumber !== undefined) medicine.batchNumber = req.body.batchNumber;
    if (req.body.expiryDate !== undefined) medicine.expiryDate = req.body.expiryDate || null;
    if (req.body.isActive !== undefined) medicine.isActive = req.body.isActive;

    await medicine.save();

    if (req.body.stock !== undefined && medicine.stock !== previousStock) {
      const quantityChange = medicine.stock - previousStock;
      await recordStockLog({
        medicine,
        changeType: quantityChange > 0 ? "restock" : "adjustment",
        quantityChange,
        previousStock,
        newStock: medicine.stock,
        referenceType: "inventory",
        performedBy: { id: req.user.id, name: req.user.name, role: req.user.role },
        notes: req.body.adjustmentNote || "Manual stock adjustment",
      });
    }

    if (medicine.stock <= 0 || medicine.stock <= (medicine.lowStockThreshold ?? 10)) {
      const stockState = medicine.stock <= 0 ? "outOfStock" : "lowStock";
      await notifyRole({
        role: "pharmacist",
        key: `stock:${medicine._id}:${stockState}`,
        type: "stock",
        title: stockState === "outOfStock" ? "Medicine out of stock" : "Low stock alert",
        message: `${medicine.name} is ${stockState === "outOfStock" ? "out of stock" : "running low"}.`,
        priority: stockState === "outOfStock" ? "urgent" : "normal",
        sourceType: "medicine",
        sourceId: medicine._id,
        metadata: { stock: medicine.stock, lowStockThreshold: medicine.lowStockThreshold },
      });
    }

    res.status(200).json({
      success: true,
      message: "Medicine updated.",
      data: toMedicinePayload(medicine),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    res.status(200).json({
      success: true,
      message: "Medicine deleted.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMedicineStockLedger = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    const filter = { medicineId: medicine._id };
    if (type) filter.changeType = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await MedicineStockLog.find(filter).sort({ createdAt: -1 });
    const summary = logs.reduce(
      (acc, entry) => {
        if (entry.changeType === "sale") acc.totalSold += Math.abs(entry.quantityChange);
        if (entry.quantityChange > 0) acc.totalAdded += entry.quantityChange;
        if (entry.changeType === "restock") acc.totalRestocked += entry.quantityChange;
        if (entry.changeType === "adjustment") acc.totalAdjusted += entry.quantityChange;
        return acc;
      },
      { totalSold: 0, totalAdded: 0, totalRestocked: 0, totalAdjusted: 0 }
    );

    res.json({
      success: true,
      data: {
        medicine: toMedicinePayload(medicine),
        summary,
        logs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentStockLedger = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const logs = await MedicineStockLog.find({})
      .populate("medicineId", "name")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
