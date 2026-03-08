import User from "../models/User.js";

export const requireSuperAdmin = async (req, res, next) => {
  try {
    const superEmail = process.env.SUPER_ADMIN_EMAIL;
    if (!superEmail) {
      return res.status(500).json({ message: "SUPER_ADMIN_EMAIL not configured." });
    }

    const user = await User.findById(req.user?.id).select("email role");
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (user.role !== "admin" || user.email !== superEmail) {
      return res.status(403).json({ message: "Super admin access required." });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

