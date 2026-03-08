import app from "./app.js";
import connectDB from "./config/database.js";
import { ensureSuperAdmin } from "./utils/ensureSuperAdmin.js";

const PORT = process.env.PORT || 3500;

// connect database
connectDB().then(async () => {
  try {
    await ensureSuperAdmin();
  } catch (e) {
    console.error("Super admin seed failed:", e?.message || e);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
