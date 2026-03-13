import Invoice from "../models/Invoice.js";
import Medicine from "../models/Medicine.js";
import PharmacyOrder from "../models/PharmacyOrder.js";
import Prescription from "../models/Prescription.js";
import {
  canTransitionPharmacyOrder,
  getOverallFulfillmentStatus,
  normalizePharmacyStatus,
  PHARMACY_STATUS,
} from "../utils/pharmacyWorkflow.js";
import { ensurePatientProfileForUser } from "../utils/patientContext.js";

const ORDER_POPULATE = [
  { path: "patientId", populate: { path: "userId", select: "name email patientId phone" } },
  { path: "patientUserId", select: "name email patientId phone" },
  { path: "prescriptionId", populate: { path: "doctorId", populate: { path: "userId", select: "name email employeeId" } } },
  { path: "pharmacistUserId", select: "name email employeeId" },
  { path: "invoiceId", select: "paymentStatus totalAmount subtotal paidAt lineItems createdAt updatedAt" },
  { path: "items.medicineId", select: "name price stock lowStockThreshold isActive unit manufacturer" },
];

const buildRequestedItems = async ({ prescription, requestedItems = [] }) => {
  const normalizedRequestedItems = Array.isArray(requestedItems) && requestedItems.length
    ? requestedItems
    : (prescription.medicines || []).map((item, index) => ({
        prescriptionMedicineIndex: index,
        quantity: item.quantity || 1,
      }));

  const medicineNames = (prescription.medicines || []).map((item) => item.name).filter(Boolean);
  const inventoryMedicines = await Medicine.find({
    name: { $in: medicineNames },
  });

  const inventoryByName = new Map(inventoryMedicines.map((item) => [item.name.toLowerCase(), item]));

  return normalizedRequestedItems.map((requestItem) => {
    const prescriptionItem = prescription.medicines?.[requestItem.prescriptionMedicineIndex ?? 0];
    if (!prescriptionItem) {
      return null;
    }

    const inventoryMedicine = inventoryByName.get((prescriptionItem.name || "").toLowerCase());
    const requestedQuantity = Number(requestItem.quantity || 1);
    const unitPrice = Number(inventoryMedicine?.price || 0);
    const stockAvailable = Number(inventoryMedicine?.stock || 0);

    return {
      medicineId: inventoryMedicine?._id,
      medicineName: prescriptionItem.name,
      prescriptionMedicineIndex: requestItem.prescriptionMedicineIndex ?? 0,
      requestedQuantity,
      fulfilledQuantity: 0,
      unavailableQuantity: 0,
      dosage: prescriptionItem.dosage,
      frequency: prescriptionItem.frequency,
      duration: prescriptionItem.duration,
      instructions: prescriptionItem.instructions,
      unitPrice,
      lineTotal: requestedQuantity * unitPrice,
      stockAvailableAtReview: stockAvailable,
      fulfillmentStatus: stockAvailable > 0 ? PHARMACY_STATUS.ORDER_PLACED : "outOfStock",
    };
  }).filter(Boolean);
};

const syncInvoiceForOrder = async (order) => {
  const lineItems = (order.items || []).map((item) => ({
    label: item.medicineName,
    category: "medicine",
    referenceType: "pharmacyOrderItem",
    referenceId: order._id,
    quantity: item.requestedQuantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    notes: item.instructions,
  }));

  let invoice = order.invoiceId ? await Invoice.findById(order.invoiceId) : null;

  if (!invoice) {
    invoice = new Invoice({
      patientId: order.patientId,
      patientUserId: order.patientUserId,
      pharmacyOrderId: order._id,
      billType: "pharmacy",
      lineItems,
      medicineCharges: order.total,
    });
  } else {
    invoice.lineItems = lineItems;
    invoice.medicineCharges = order.total;
    invoice.pharmacyOrderId = order._id;
  }

  await invoice.save();

  order.invoiceId = invoice._id;
  order.paymentStatus = invoice.paymentStatus || order.paymentStatus;
  await order.save();

  return invoice;
};

