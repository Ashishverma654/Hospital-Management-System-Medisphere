import app from "./app.js";
import connectDB from "./config/database.js";
import { ensureSuperAdmin } from "./utils/ensureSuperAdmin.js";
import { migrateLegacyRoles } from "./utils/migrateLegacyRoles.js";

const PORT = process.env.PORT || 3500;

// connect database
connectDB().then(async () => {
  console.log("DB Connected, starting seed checks...");
  try {
    await ensureSuperAdmin();
    console.log("Super Admin check done.");
    await migrateLegacyRoles();
    console.log("Legacy role migration check done.");
  } catch (e) {
    console.error("Startup role setup failed:", e?.message || e);
  }

  console.log(`Starting server on port ${PORT}...`);
  app.listen(PORT, () => {
    console.log(`Server successfully listening on port ${PORT}`);
  });
});
