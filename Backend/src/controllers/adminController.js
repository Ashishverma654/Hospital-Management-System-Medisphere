import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import Bed from "../models/Bed.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const getDashboardStats = async (req, res) => {
  try {

    const today = new Date().toISOString().split("T")[0];

    const totalDoctors = await Doctor.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    const todayAppointments = await Appointment.countDocuments({
      date: today
    });

    const completedAppointments = await Appointment.countDocuments({
      status: "completed"
    });

    const cancelledAppointments = await Appointment.countDocuments({
      status: "cancelled"
    });

    const revenueData = await Invoice.aggregate([
      {
        $match: { paymentStatus: "paid" }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    const occupiedBeds = await Bed.countDocuments({
      status: "occupied"
    });

    const availableBeds = await Bed.countDocuments({
      status: "available"
    });

    res.json({
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      completedAppointments,
      cancelledAppointments,
      totalRevenue,
      occupiedBeds,
      availableBeds
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const createStaffUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password, role are required." });
    }

    if (!["superadmin", "admin", "superreceptionist", "receptionist"].includes(role)) {
      return res.status(400).json({ message: "role must be superadmin, admin, superreceptionist, or receptionist. Use /api/doctors to create doctors." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });

    return res.status(201).json({
      message: `${role} created successfully.`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};