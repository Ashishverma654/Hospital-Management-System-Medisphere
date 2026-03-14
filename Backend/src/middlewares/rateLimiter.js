import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 1000 : 100,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDev && ["127.0.0.1", "::1"].includes(req.ip),
});

export default limiter;
