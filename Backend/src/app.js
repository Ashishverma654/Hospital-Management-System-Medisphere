import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());


app.get("/", (req, res) => {
    res.send("Hospital Management API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/department", departmentRoutes);

export default app;