const buildOrderPayload = (order) => {
  const patientUser = order.patientId?.userId || order.patientUserId;
  const doctorUser = order.prescriptionId?.doctorId?.userId;

  return {
    id: order._id,
    patient: patientUser
      ? {
          id: patientUser._id,
          name: patientUser.name,
          email: patientUser.email,
          patientId: patientUser.patientId,
          phone: patientUser.phone,
        }
      : null,
    doctor: doctorUser
      ? {
          id: doctorUser._id,
          name: doctorUser.name,
          email: doctorUser.email,
          employeeId: doctorUser.employeeId,
        }
      : null,
    prescription: order.prescriptionId
      ? {
          id: order.prescriptionId._id,
          diagnosis: order.prescriptionId.diagnosis,
          issuedAt: order.prescriptionId.issuedAt,
          notes: order.prescriptionId.notes,
        }
      : null,
    pharmacist: order.pharmacistUserId
      ? {
          id: order.pharmacistUserId._id,
          name: order.pharmacistUserId.name,
          employeeId: order.pharmacistUserId.employeeId,
        }
      : null,
    status: normalizePharmacyStatus(order.status),
    paymentStatus: order.paymentStatus || "pending",
    orderReference: `PHARM-${String(order._id).slice(-6).toUpperCase()}`,
    items: (order.items || []).map((item) => ({
      medicineId: item.medicineId?._id || item.medicineId || null,
      medicineName: item.medicineName || item.medicineId?.name,
      requestedQuantity: item.requestedQuantity,
      fulfilledQuantity: item.fulfilledQuantity,
      unavailableQuantity: item.unavailableQuantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      fulfillmentStatus: normalizePharmacyStatus(item.fulfillmentStatus),
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instructions: item.instructions,
      stockAvailableAtReview: item.stockAvailableAtReview,
      stockCurrent: item.medicineId?.stock,
      lowStockThreshold: item.medicineId?.lowStockThreshold,
    })),
    subtotal: order.subtotal,
    total: order.total,
    notes: order.notes,
    invoice: order.invoiceId
      ? {
          id: order.invoiceId._id,
          paymentStatus: order.invoiceId.paymentStatus,
          totalAmount: order.invoiceId.totalAmount,
          subtotal: order.invoiceId.subtotal,
          paidAt: order.invoiceId.paidAt,
          createdAt: order.invoiceId.createdAt,
          lineItems: order.invoiceId.lineItems,
        }
      : null,
    orderedAt: order.orderedAt,
    placedAt: order.placedAt,
    acceptedAt: order.acceptedAt,
    preparingAt: order.preparingAt,
    readyAt: order.readyAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

export const placeOrderFromPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found." });
    }

    const { patient, user } = await ensurePatientProfileForUser(req.user.id);
    if (prescription.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({ message: "You can only place orders for your own prescriptions." });
    }

    if (!Array.isArray(prescription.medicines) || prescription.medicines.length === 0) {
      return res.status(400).json({ message: "This prescription does not contain medicines." });
    }

    const existingOrder = prescription.pharmacyOrderId
      ? await PharmacyOrder.findById(prescription.pharmacyOrderId)
      : await PharmacyOrder.findOne({ prescriptionId: prescription._id, status: { $ne: PHARMACY_STATUS.CANCELLED } });

    if (existingOrder) {
      return res.status(400).json({ message: "A pharmacy order already exists for this prescription." });
    }

    const items = await buildRequestedItems({
      prescription,
      requestedItems: req.body.items,
    });

    const order = await PharmacyOrder.create({
      patientId: patient._id,
      patientUserId: user._id,
      prescriptionId: prescription._id,
      status: PHARMACY_STATUS.ORDER_PLACED,
      paymentStatus: "pending",
      items,
      notes: req.body.notes,
      placedAt: new Date(),
      orderedAt: new Date(),
    });

    const invoice = await syncInvoiceForOrder(order);
    prescription.pharmacyOrderId = order._id;
    await prescription.save();

    const populatedOrder = await PharmacyOrder.findById(order._id).populate(ORDER_POPULATE);

    return res.status(201).json({
      message: "Medicine order placed successfully.",
      order: buildOrderPayload(populatedOrder),
      invoiceId: invoice._id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyPharmacyOrders = async (req, res) => {
  try {
    const { patient } = await ensurePatientProfileForUser(req.user.id);
    const orders = await PharmacyOrder.find({ patientId: patient._id })
      .populate(ORDER_POPULATE)
      .sort({ createdAt: -1 });

    return res.json(orders.map(buildOrderPayload));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPharmacyOrderById = async (req, res) => {
  try {
    const order = await PharmacyOrder.findById(req.params.id).populate(ORDER_POPULATE);
    if (!order) {
      return res.status(404).json({ message: "Pharmacy order not found." });
    }

    if (req.user.role === "patient") {
      const { patient } = await ensurePatientProfileForUser(req.user.id);
      if (order.patientId._id.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: "Access forbidden." });
      }
    }

    return res.json(buildOrderPayload(order));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPharmacistOrders = async (req, res) => {
  try {
    const { patient, doctor, date, status, paymentStatus, history } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    } else if (history !== "true") {
      filter.status = {
        $nin: [PHARMACY_STATUS.COMPLETED, PHARMACY_STATUS.CANCELLED],
      };
    }
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    let orders = await PharmacyOrder.find(filter)
      .populate(ORDER_POPULATE)
      .sort({ createdAt: -1 });

    if (patient) {
      const search = patient.toLowerCase();
      orders = orders.filter((order) => {
        const patientUser = order.patientId?.userId || order.patientUserId;
        return [
          patientUser?.name,
          patientUser?.patientId,
        ].some((value) => value?.toLowerCase().includes(search));
      });
    }

    if (doctor) {
      const search = doctor.toLowerCase();
      orders = orders.filter((order) => {
        const doctorName = order.prescriptionId?.doctorId?.userId?.name?.toLowerCase() || "";
        return doctorName.includes(search);
      });
    }

    return res.json(orders.map(buildOrderPayload));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateOrderItemsForReview = async (order, itemUpdates = []) => {
  const inventoryMedicineIds = itemUpdates
    .map((item) => item.medicineId)
    .filter(Boolean);

  const medicines = inventoryMedicineIds.length
    ? await Medicine.find({ _id: { $in: inventoryMedicineIds } })
    : [];
  const medicineById = new Map(medicines.map((medicine) => [String(medicine._id), medicine]));

  order.items = order.items.map((item, index) => {
    const incoming = itemUpdates.find((candidate) => Number(candidate.index) === index)
      || itemUpdates.find((candidate) => candidate.medicineId && String(candidate.medicineId) === String(item.medicineId));

    const medicine = item.medicineId ? medicineById.get(String(item.medicineId)) : null;
    const currentStock = Number(medicine?.stock ?? item.stockAvailableAtReview ?? 0);
    const requestedQuantity = Number(item.requestedQuantity || 0);
    const requestedFulfilled = incoming?.fulfilledQuantity !== undefined
      ? Number(incoming.fulfilledQuantity || 0)
      : Math.min(requestedQuantity, currentStock);
    const fulfilledQuantity = Math.max(0, Math.min(requestedQuantity, requestedFulfilled));
    const unavailableQuantity = Math.max(0, requestedQuantity - fulfilledQuantity);

    item.stockAvailableAtReview = currentStock;
    item.fulfilledQuantity = fulfilledQuantity;
    item.unavailableQuantity = unavailableQuantity;
    item.unitPrice = Number(medicine?.price ?? item.unitPrice ?? 0);
    item.lineTotal = requestedQuantity * item.unitPrice;

    if (fulfilledQuantity === 0 && unavailableQuantity > 0) {
      item.fulfillmentStatus = "outOfStock";
    } else if (unavailableQuantity > 0) {
      item.fulfillmentStatus = PHARMACY_STATUS.PARTIALLY_FULFILLED;
    } else {
      item.fulfillmentStatus = PHARMACY_STATUS.ORDER_ACCEPTED;
    }

    return item;
  });
};

export const acceptPharmacyOrder = async (req, res) => {
  try {
    const order = await PharmacyOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Pharmacy order not found." });
    }

    if (!canTransitionPharmacyOrder(order.status, PHARMACY_STATUS.ORDER_ACCEPTED)) {
      return res.status(400).json({ message: "This order cannot be accepted from its current status." });
    }

    await updateOrderItemsForReview(order, req.body.items || []);
    order.status = getOverallFulfillmentStatus(order.items) || PHARMACY_STATUS.ORDER_ACCEPTED;
    order.pharmacistUserId = req.user.id;
    order.acceptedAt = new Date();
    order.paymentStatus = order.paymentStatus || "pending";
    await order.save();
    await syncInvoiceForOrder(order);

    const populatedOrder = await PharmacyOrder.findById(order._id).populate(ORDER_POPULATE);
    return res.json({
      message: "Pharmacy order accepted.",
      order: buildOrderPayload(populatedOrder),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const markOrderPreparing = async (req, res) => {
  try {
    const order = await PharmacyOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Pharmacy order not found." });
    }

    const targetStatus = normalizePharmacyStatus(order.status) === PHARMACY_STATUS.PARTIALLY_FULFILLED
      ? PHARMACY_STATUS.PARTIALLY_FULFILLED
      : PHARMACY_STATUS.PREPARING;

    if (!canTransitionPharmacyOrder(order.status, PHARMACY_STATUS.PREPARING) && targetStatus !== PHARMACY_STATUS.PARTIALLY_FULFILLED) {
      return res.status(400).json({ message: "This order cannot be moved to preparing." });
    }

    await updateOrderItemsForReview(order, req.body.items || []);
    order.pharmacistUserId = req.user.id;
    order.preparingAt = new Date();
    order.status = getOverallFulfillmentStatus(order.items) || PHARMACY_STATUS.PREPARING;
    await order.save();
    await syncInvoiceForOrder(order);

    const populatedOrder = await PharmacyOrder.findById(order._id).populate(ORDER_POPULATE);
    return res.json({
      message: "Pharmacy order moved to preparation.",
      order: buildOrderPayload(populatedOrder),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const markOrderReady = async (req, res) => {
  try {
    const order = await PharmacyOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Pharmacy order not found." });
    }

    if (
      !canTransitionPharmacyOrder(order.status, PHARMACY_STATUS.READY_FOR_PICKUP)
      && normalizePharmacyStatus(order.status) !== PHARMACY_STATUS.PARTIALLY_FULFILLED
    ) {
      return res.status(400).json({ message: "This order cannot be marked ready." });
    }

    await updateOrderItemsForReview(order, req.body.items || []);
    order.status = PHARMACY_STATUS.READY_FOR_PICKUP;
    order.readyAt = new Date();
    await order.save();
    await syncInvoiceForOrder(order);

    const populatedOrder = await PharmacyOrder.findById(order._id).populate(ORDER_POPULATE);
    return res.json({
      message: "Pharmacy order marked ready for pickup.",
      order: buildOrderPayload(populatedOrder),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const completePharmacyOrder = async (req, res) => {
  try {
    const order = await PharmacyOrder.findById(req.params.id).populate("items.medicineId");
    if (!order) {
      return res.status(404).json({ message: "Pharmacy order not found." });
    }

    if (order.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Payment must be completed before final handover." });
    }

    if (!canTransitionPharmacyOrder(order.status, PHARMACY_STATUS.COMPLETED)) {
      return res.status(400).json({ message: "This order is not ready to be completed." });
    }

    for (const item of order.items) {
      if (item.medicineId && item.fulfilledQuantity > 0) {
        const medicine = await Medicine.findById(item.medicineId._id);
        if (!medicine) {
          return res.status(400).json({ message: `Medicine not found for ${item.medicineName}.` });
        }
        if (medicine.stock < item.fulfilledQuantity) {
          return res.status(400).json({ message: `Insufficient stock remaining for ${item.medicineName}.` });
        }
        medicine.stock -= item.fulfilledQuantity;
        await medicine.save();
      }
      item.fulfillmentStatus = item.unavailableQuantity > 0
        ? PHARMACY_STATUS.PARTIALLY_FULFILLED
        : PHARMACY_STATUS.COMPLETED;
    }

    order.status = getOverallFulfillmentStatus(order.items) === PHARMACY_STATUS.PARTIALLY_FULFILLED
      ? PHARMACY_STATUS.PARTIALLY_FULFILLED
      : PHARMACY_STATUS.COMPLETED;
    order.completedAt = new Date();
    await order.save();

    if (order.prescriptionId) {
      await Prescription.findByIdAndUpdate(order.prescriptionId, {
        status: order.status === PHARMACY_STATUS.COMPLETED ? "dispensed" : "active",
      });
    }

    const populatedOrder = await PharmacyOrder.findById(order._id).populate(ORDER_POPULATE);
    return res.json({
      message:
        order.status === PHARMACY_STATUS.PARTIALLY_FULFILLED
          ? "Order completed with partial fulfillment."
          : "Order completed successfully.",
      order: buildOrderPayload(populatedOrder),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const cancelPharmacyOrder = async (req, res) => {
  try {
    const order = await PharmacyOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Pharmacy order not found." });
    }

    if (!canTransitionPharmacyOrder(order.status, PHARMACY_STATUS.CANCELLED)) {
      return res.status(400).json({ message: "This order cannot be cancelled." });
    }

    order.status = PHARMACY_STATUS.CANCELLED;
    order.cancelledAt = new Date();
    await order.save();

    if (order.prescriptionId) {
      await Prescription.findByIdAndUpdate(order.prescriptionId, {
        status: "active",
      });
    }

    const populatedOrder = await PharmacyOrder.findById(order._id).populate(ORDER_POPULATE);
    return res.json({
      message: "Order cancelled.",
      order: buildOrderPayload(populatedOrder),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
