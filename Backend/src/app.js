import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import dynamicDataRoutes from "./routes/dynamicDataRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import specializationRoutes from "./routes/specializationRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import awardRoutes from "./routes/awardRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import labReportRoutes from "./routes/labReportRoutes.js";
import labOrderRoutes from "./routes/labOrderRoutes.js";
import labRecommendationRoutes from "./routes/labRecommendationRoutes.js";
import labTestRoutes from "./routes/labTestRoutes.js";
import testPriceRoutes from "./routes/testPriceRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js";
import pharmacyOrderRoutes from "./routes/pharmacyOrderRoutes.js";
import bedRoutes from "./routes/bedRoutes.js";
import wardRoutes from "./routes/wardRoutes.js";
import admissionRoutes from "./routes/admissionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import receptionistRoutes from "./routes/receptionistRoutes.js";
import nurseRoutes from "./routes/nurseRoutes.js";
import nurseAssignmentRoutes from "./routes/nurseAssignmentRoutes.js";
import shiftRoutes from "./routes/shiftRoutes.js";
import shiftScheduleRoutes from "./routes/shiftScheduleRoutes.js";
import labTechRoutes from "./routes/labTechRoutes.js";
import pharmacistRoutes from "./routes/pharmacistRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import staffDutyRoutes from "./routes/staffDutyRoutes.js";
import staffAvailabilityRoutes from "./routes/staffAvailabilityRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import limiter from "./middlewares/rateLimiter.js";

const app = express();
const isDev = process.env.NODE_ENV !== "production";

const normalizeOrigin = (origin = '') => origin.replace(/\/+$/, '');
const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((item) => normalizeOrigin(item.trim()))
  .filter(Boolean);

const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.PUBLIC_APP_URL,
  'https://hospital-management-system-beryl-two.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  ...extraOrigins,
]
  .filter(Boolean)
  .map(normalizeOrigin);

const isAllowedLocalOrigin = (origin = '') =>
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const isAllowedDomainOrigin = (origin = '') => {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith('.medisphere.tech')) return true;
    if (url.hostname === 'medisphere.tech') return true;
    if (url.hostname.endsWith('.vercel.app')) return true;
  } catch {
    return false;
  }
  return false;
};

app.use(express.json());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload.",
    });
  }
  return next(err);
});
app.use(
  cors({
    origin(origin, callback) {
      if (isDev) {
        return callback(null, true);
      }

      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);
      if (
        configuredOrigins.includes(normalizedOrigin) ||
        isAllowedLocalOrigin(normalizedOrigin) ||
        isAllowedDomainOrigin(normalizedOrigin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(limiter);

app.get("/", (req, res) => {
  res.send("Hospital Management API Running");
});

app.get("/api/health", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  res.status(isConnected ? 200 : 503).json({
    success: isConnected,
    message: isConnected ? "API and database are ready." : "API is running, but the database is still connecting.",
    database: {
      readyState: mongoose.connection.readyState,
      connected: isConnected,
    },
  });
});

app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: "The server is starting up and the database is not ready yet. Please try again in a moment.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/dynamic", dynamicDataRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/awards", awardRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/lab-reports", labReportRoutes);
app.use("/api/lab-orders", labOrderRoutes);
app.use("/api/lab-recommendations", labRecommendationRoutes);
app.use("/api/tests", labTestRoutes);
app.use("/api/test-prices", testPriceRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/medicines", pharmacyRoutes);
app.use("/api/pharmacy-orders", pharmacyOrderRoutes);
app.use("/api/wards", wardRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/receptionists", receptionistRoutes);
app.use("/api/nurses", nurseRoutes);
app.use("/api/nurse-assignments", nurseAssignmentRoutes);
// Shift schedules (calendar allocations)
app.use("/api/shift-schedules", shiftScheduleRoutes);
// Shift templates (morning/evening/night definitions)
app.use("/api/shifts", shiftRoutes);
app.use("/api/lab-techs", labTechRoutes);
app.use("/api/pharmacists", pharmacistRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/staff-duty", staffDutyRoutes);
app.use("/api/staff-availability", staffAvailabilityRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use(errorHandler);

export default app;
