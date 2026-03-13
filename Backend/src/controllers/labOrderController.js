import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Invoice from "../models/Invoice.js";
import LabOrder from "../models/LabOrder.js";
import LabOrderItem from "../models/LabOrderItem.js";
import LabReport from "../models/LabReport.js";
import { generateLabOrderPDF } from "../utils/generateLabOrderPDF.js";
import { resolvePatientContext } from "../utils/patientContext.js";
import {
  getOrderStatusForPayment,
  getPublicReportVisibility,
  normalizeLabItemStatus,
  normalizeLabOrderStatus,
} from "../utils/labWorkflow.js";

const LAB_WORKFLOW_STATUSES = [
  "ordered",
  "awaitingPayment",
  "paid",
  "sampleScheduled",
  "sampleCollected",
  "inProcessing",
  "reportReady",
  "reportAvailableForPickup",
  "reportReleasedToPortal",
  "completed",
  "cancelled",
];

const LAB_ITEM_WORKFLOW_STATUSES = [
  "ordered",
  "awaitingPayment",
  "paid",
  "sampleScheduled",
  "sampleCollected",
  "inProcessing",
  "reportReady",
  "reportAvailableForPickup",
  "reportReleasedToPortal",
  "completed",
  "cancelled",
];

const orderPopulate = [
  {
    path: "patientId",
    populate: { path: "userId", select: "name email phone patientId" },
  },
  {
    path: "doctorId",
    populate: { path: "userId", select: "name email employeeId" },
  },
  {
    path: "appointmentId",
    select: "date slot status",
  },
  {
    path: "invoiceId",
    select: "paymentStatus paidAt totalAmount billType",
  },
];

const formatOrder = async (orderDoc, viewerRole = "internal") => {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
  const items = await LabOrderItem.find({ labOrderId: order._id }).sort({ createdAt: 1 });
  const reports = await LabReport.find({ labOrderId: order._id }).sort({ createdAt: -1 });

  const normalizedPaymentStatus = order.paymentStatus || "pending";
  const normalizedStatus = normalizeLabOrderStatus(order.status);

  return {
    ...order,
    status: normalizedStatus,
    paymentStatus: normalizedPaymentStatus,
    patientName: order.patientId?.userId?.name || "Patient",
    patientIdentifier:
      order.patientId?.userId?.patientId || order.patientUserId?.patientId || order.patientId?._id?.toString(),
    doctorName: order.doctorId?.userId?.name || "Doctor",
    appointmentReference: order.appointmentId
      ? `${order.appointmentId.date || ""} ${order.appointmentId.slot || ""}`.trim() || order.appointmentId._id
      : null,
    items: items.map((item) => ({
      ...item.toObject(),
      status: normalizeLabItemStatus(item.status),
    })),
    reports: reports
      .filter((report) =>
        viewerRole === "patient"
          ? getPublicReportVisibility({
              report,
              orderPaymentStatus: normalizedPaymentStatus,
              orderReleasedToPortal: order.releasedToPortal,
            })
          : true
      )
      .map((report) => ({
        ...report.toObject(),
        patientVisible: getPublicReportVisibility({
          report,
          orderPaymentStatus: normalizedPaymentStatus,
          orderReleasedToPortal: order.releasedToPortal,
        }),
      })),
  };
};

const syncLabOrderPaymentState = async (labOrderId) => {
  const labOrder = await LabOrder.findById(labOrderId);
  if (!labOrder) {
    return null;
  }

  const invoice = await Invoice.findOne({ labOrderId: labOrder._id }).sort({ createdAt: -1 });

  if (invoice) {
    labOrder.invoiceId = invoice._id;
    labOrder.paymentStatus = invoice.paymentStatus;
    if (invoice.paymentStatus === "paid" && !labOrder.paymentCompletedAt) {
      labOrder.paymentCompletedAt = invoice.paidAt || new Date();
    }
    labOrder.status = getOrderStatusForPayment({
      currentStatus: labOrder.status,
      paymentStatus: invoice.paymentStatus,
    });
    await labOrder.save();
  }

  return labOrder;
};

const upsertLabInvoice = async ({ labOrder, patient, user, tests, createdBy }) => {
  const lineItems = tests.map((test) => {
    const unitPrice = Number(test.price || 0);
    return {
      label: test.testName,
      category: "lab",
      referenceType: "labOrder",
      referenceId: labOrder._id,
      quantity: 1,
      unitPrice,
      lineTotal: unitPrice,
      notes: test.testCode || "",
    };
  });

  const invoice = await Invoice.create({
    patientId: patient._id,
    patientUserId: user._id,
    appointmentId: labOrder.appointmentId,
    labOrderId: labOrder._id,
    billType: "lab",
    lineItems,
    labCharges: labOrder.totalAmount,
    totalAmount: labOrder.totalAmount,
    createdBy,
    updatedBy: createdBy,
  });

  labOrder.invoiceId = invoice._id;
  labOrder.paymentStatus = invoice.paymentStatus;
  labOrder.status = getOrderStatusForPayment({
    currentStatus: labOrder.status,
    paymentStatus: invoice.paymentStatus,
  });
  await labOrder.save();

  return invoice;
};

