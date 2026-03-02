import jwt from "jsonwebtoken";


// ----- 1. Verify Access Token -----
export const verifyAccessToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Access token missing. " });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(500).json({ message: "Invalid or Expired Token." });
  }
};


// ----- 2 . Authorize Role -----
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access Forbidden." });
    }
    next();
  };
};
