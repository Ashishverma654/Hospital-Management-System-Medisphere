import Medicine from "../models/Medicine.js";

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

export const addMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.create({
      ...req.body,
      lowStockThreshold: Number(req.body.lowStockThreshold ?? 10),
      price: Number(req.body.price || 0),
      stock: Number(req.body.stock || 0),
    });

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
    const updatePayload = { ...req.body };
    if (updatePayload.price !== undefined) updatePayload.price = Number(updatePayload.price || 0);
    if (updatePayload.stock !== undefined) updatePayload.stock = Number(updatePayload.stock || 0);
    if (updatePayload.lowStockThreshold !== undefined) {
      updatePayload.lowStockThreshold = Number(updatePayload.lowStockThreshold || 0);
    }

    const medicine = await Medicine.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
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
