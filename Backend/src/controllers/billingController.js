import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Invoice from "../models/Invoice.js";
import LabOrder from "../models/LabOrder.js";
import PharmacyOrder from "../models/PharmacyOrder.js";
import Bed from "../models/Bed.js";
import { ensurePatientProfileForUser, resolvePatientContext } from "../utils/patientContext.js";
import { getOrderStatusForPayment } from "../utils/labWorkflow.js";
import { getOrderStatusForPayment as getPharmacyStatusForPayment } from "../utils/pharmacyWorkflow.js";
import { notifyPatient } from "../services/notificationService.js";
import { logAudit } from "../services/auditLogService.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateInvoicePDF } from "../utils/generateInvoicePDF.js";
import HospitalSettings from "../models/HospitalSettings.js";

const INVOICE_POPULATE = [
  { path: "patientId", populate: { path: "userId", select: "name email phone patientId" } },
  { path: "patientUserId", select: "name email phone patientId" },
  { path: "appointmentId", populate: [
    { path: "doctorId", populate: { path: "userId", select: "name email employeeId" } },
    { path: "hospitalLocationId", select: "name city state" },
  ] },
  { path: "labOrderId", select: "orderNumber status paymentStatus urgency totalAmount appointmentId createdAt" },
  { path: "pharmacyOrderId", select: "status paymentStatus total items createdAt completedAt prescriptionId" },
  { path: "bedId", select: "bedNumber status admittedAt dischargedAt" },
  { path: "wardId", select: "name wardNumber wardType defaultPrice" },
];

const asOptionalObjectId = (value) => (value ? value : undefined);
const asOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const normalizeLineItem = (item = {}) => {
  const quantity = Number(item.quantity || 1);
  const unitPrice = Number(item.unitPrice || 0);
  return {
    label: item.label,
    category: item.category,
    referenceType: item.referenceType,
    referenceId: asOptionalObjectId(item.referenceId),
    quantity,
    unitPrice,
    lineTotal: Number(item.lineTotal ?? quantity * unitPrice),
    notes: item.notes,
  };
};

const buildLegacyLineItems = (payload) => {
  const lineItems = [];

  if (asOptionalNumber(payload.doctorFee) > 0) {
    lineItems.push({
      label: "Consultation Fee",
      category: "consultation",
      referenceType: payload.appointmentId ? "appointment" : "manual",
      referenceId: asOptionalObjectId(payload.appointmentId),
      quantity: Number(payload.daysConsulted || 1),
      unitPrice: Number(payload.doctorFee || 0) / Math.max(1, Number(payload.daysConsulted || 1)),
      lineTotal: Number(payload.doctorFee || 0),
    });
  }

  (payload.labReportsBreakdown || []).forEach((item) => {
    lineItems.push({
      label: item.reportName || item.label || "Lab Charge",
      category: "lab",
      referenceType: payload.labOrderId ? "labOrder" : "manual",
      referenceId: asOptionalObjectId(payload.labOrderId),
      quantity: 1,
      unitPrice: Number(item.price || 0),
      lineTotal: Number(item.price || 0),
    });
  });

  (payload.medicinesBreakdown || []).forEach((item) => {
    lineItems.push({
      label: item.name || item.label || "Medicine",
      category: "medicine",
      referenceType: payload.pharmacyOrderId ? "pharmacyOrder" : "manual",
      referenceId: asOptionalObjectId(payload.pharmacyOrderId),
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.price || item.unitPrice || 0),
      lineTotal: Number(item.lineTotal || Number(item.quantity || 1) * Number(item.price || item.unitPrice || 0)),
    });
  });

  if (asOptionalNumber(payload.labCharges) > 0 && !(payload.labReportsBreakdown || []).length) {
    lineItems.push({
      label: "Lab Charges",
      category: "lab",
      referenceType: payload.labOrderId ? "labOrder" : "manual",
      referenceId: asOptionalObjectId(payload.labOrderId),
      quantity: 1,
      unitPrice: Number(payload.labCharges || 0),
      lineTotal: Number(payload.labCharges || 0),
    });
  }

  if (asOptionalNumber(payload.medicineCharges) > 0 && !(payload.medicinesBreakdown || []).length) {
    lineItems.push({
      label: "Medicine Charges",
      category: "medicine",
      referenceType: payload.pharmacyOrderId ? "pharmacyOrder" : "manual",
      referenceId: asOptionalObjectId(payload.pharmacyOrderId),
      quantity: 1,
      unitPrice: Number(payload.medicineCharges || 0),
      lineTotal: Number(payload.medicineCharges || 0),
    });
  }

  if (asOptionalNumber(payload.otherCharges) > 0) {
    lineItems.push({
      label: "Other Charges",
      category: "other",
      referenceType: "manual",
      quantity: 1,
      unitPrice: Number(payload.otherCharges || 0),
      lineTotal: Number(payload.otherCharges || 0),
    });
  }

  return lineItems;
};

