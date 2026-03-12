import jwt from "jsonwebtoken";


// ----- 1. Verify Access Token -----
export const verifyAccessToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token missing or invalid format." });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token not found in authorization header." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired. Please login again." });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid Token. Authentication failed." });
    }

    return res.status(401).json({ message: "Authentication failed." });
  }
};


// ----- 2 . Authorize Role -----
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // SuperAdmin has universal access
    if (req.user && req.user.role === "superadmin") {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access Forbidden." });
    }
    next();
  };
};
