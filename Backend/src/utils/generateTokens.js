import jwt from "jsonwebtoken";
import { normalizeSystemRole } from "../constants/roles.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: normalizeSystemRole(user.role),
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" },
  );
};