const sumPaymentHistory = (invoice) => {
  if (!Array.isArray(invoice.paymentHistory) || invoice.paymentHistory.length === 0) {
    return invoice.paymentStatus === "paid" ? Number(invoice.totalAmount || 0) : 0;
  }
  return invoice.paymentHistory.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
};

const mapInvoice = (invoice) => {
  const patientUser = invoice.patientId?.userId || invoice.patientUserId;
  const totalPaid = sumPaymentHistory(invoice);
  const totalAmount = Number(invoice.totalAmount || 0);
  const balance = Math.max(totalAmount - totalPaid, 0);
  return {
    id: invoice._id,
    _id: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    billType: invoice.billType,
    paymentStatus: invoice.paymentStatus,
    paymentMethod: invoice.paymentMethod || null,
    paidAt: invoice.paidAt,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    subtotal: invoice.subtotal || invoice.totalAmount || 0,
    totalAmount,
    totalPaid,
    balance,
    paymentHistory: invoice.paymentHistory || [],
    discount: invoice.discount || null,
    insuranceCoverage: invoice.insuranceCoverage || null,
    notes: invoice.notes || "",
    patient: patientUser
      ? {
          id: invoice.patientId?._id,
          userId: patientUser._id,
          name: patientUser.name,
          email: patientUser.email,
          phone: patientUser.phone,
          patientId: patientUser.patientId,
        }
      : null,
    context: {
      appointment: invoice.appointmentId
        ? {
            id: invoice.appointmentId._id,
            date: invoice.appointmentId.date,
            slot: invoice.appointmentId.slot,
            status: invoice.appointmentId.status,
            consultationMode: invoice.appointmentId.consultationMode,
            locationName: invoice.appointmentId.hospitalLocationId?.name,
            doctorName: invoice.appointmentId.doctorId?.userId?.name,
          }
        : null,
      labOrder: invoice.labOrderId
        ? {
            id: invoice.labOrderId._id,
            orderNumber: invoice.labOrderId.orderNumber,
            status: invoice.labOrderId.status,
            paymentStatus: invoice.labOrderId.paymentStatus,
            urgency: invoice.labOrderId.urgency,
          }
        : null,
      pharmacyOrder: invoice.pharmacyOrderId
        ? {
            id: invoice.pharmacyOrderId._id,
            status: invoice.pharmacyOrderId.status,
            paymentStatus: invoice.pharmacyOrderId.paymentStatus,
            total: invoice.pharmacyOrderId.total,
          }
        : null,
      ward: invoice.wardId
        ? {
            id: invoice.wardId._id,
            name: invoice.wardId.name,
            wardNumber: invoice.wardId.wardNumber,
            wardType: invoice.wardId.wardType,
          }
        : null,
      bed: invoice.bedId
        ? {
            id: invoice.bedId._id,
            bedNumber: invoice.bedId.bedNumber,
            status: invoice.bedId.status,
          }
        : null,
    },
    lineItems: (invoice.lineItems || []).map((item, index) => ({
      id: `${invoice._id}-${index}`,
      label: item.label,
      category: item.category,
      referenceType: item.referenceType,
      referenceId: item.referenceId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal || Number(item.quantity || 0) * Number(item.unitPrice || 0),
      notes: item.notes,
    })),
  };
};

const getFrontendBase = () => process.env.FRONTEND_URL || "http://localhost:5173";
const getApiBase = () => process.env.BACKEND_URL || "http://localhost:3500/api";

