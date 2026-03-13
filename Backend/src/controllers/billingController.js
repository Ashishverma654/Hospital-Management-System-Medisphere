import Invoice from "../models/Invoice.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import LabOrder from "../models/LabOrder.js";
import { sendEmail } from "../utils/sendEmail.js";
import { ensurePatientProfileForUser, resolvePatientContext } from "../utils/patientContext.js";
import { getOrderStatusForPayment } from "../utils/labWorkflow.js";

export const createInvoice = async (req, res) => {
    try {
        const { patientId, appointmentId, doctorFee, labCharges, medicineCharges, otherCharges, daysConsulted, medicinesBreakdown, labReportsBreakdown } = req.body;

        const totalAmount = (doctorFee || 0) + (labCharges || 0) + (medicineCharges || 0) + (otherCharges || 0);

        const { patient, user } = await resolvePatientContext(patientId);

        const invoice = new Invoice({
            patientId: patient._id,
            patientUserId: user._id,
            appointmentId,
            doctorFee,
            labCharges,
            medicineCharges,
            otherCharges,
            totalAmount,
            daysConsulted,
            medicinesBreakdown,
            labReportsBreakdown,
            createdBy: req.user.id,
        });

        await invoice.save();

        await sendEmail(
            user.email,
            "Hospital Invoice Generated",
            `Your hospital bill of ₹${totalAmount} has been generated.`
        );

        res.status(201).json({
            success: true,
            message: "Invoice Created",
            data: invoice
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


export const getMyInvoices = async (req, res) => {
    try {
        const { patient } = await ensurePatientProfileForUser(req.user.id);
        const invoices = await Invoice.find({ patientId: patient._id }).populate("appointmentId");
        res.status(200).json({ success: true, data: invoices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate({ path: "patientId", populate: { path: "userId", select: "name email patientId" } })
            .populate("patientUserId", "name email patientId")
            .populate("appointmentId");
        res.status(200).json({ success: true, data: invoices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPatientInvoice = async (req, res) => {
    try {
        const { patient } = await resolvePatientContext(req.params.patientId);
        const invoices = await Invoice.find({
            patientId: patient._id
        }).populate("appointmentId");

        res.status(200).json({
            success: true,
            data: invoices
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const payInvoice = async (req, res) => {
    try {
        const paidAt = new Date();
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, {
            paymentStatus: "paid",
            paymentMethod: req.body.paymentMethod,
            paidAt
        },
            { new: true }
        );

        if (invoice?.labOrderId) {
            const labOrder = await LabOrder.findById(invoice.labOrderId);
            if (labOrder) {
                labOrder.paymentStatus = "paid";
                labOrder.paymentCompletedAt = paidAt;
                labOrder.status = getOrderStatusForPayment({
                    currentStatus: labOrder.status,
                    paymentStatus: "paid",
                });
                labOrder.invoiceId = invoice._id;
                await labOrder.save();
            }
        }

        res.status(200).json({
            success: true,
            message: "Payment Completed.",
            data: invoice
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const initiateConsultationBilling = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, message: "Appointment not found." });
        }

        const existingInvoice = await Invoice.findOne({ appointmentId: appointment._id });
        if (existingInvoice) {
            return res.status(400).json({ success: false, message: "Billing already initiated for this appointment." });
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
        });

        return res.status(201).json({
            success: true,
            message: "Consultation billing initiated successfully.",
            data: invoice,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
