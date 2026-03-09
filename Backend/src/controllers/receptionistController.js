import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const createReceptionistStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);
    // Hardcode the role explicitly to receptionist to permanently prevent privilege escalation hacks
    const user = await User.create({ name, email, password: hashed, role: "receptionist" });

    return res.status(201).json({
      message: "Receptionist created successfully.",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