const syncInvoicePaymentState = async (invoice) => {
  const paidAt = invoice.paidAt || new Date();

  if (invoice.labOrderId) {
    const labOrder = await LabOrder.findById(invoice.labOrderId);
    if (labOrder) {
      labOrder.paymentStatus = invoice.paymentStatus;
      if (invoice.paymentStatus === "paid") {
        labOrder.paymentCompletedAt = paidAt;
      }
      labOrder.status = getOrderStatusForPayment({
        currentStatus: labOrder.status,
        paymentStatus: invoice.paymentStatus,
      });
      labOrder.invoiceId = invoice._id;
      await labOrder.save();
    }
  }

  if (invoice.pharmacyOrderId) {
    const pharmacyOrder = await PharmacyOrder.findById(invoice.pharmacyOrderId);
    if (pharmacyOrder) {
      pharmacyOrder.paymentStatus = invoice.paymentStatus;
      pharmacyOrder.status = getPharmacyStatusForPayment({
        currentStatus: pharmacyOrder.status,
        paymentStatus: invoice.paymentStatus,
      });
      pharmacyOrder.invoiceId = invoice._id;
      await pharmacyOrder.save();
    }
  }
};

const ensureInvoiceAccess = async (req, invoice) => {
  if (["admin", "superadmin", "receptionist"].includes(req.user.role)) {
    return true;
  }

  if (req.user.role === "patient") {
    const { patient } = await ensurePatientProfileForUser(req.user.id);
    return String(invoice.patientId?._id || invoice.patientId) === String(patient._id);
  }

  return false;
};

const resolveInvoicePatientContext = async ({ patientId, appointmentId, labOrderId, pharmacyOrderId, bedId }) => {
  if (patientId) {
    return resolvePatientContext(patientId);
  }

  if (appointmentId) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) throw new Error("Appointment not found.");
    return resolvePatientContext(appointment.patientProfileId || appointment.patientId);
  }

  if (labOrderId) {
    const labOrder = await LabOrder.findById(labOrderId);
    if (!labOrder) throw new Error("Lab order not found.");
    return resolvePatientContext(labOrder.patientId);
  }

  if (pharmacyOrderId) {
    const pharmacyOrder = await PharmacyOrder.findById(pharmacyOrderId);
    if (!pharmacyOrder) throw new Error("Pharmacy order not found.");
    return resolvePatientContext(pharmacyOrder.patientId);
  }

  if (bedId) {
    const bed = await Bed.findById(bedId);
    if (!bed) throw new Error("Bed not found.");
    return resolvePatientContext(bed.patientProfileId || bed.patientId);
  }

  throw new Error("Patient reference is required.");
};

