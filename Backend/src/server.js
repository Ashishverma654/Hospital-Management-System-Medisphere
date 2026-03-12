import app from "./app.js";
import connectDB from "./config/database.js";
import { ensureSuperAdmin } from "./utils/ensureSuperAdmin.js";
import { ensureSuperReceptionist } from "./utils/ensureSuperReceptionist.js";

const PORT = process.env.PORT || 3500;

// connect database
connectDB().then(async () => {
  console.log("DB Connected, starting seed checks...");
  try {
    await ensureSuperAdmin();
    console.log("Super Admin check done.");
    await ensureSuperReceptionist();
    console.log("Super Receptionist check done.");
  } catch (e) {
    console.error("Super admin/super receptionist seed failed:", e?.message || e);
  }

  console.log(`Starting server on port ${PORT}...`);
  app.listen(PORT, () => {
    console.log(`Server successfully listening on port ${PORT}`);
  });
});
