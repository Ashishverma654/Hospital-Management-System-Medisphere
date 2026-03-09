import Invoice from "../models/Invoice.js";
import Patient from "../models/Patient.js";
import { sendEmail } from "../utils/sendEmail.js";

export const createInvoice = async (req, res) => {
    try {
        const { patientId, appointmentId, doctorFee, labCharges, medicineCharges, otherCharges, daysConsulted, medicinesBreakdown, labReportsBreakdown } = req.body;

        const totalAmount = (doctorFee || 0) + (labCharges || 0) + (medicineCharges || 0) + (otherCharges || 0);

        const invoice = new Invoice({
            patientId,
            appointmentId,
            doctorFee,
            labCharges,
            medicineCharges,
            otherCharges,
            totalAmount,
            daysConsulted,
            medicinesBreakdown,
            labReportsBreakdown
        });

        await invoice.save();

        const patient = await Patient.findById(patientId).populate("userId");

        await sendEmail(
            patient.userId.email,
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
        const invoices = await Invoice.find({ patientId: req.user.id }).populate("appointmentId");
        res.status(200).json({ success: true, data: invoices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().populate("patientId").populate("appointmentId");
        res.status(200).json({ success: true, data: invoices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPatientInvoice = async (req, res) => {
    try {
        const invoices = await Invoice.find({
            patientId: req.params.patientId
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
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, {
            paymentStatus: "paid",
            paymentMethod: req.body.paymentMethod,
            paidAt: new Date()
        },
            { new: true }
        );

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