export const createInvoice = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      labOrderId,
      pharmacyOrderId,
      bedId,
      wardId,
      billType = "mixed",
      paymentStatus = "pending",
      paymentMethod,
      notes,
    } = req.body;

    const { patient, user } = await resolveInvoicePatientContext({
      patientId,
      appointmentId,
      labOrderId,
      pharmacyOrderId,
      bedId,
    });

    if (appointmentId) {
      const existing = await Invoice.findOne({ appointmentId });
      if (existing) {
        return res.status(400).json({ message: "An invoice already exists for this appointment." });
      }
    }

    if (labOrderId) {
      const existing = await Invoice.findOne({ labOrderId });
      if (existing) {
        return res.status(400).json({ message: "An invoice already exists for this lab order." });
      }
    }

    if (pharmacyOrderId) {
      const existing = await Invoice.findOne({ pharmacyOrderId });
      if (existing) {
        return res.status(400).json({ message: "An invoice already exists for this pharmacy order." });
      }
    }

    const providedLineItems = Array.isArray(req.body.lineItems) ? req.body.lineItems.map(normalizeLineItem) : [];
    const legacyLineItems = buildLegacyLineItems(req.body);
    const lineItems = providedLineItems.length ? providedLineItems : legacyLineItems;

    if (!lineItems.length) {
      return res.status(400).json({ message: "At least one bill line item is required." });
    }

  const invoice = await Invoice.create({
      patientId: patient._id,
      patientUserId: user._id,
      appointmentId: asOptionalObjectId(appointmentId),
      labOrderId: asOptionalObjectId(labOrderId),
      pharmacyOrderId: asOptionalObjectId(pharmacyOrderId),
      bedId: asOptionalObjectId(bedId),
      wardId: asOptionalObjectId(wardId),
      billType,
      lineItems,
      daysConsulted: Number(req.body.daysConsulted || 1),
      medicinesBreakdown: req.body.medicinesBreakdown || [],
      labReportsBreakdown: req.body.labReportsBreakdown || [],
      doctorFee: asOptionalNumber(req.body.doctorFee),
      labCharges: asOptionalNumber(req.body.labCharges),
      medicineCharges: asOptionalNumber(req.body.medicineCharges),
      otherCharges: asOptionalNumber(req.body.otherCharges),
      paymentStatus,
      paymentMethod,
      paidAt: paymentStatus === "paid" ? new Date() : undefined,
      discount: req.body.discount || undefined,
      insuranceCoverage: req.body.insuranceCoverage || undefined,
      paymentHistory: paymentStatus === "paid"
        ? [
            {
              amount: lineItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
              method: paymentMethod,
              paidAt: new Date(),
              notes: "Initial payment",
            },
          ]
        : [],
      notes,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    await syncInvoicePaymentState(invoice);
    const populated = await Invoice.findById(invoice._id).populate(INVOICE_POPULATE);

    if (invoice.paymentStatus !== "paid") {
      await notifyPatient({
        userId: user._id,
        patientId: patient._id,
        key: `invoice:${invoice._id}:pending`,
        type: "billing",
        title: "Payment pending",
        message: `${invoice.billType} bill awaiting payment.`,
        sourceType: "invoice",
        sourceId: invoice._id,
        metadata: { billType: invoice.billType, totalAmount: invoice.totalAmount },
      });
    }

    if (user?.email) {
      const frontendUrl = getFrontendBase();
      const apiUrl = getApiBase();
      const invoiceLink = `${frontendUrl}/patient/bills?invoice=${invoice._id}`;
      const pdfLink = `${apiUrl}/billing/${invoice._id}/pdf`;
      await sendEmail(
        user.email,
        "Your Invoice is Ready",
        `Your invoice ${invoice.invoiceNumber} is ready. View it in the patient portal: ${invoiceLink} or download PDF: ${pdfLink}`
      );
    }

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "invoice_created",
      entityType: "Invoice",
      entityId: invoice._id,
      details: { billType: invoice.billType, totalAmount: invoice.totalAmount },
    });

    return res.status(201).json({
      message: "Invoice created successfully.",
      invoice: mapInvoice(populated),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const downloadInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(INVOICE_POPULATE);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    if (!(await ensureInvoiceAccess(req, invoice))) {
      return res.status(403).json({ message: "Access forbidden." });
    }
    const settings = await HospitalSettings.findOne({ isActive: true }).sort({ updatedAt: -1 });
    await generateInvoicePDF(res, invoice, settings || {});
    return undefined;
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const emailInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(INVOICE_POPULATE);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    if (!(await ensureInvoiceAccess(req, invoice))) {
      return res.status(403).json({ message: "Access forbidden." });
    }

    const patientUser = invoice.patientId?.userId || invoice.patientUserId;
    if (!patientUser?.email) {
      return res.status(400).json({ message: "Patient email not available." });
    }

    const frontendUrl = getFrontendBase();
    const apiUrl = getApiBase();
    const invoiceLink = `${frontendUrl}/patient/bills?invoice=${invoice._id}`;
    const pdfLink = `${apiUrl}/billing/${invoice._id}/pdf`;

    await sendEmail(
      patientUser.email,
      "Your Invoice Receipt",
      `Here is your invoice ${invoice.invoiceNumber}. View it: ${invoiceLink} or download PDF: ${pdfLink}`
    );

    return res.json({ message: "Invoice email sent successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    const {
      search = "",
      billType,
      paymentStatus,
      date,
      patientId,
      appointmentId,
      labOrderId,
      pharmacyOrderId,
    } = req.query;

    const filter = {};
    if (billType) filter.billType = billType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (patientId) filter.patientId = patientId;
    if (appointmentId) filter.appointmentId = appointmentId;
    if (labOrderId) filter.labOrderId = labOrderId;
    if (pharmacyOrderId) filter.pharmacyOrderId = pharmacyOrderId;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    let invoices = await Invoice.find(filter)
      .populate(INVOICE_POPULATE)
      .sort({ createdAt: -1 });

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      invoices = invoices.filter((invoice) => {
        const patientUser = invoice.patientId?.userId || invoice.patientUserId;
        const text = [
          invoice.invoiceNumber,
          invoice.billType,
          patientUser?.name,
          patientUser?.patientId,
          invoice.appointmentId?._id,
          invoice.labOrderId?.orderNumber,
          invoice.pharmacyOrderId?._id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(query);
      });
    }

    return res.json(invoices.map(mapInvoice));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(INVOICE_POPULATE);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    if (!(await ensureInvoiceAccess(req, invoice))) {
      return res.status(403).json({ message: "Access forbidden." });
    }

    return res.json(mapInvoice(invoice));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyInvoices = async (req, res) => {
  try {
    const { patient } = await ensurePatientProfileForUser(req.user.id);
    const filter = { patientId: patient._id };
    if (req.query.billType) filter.billType = req.query.billType;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.date) {
      const start = new Date(req.query.date);
      const end = new Date(req.query.date);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    const invoices = await Invoice.find(filter)
      .populate(INVOICE_POPULATE)
      .sort({ createdAt: -1 });

    return res.json(invoices.map(mapInvoice));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPatientInvoice = async (req, res) => {
  try {
    const { patient } = await resolvePatientContext(req.params.patientId);
    const invoices = await Invoice.find({ patientId: patient._id })
      .populate(INVOICE_POPULATE)
      .sort({ createdAt: -1 });

    return res.json(invoices.map(mapInvoice));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getInvoicesByContext = async (req, res) => {
  try {
    const filter = {};
    if (req.query.appointmentId) filter.appointmentId = req.query.appointmentId;
    if (req.query.labOrderId) filter.labOrderId = req.query.labOrderId;
    if (req.query.pharmacyOrderId) filter.pharmacyOrderId = req.query.pharmacyOrderId;
    if (req.query.bedId) filter.bedId = req.query.bedId;
    if (req.query.wardId) filter.wardId = req.query.wardId;

    const invoices = await Invoice.find(filter)
      .populate(INVOICE_POPULATE)
      .sort({ createdAt: -1 });

    return res.json(invoices.map(mapInvoice));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const payInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(INVOICE_POPULATE);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found." });
    }

    if (!(await ensureInvoiceAccess(req, invoice))) {
      return res.status(403).json({ message: "Access forbidden." });
    }

    if (invoice.paymentStatus === "paid") {
      return res.status(400).json({ message: "Invoice is already paid." });
    }

    const paymentMethod = req.body.paymentMethod || invoice.paymentMethod;
    const requestedAmount = Number(req.body.amount || 0);
    const notes = req.body.notes;
    const alreadyPaid = sumPaymentHistory(invoice);
    const totalAmount = Number(invoice.totalAmount || 0);
    const remaining = Math.max(totalAmount - alreadyPaid, 0);
    const amountToPay = requestedAmount > 0 ? Math.min(requestedAmount, remaining) : remaining;

    if (amountToPay <= 0) {
      return res.status(400).json({ message: "No outstanding balance to pay." });
    }

    if (!Array.isArray(invoice.paymentHistory)) {
      invoice.paymentHistory = [];
    }

    invoice.paymentHistory.push({
      amount: amountToPay,
      method: paymentMethod,
      paidAt: new Date(),
      notes,
    });

    const newPaidTotal = alreadyPaid + amountToPay;
    invoice.paymentStatus = newPaidTotal >= totalAmount ? "paid" : "partiallyPaid";
    invoice.paymentMethod = paymentMethod;
    invoice.paidAt = invoice.paymentStatus === "paid" ? new Date() : invoice.paidAt;
    invoice.updatedBy = req.user.id;
    await invoice.save();
    await syncInvoicePaymentState(invoice);

    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "invoice_paid",
      entityType: "Invoice",
      entityId: invoice._id,
      details: { paymentMethod: invoice.paymentMethod },
    });

    const refreshed = await Invoice.findById(invoice._id).populate(INVOICE_POPULATE);

    return res.json({
      message: "Payment completed successfully.",
      invoice: mapInvoice(refreshed),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const initiateConsultationBilling = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    const existingInvoice = await Invoice.findOne({ appointmentId: appointment._id });
    if (existingInvoice) {
      const populated = await Invoice.findById(existingInvoice._id).populate(INVOICE_POPULATE);
      return res.status(400).json({ message: "Billing already initiated for this appointment.", invoice: mapInvoice(populated) });
    }

    const doctor = await Doctor.findById(appointment.doctorId);
    const { patient, user } = await resolvePatientContext(appointment.patientProfileId || appointment.patientId);
    const doctorFee = doctor?.consultationFee || 0;

    const invoice = await Invoice.create({
      patientId: patient._id,
      patientUserId: user._id,
      appointmentId: appointment._id,
      billType: "consultation",
      doctorFee,
      lineItems: [
        {
          label: "Consultation Fee",
          category: "consultation",
          referenceType: "appointment",
          referenceId: appointment._id,
          quantity: 1,
          unitPrice: doctorFee,
          lineTotal: doctorFee,
        },
      ],
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    const populated = await Invoice.findById(invoice._id).populate(INVOICE_POPULATE);

    return res.status(201).json({
      message: "Consultation invoice initiated successfully.",
      invoice: mapInvoice(populated),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
