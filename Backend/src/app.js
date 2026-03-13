import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import dynamicDataRoutes from "./routes/dynamicDataRoutes.js";
import testRoutes from "./routes/testRoutes.js";
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
import billingRoutes from "./routes/billingRoutes.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js";
import bedRoutes from "./routes/bedRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import receptionistRoutes from "./routes/receptionistRoutes.js";
import nurseRoutes from "./routes/nurseRoutes.js";
import labTechRoutes from "./routes/labTechRoutes.js";
import pharmacistRoutes from "./routes/pharmacistRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import limiter from "./middlewares/rateLimiter.js";

const app = express();

app.use(express.json());
app.use(cors({
  origin: [
    'https://hospital-management-system-beryl-two.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(limiter);

app.get("/", (req, res) => {
  res.send("Hospital Management API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/dynamic", dynamicDataRoutes);
app.use("/api/test", testRoutes);
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
app.use("/api/billing", billingRoutes);
app.use("/api/medicines", pharmacyRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/users", userRoutes);
app.use("/api/receptionists", receptionistRoutes);
app.use("/api/nurses", nurseRoutes);
app.use("/api/lab-techs", labTechRoutes);
app.use("/api/pharmacists", pharmacistRoutes);
app.use(errorHandler);

export default app;
