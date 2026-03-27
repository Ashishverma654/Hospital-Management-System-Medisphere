import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import jwt from "jsonwebtoken";

const isDev = process.env.NODE_ENV !== "production";

const resolveUserId = (req) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded?.id || null;
    } catch {
        return null;
    }
};

const limiter = rateLimit({
    windowMs: 15 * 60 * 2000, // 15 minutes
    max: (req) => {
        const userId = resolveUserId(req);
        if (userId) {
            return isDev ? 2000 : 1000;
        }
        return isDev ? 1000 : 100;
    },
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const userId = resolveUserId(req);
        return userId ? `user:${userId}` : ipKeyGenerator(req);
    },
    skip: (req) => isDev && ["127.0.0.1", "::1"].includes(req.ip),
});

export default limiter;
