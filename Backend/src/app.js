import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hospital Management API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/availability", availabilityRoutes);

export default app;
