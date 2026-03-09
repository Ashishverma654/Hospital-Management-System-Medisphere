import User from "../models/User.js";

export const requireSuperReceptionist = async (req, res, next) => {
  try {
    const superEmail = process.env.SUPER_RECEPTIONIST_EMAIL;
    if (!superEmail) {
      return res.status(500).json({ message: "SUPER_RECEPTIONIST_EMAIL not configured." });
    }

    const user = await User.findById(req.user?.id).select("email role");
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (user.role !== "receptionist" || user.email !== superEmail) {
      return res.status(403).json({ message: "Super receptionist access required to create other receptionists." });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
