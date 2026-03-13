import app from "./app.js";
import connectDB from "./config/database.js";
import { ensureSuperAdmin } from "./utils/ensureSuperAdmin.js";
import { migrateLegacyRoles } from "./utils/migrateLegacyRoles.js";

const PORT = process.env.PORT || 3500;

app.listen(PORT, () => {
  console.log(`Server successfully listening on port ${PORT}`);
});

const bootstrap = async () => {
  try {
    await connectDB();
    try {
      await ensureSuperAdmin();
      await migrateLegacyRoles();
    } catch (e) {
      console.error("Startup role setup failed:", e?.message || e);
    }
  } catch (e) {
    console.error("Database bootstrap failed:", e?.message || e);
  }
};

bootstrap();