const verifyOrderAccess = async (req, labOrder) => {
  const role = req.user.role;

  if (["admin", "superadmin", "subadmin", "labTechnician"].includes(role)) {
    return true;
  }

  if (role === "doctor") {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    return doctor && String(labOrder.doctorId?._id || labOrder.doctorId) === String(doctor._id);
  }

  if (role === "patient") {
    return String(labOrder.patientUserId?._id || labOrder.patientUserId) === String(req.user.id);
  }

  return false;
};

export const createLabOrder = async (req, res) => {
  try {
    const { patientId, appointmentId, tests, notes, urgency = "routine" } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(403).json({ message: "Doctor profile not found." });
    }

    let appointment = null;
    if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
      appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found." });
      }
      if (String(appointment.doctorId) !== String(doctor._id)) {
        return res.status(403).json({
          message: "You are not authorized to order lab tests for this appointment.",
        });
      }
    }

    const { patient, user } = await resolvePatientContext(patientId);

    if (!Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({ message: "At least one lab test must be selected." });
    }

    const normalizedTests = tests.map((test) => ({
      testName: test.testName,
      testCode: test.testCode || "",
      price: Number(test.price || 0),
    }));

    const totalAmount = normalizedTests.reduce((sum, test) => sum + test.price, 0);

    const labOrder = await LabOrder.create({
      patientId: patient._id,
      patientUserId: user._id,
      doctorId: doctor._id,
      appointmentId: appointment?._id || null,
      status: "ordered",
      paymentStatus: "pending",
      urgency,
      totalAmount,
      notes,
    });

    await Promise.all(
      normalizedTests.map((test) =>
        LabOrderItem.create({
          labOrderId: labOrder._id,
          testName: test.testName,
          testCode: test.testCode,
          price: test.price,
          status: "ordered",
        })
      )
    );

    await upsertLabInvoice({
      labOrder,
      patient,
      user,
      tests: normalizedTests,
      createdBy: req.user.id,
    });

    const populatedOrder = await LabOrder.findById(labOrder._id).populate(orderPopulate);

    res.status(201).json({
      success: true,
      message: "Lab order created successfully.",
      data: await formatOrder(populatedOrder),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorLabOrders = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(403).json({ message: "Doctor profile not found." });
    }

    const query = { doctorId: doctor._id };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const orders = await LabOrder.find(query).populate(orderPopulate).sort({ createdAt: -1 });
    const data = await Promise.all(
      orders.map(async (order) => {
        await syncLabOrderPaymentState(order._id);
        const refreshed = await LabOrder.findById(order._id).populate(orderPopulate);
        return formatOrder(refreshed);
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLabOrderById = async (req, res) => {
  try {
    await syncLabOrderPaymentState(req.params.id);

    const labOrder = await LabOrder.findById(req.params.id).populate(orderPopulate);
    if (!labOrder) {
      return res.status(404).json({ message: "Lab order not found." });
    }

    const hasAccess = await verifyOrderAccess(req, labOrder);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied." });
    }

    const viewerRole = req.user.role === "patient" ? "patient" : "internal";

    res.json({
      success: true,
      data: await formatOrder(labOrder, viewerRole),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientLabOrders = async (req, res) => {
  try {
    const { patient, user } = await resolvePatientContext(req.user.id);
    const orders = await LabOrder.find({ patientId: patient._id, patientUserId: user._id })
      .populate(orderPopulate)
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      orders.map(async (order) => {
        await syncLabOrderPaymentState(order._id);
        const refreshed = await LabOrder.findById(order._id).populate(orderPopulate);
        return formatOrder(refreshed, "patient");
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadLabOrderPDF = async (req, res) => {
  try {
    const labOrder = await LabOrder.findById(req.params.id).populate(orderPopulate);
    if (!labOrder) {
      return res.status(404).json({ message: "Lab order not found." });
    }

    const hasAccess = await verifyOrderAccess(req, labOrder);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied." });
    }

    const items = await LabOrderItem.find({ labOrderId: labOrder._id });
    generateLabOrderPDF(res, labOrder, items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLabOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!LAB_WORKFLOW_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const labOrder = await LabOrder.findById(req.params.id);
    if (!labOrder) {
      return res.status(404).json({ message: "Lab order not found." });
    }

    labOrder.status = status;
    if (status === "completed") {
      labOrder.completedAt = new Date();
    }
    if (status === "cancelled") {
      labOrder.cancelledAt = new Date();
    }
    await labOrder.save();

    const updatedOrder = await LabOrder.findById(req.params.id).populate(orderPopulate);
    res.json({
      success: true,
      message: "Lab order status updated.",
      data: await formatOrder(updatedOrder),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listLabOrdersForWorkflow = async (req, res) => {
  try {
    const {
      search,
      patient,
      doctor,
      urgency,
      paymentStatus,
      status,
      orderId,
      date,
      startDate,
      endDate,
      sort = "latest",
    } = req.query;

    const query = {};

    if (urgency) query.urgency = urgency;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (status) query.status = status;
    if (orderId) {
      query.$or = [
        { orderNumber: { $regex: orderId, $options: "i" } },
        ...(mongoose.Types.ObjectId.isValid(orderId) ? [{ _id: orderId }] : []),
      ];
    }

    if (date || startDate || endDate) {
      query.createdAt = {};
      if (date) {
        const from = new Date(`${date}T00:00:00`);
        const to = new Date(`${date}T23:59:59`);
        query.createdAt.$gte = from;
        query.createdAt.$lte = to;
      } else {
        if (startDate) query.createdAt.$gte = new Date(`${startDate}T00:00:00`);
        if (endDate) query.createdAt.$lte = new Date(`${endDate}T23:59:59`);
      }
    }

    const orders = await LabOrder.find(query)
      .populate(orderPopulate)
      .sort(sort === "oldest" ? { createdAt: 1 } : { urgency: 1, createdAt: -1 });

    const hydrated = await Promise.all(
      orders.map(async (order) => {
        await syncLabOrderPaymentState(order._id);
        const refreshed = await LabOrder.findById(order._id).populate(orderPopulate);
        return formatOrder(refreshed);
      })
    );

    const normalizedSearch = (search || "").trim().toLowerCase();
    const normalizedPatient = (patient || "").trim().toLowerCase();
    const normalizedDoctor = (doctor || "").trim().toLowerCase();

    const filtered = hydrated.filter((order) => {
      const patientName = order.patientName?.toLowerCase() || "";
      const patientId = order.patientId?.userId?.patientId?.toLowerCase() || "";
      const doctorName = order.doctorName?.toLowerCase() || "";
      const orderNumber = order.orderNumber?.toLowerCase() || "";

      const matchesSearch =
        !normalizedSearch ||
        patientName.includes(normalizedSearch) ||
        patientId.includes(normalizedSearch) ||
        doctorName.includes(normalizedSearch) ||
        orderNumber.includes(normalizedSearch) ||
        String(order._id).toLowerCase().includes(normalizedSearch);

      const matchesPatient =
        !normalizedPatient || patientName.includes(normalizedPatient) || patientId.includes(normalizedPatient);
      const matchesDoctor = !normalizedDoctor || doctorName.includes(normalizedDoctor);

      return matchesSearch && matchesPatient && matchesDoctor;
    });

    res.json({ success: true, data: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLabOrderDetailForWorkflow = async (req, res) => {
  return getLabOrderById(req, res);
};

export const setLabOrderStatusAndItems = async ({
  orderId,
  status,
  itemStatus,
  itemIds = [],
  timestamps = {},
}) => {
  const order = await LabOrder.findById(orderId);
  if (!order) {
    return null;
  }

  const itemFilter = {
    labOrderId: order._id,
    ...(itemIds.length ? { _id: { $in: itemIds } } : {}),
  };

  const itemUpdate = { status: itemStatus };
  Object.assign(itemUpdate, timestamps.item || {});

  await LabOrderItem.updateMany(itemFilter, { $set: itemUpdate });

  order.status = status;
  Object.assign(order, timestamps.order || {});
  await order.save();

  return LabOrder.findById(orderId).populate(orderPopulate);
};

export const validateLabItemSelection = async (orderId, itemIds = []) => {
  if (!itemIds.length) {
    return true;
  }

  const count = await LabOrderItem.countDocuments({
    labOrderId: orderId,
    _id: { $in: itemIds },
  });

  return count === itemIds.length;
};

export const completeLabOrderIfReleased = async (orderId) => {
  const items = await LabOrderItem.find({ labOrderId: orderId });
  const allReleased = items.length > 0 && items.every((item) => normalizeLabItemStatus(item.status) === "reportReleasedToPortal");

  if (!allReleased) {
    return null;
  }

  const order = await LabOrder.findById(orderId);
  if (!order) {
    return null;
  }

  order.status = "completed";
  order.completedAt = new Date();
  await order.save();
  return order;
};

export { LAB_ITEM_WORKFLOW_STATUSES, LAB_WORKFLOW_STATUSES, orderPopulate, formatOrder, syncLabOrderPaymentState };
