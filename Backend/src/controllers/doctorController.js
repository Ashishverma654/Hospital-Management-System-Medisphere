import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Department from "../models/Department.js";
import bcrypt from "bcryptjs";

export const createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      departmentId,
      specialization,
      qualification,
      experience,
      consultationFee,
      about,
    } = req.body;

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const department = await Department.findById(departmentId);

    if (!department) {
      return res.status(400).json({
        message: "Invalid department",
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "doctor",
    });

    const doctor = await Doctor.create({
      userId: user._id,
      departmentId,
      specialization,
      qualification,
      experience,
      consultationFee,
      about,
    });

    res.status(201).json({
      message: "Doctor created Successfully.",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("userId", "name email")
      .populate("departmentId", "name");

    console.log("Doctors : ", doctors);

    res.status(200).json(doctors);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    let doctor = await Doctor.findById(id)
      .populate("userId", "name email phone profileImage ")
      .populate("departmentId", "name description");

    if (!doctor) {
      doctor = await Doctor.findOne({ userId: id })
        .populate("userId", "name email phone profileImage ")
        .populate("departmentId", "name description");
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
