import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import Bed from "../models/Bed.js";

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