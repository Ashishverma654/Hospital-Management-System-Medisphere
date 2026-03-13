import LabTechnician from "../models/LabTechnician.js";
import LabOrder from "../models/LabOrder.js";
import LabOrderItem from "../models/LabOrderItem.js";
import LabReport from "../models/LabReport.js";
import {
  completeLabOrderIfReleased,
  formatOrder,
  getLabOrderDetailForWorkflow,
  listLabOrdersForWorkflow,
  orderPopulate,
  setLabOrderStatusAndItems,
  syncLabOrderPaymentState,
  validateLabItemSelection,
} from "./labOrderController.js";
import { toStructuredSchedule } from "../utils/labWorkflow.js";
import { notifyPatient } from "../services/notificationService.js";

const hydrateOrder = async (orderId) => {
  await syncLabOrderPaymentState(orderId);
  const order = await LabOrder.findById(orderId).populate(orderPopulate);
  return order ? formatOrder(order) : null;
};

export const getDashboardStats = async (req, res) => {
  try {
    const tech = await LabTechnician.findOne({ userId: req.user.id });
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      pendingLabOrders,
      urgentLabOrders,
      pendingSampleCollections,
      inProcessingTests,
      completedReportsToday,
      readyButNotReleased,
      queue,
    ] = await Promise.all([
      LabOrder.countDocuments({ status: { $in: ["ordered", "awaitingPayment", "paid"] } }),
      LabOrder.countDocuments({
        urgency: { $in: ["urgent", "stat"] },
        status: { $nin: ["completed", "cancelled"] },
      }),
      LabOrder.countDocuments({ status: "sampleScheduled" }),
      LabOrderItem.countDocuments({ status: "inProcessing" }),
      LabReport.countDocuments({
        releasedAt: { $gte: startOfToday },
        releasedToPortal: true,
      }),
      LabOrder.countDocuments({
        status: { $in: ["reportReady", "reportAvailableForPickup"] },
        releasedToPortal: false,
      }),
      LabOrder.find({
        status: { $nin: ["completed", "cancelled"] },
      })
        .populate(orderPopulate)
        .sort({ urgency: 1, createdAt: -1 })
        .limit(5),
    ]);

    res.json({
      success: true,
      data: {
        labSection: tech?.labSection || "General Diagnostics",
        summary: {
          pendingLabOrders,
          urgentLabOrders,
          pendingSampleCollections,
          inProcessingTests,
          completedReportsToday,
          readyButNotReleased,
        },
        quickQueue: await Promise.all(queue.map((order) => formatOrder(order))),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const tech = await LabTechnician.findOne({ userId: req.user.id })
      .populate("userId", "name email phone gender profileImage employeeId")
      .populate("departmentId", "name");

    if (!tech) {
      return res.status(404).json({ message: "Lab Technician profile not found." });
    }

    res.json(tech);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { labSection, certifications } = req.body;
    let tech = await LabTechnician.findOne({ userId: req.user.id });

    if (!tech) {
      tech = await LabTechnician.create({ userId: req.user.id, ...req.body });
    } else {
      if (labSection !== undefined) tech.labSection = labSection;
      if (certifications !== undefined) tech.certifications = certifications;
      await tech.save();
    }

    res.json({ message: "Profile updated.", tech });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingReports = async (req, res) => {
  try {
    const orders = await LabOrder.find({
      status: { $in: ["inProcessing", "reportReady", "reportAvailableForPickup"] },
      releasedToPortal: false,
    })
      .populate(orderPopulate)
      .sort({ urgency: 1, updatedAt: -1 });

    res.json({
      success: true,
      data: await Promise.all(orders.map((order) => formatOrder(order))),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listWorkflowOrders = listLabOrdersForWorkflow;
export const getWorkflowOrderById = getLabOrderDetailForWorkflow;

export const scheduleSampleCollection = async (req, res) => {
  try {
    const { date, time, notes, itemIds = [] } = req.body;
    const validSelection = await validateLabItemSelection(req.params.id, itemIds);
    if (!validSelection) {
      return res.status(400).json({ message: "Selected lab items do not belong to this order." });
    }

    const order = await LabOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Lab order not found." });
    }

    order.sampleCollectionSchedule = toStructuredSchedule({
      date,
      time,
      notes,
      assignedBy: req.user.id,
      currentValue: order.sampleCollectionSchedule,
    });
    order.status = "sampleScheduled";
    await order.save();

    await LabOrderItem.updateMany(
      {
        labOrderId: order._id,
        ...(itemIds.length ? { _id: { $in: itemIds } } : {}),
      },
      { $set: { status: "sampleScheduled" } }
    );

    await notifyPatient({
      userId: order.patientUserId,
      patientId: order.patientId,
      key: `lab:${order._id}:sampleScheduled`,
      type: "lab",
      title: "Sample collection scheduled",
      message: `Sample collection scheduled for ${date} at ${time}.`,
      sourceType: "labOrder",
      sourceId: order._id,
      metadata: { date, time, status: order.status },
    });

    res.json({
      success: true,
      message: "Sample collection scheduled.",
      data: await hydrateOrder(order._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const scheduleReportPickup = async (req, res) => {
  try {
    const { date, time, notes } = req.body;
    const order = await LabOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Lab order not found." });
    }

    order.reportPickupSchedule = toStructuredSchedule({
      date,
      time,
      notes,
      assignedBy: req.user.id,
      currentValue: order.reportPickupSchedule,
    });
    order.status = "reportAvailableForPickup";
    await order.save();

    await LabOrderItem.updateMany(
      { labOrderId: order._id },
      { $set: { status: "reportAvailableForPickup" } }
    );

    res.json({
      success: true,
      message: "Report pickup time scheduled.",
      data: await hydrateOrder(order._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markSampleCollected = async (req, res) => {
  try {
    const { itemIds = [] } = req.body;
    const validSelection = await validateLabItemSelection(req.params.id, itemIds);
    if (!validSelection) {
      return res.status(400).json({ message: "Selected lab items do not belong to this order." });
    }

    const now = new Date();
    const order = await setLabOrderStatusAndItems({
      orderId: req.params.id,
      status: "sampleCollected",
      itemStatus: "sampleCollected",
      itemIds,
      timestamps: {
        order: { sampleCollectedAt: now },
        item: { sampleCollectedAt: now },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Lab order not found." });
    }

    res.json({
      success: true,
      message: "Sample marked as collected.",
      data: await formatOrder(order),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markInProcessing = async (req, res) => {
  try {
    const { itemIds = [] } = req.body;
    const validSelection = await validateLabItemSelection(req.params.id, itemIds);
    if (!validSelection) {
      return res.status(400).json({ message: "Selected lab items do not belong to this order." });
    }

    const now = new Date();
    const order = await setLabOrderStatusAndItems({
      orderId: req.params.id,
      status: "inProcessing",
      itemStatus: "inProcessing",
      itemIds,
      timestamps: {
        order: { processingStartedAt: now },
        item: { processingStartedAt: now },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Lab order not found." });
    }

    res.json({
      success: true,
      message: "Lab order moved to processing.",
      data: await formatOrder(order),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markReportReady = async (req, res) => {
  try {
    const { itemIds = [] } = req.body;
    const validSelection = await validateLabItemSelection(req.params.id, itemIds);
    if (!validSelection) {
      return res.status(400).json({ message: "Selected lab items do not belong to this order." });
    }

    const now = new Date();
    const order = await setLabOrderStatusAndItems({
      orderId: req.params.id,
      status: "reportReady",
      itemStatus: "reportReady",
      itemIds,
      timestamps: {
        order: { reportReadyAt: now },
        item: { reportReadyAt: now },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Lab order not found." });
    }

    res.json({
      success: true,
      message: "Report marked as ready.",
      data: await formatOrder(order),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const releaseReportToPortal = async (req, res) => {
  try {
    const order = await syncLabOrderPaymentState(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Lab order not found." });
    }

    if (order.paymentStatus !== "paid") {
      return res.status(400).json({
        message: "Lab report cannot be released to the patient portal until payment is completed.",
      });
    }

    const reports = await LabReport.find({ labOrderId: order._id });
    if (!reports.length) {
      return res.status(400).json({ message: "Upload a report before releasing it to the portal." });
    }

    const releasedAt = new Date();

    await LabReport.updateMany(
      { labOrderId: order._id },
      { $set: { releasedToPortal: true, releasedAt, status: "released" } }
    );

    await LabOrderItem.updateMany(
      { labOrderId: order._id },
      { $set: { status: "reportReleasedToPortal", reportReleasedAt: releasedAt } }
    );

    order.releasedToPortal = true;
    order.status = "reportReleasedToPortal";
    order.reportReleasedAt = releasedAt;
    await order.save();
    await completeLabOrderIfReleased(order._id);

    await notifyPatient({
      userId: order.patientUserId,
      patientId: order.patientId,
      key: `lab:${order._id}:reportReleased`,
      type: "lab",
      title: "Lab report released",
      message: `${order.orderNumber || "Lab order"} report is now available in your portal.`,
      sourceType: "labOrder",
      sourceId: order._id,
      metadata: { status: order.status, releasedAt },
    });

    res.json({
      success: true,
      message: "Report released to the patient portal.",
      data: await hydrateOrder(order._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
