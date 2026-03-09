import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import labReportRoutes from "./routes/labReportRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js";
import bedRoutes from "./routes/bedRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import receptionistRoutes from "./routes/receptionistRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import limiter from "./middlewares/rateLimiter.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(limiter);

app.get("/", (req, res) => {
  res.send("Hospital Management API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/lab-reports", labReportRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/medicines", pharmacyRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/users", userRoutes);
app.use("/api/receptionists", receptionistRoutes);
app.use(errorHandler);

export default app;
