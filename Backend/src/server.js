import http from "http";
import app from "./app.js";
import connectDB from "./config/database.js";
import { ensureSuperAdmin } from "./utils/ensureSuperAdmin.js";
import { migrateLegacyRoles } from "./utils/migrateLegacyRoles.js";
import { initSocket } from "./services/socketService.js";
import { startNoShowScheduler } from "./services/noShowScheduler.js";
import { startConsultationAutoCompleteScheduler } from "./services/consultationAutoCompleteScheduler.js";
import keepAlive from "./utils/keepAlive.js";

const PORT = process.env.PORT || 3500;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server successfully listening on port ${PORT}`);
});

const bootstrap = async () => {
  try {
    await connectDB();
    try {
      await ensureSuperAdmin();
      await migrateLegacyRoles();
      startNoShowScheduler();
      startConsultationAutoCompleteScheduler();
      keepAlive(process.env.BACKEND_URL);
    } catch (e) {
      console.error("Startup role setup failed:", e?.message || e);
    }
  } catch (e) {
    console.error("Database bootstrap failed:", e?.message || e);
  }
};

bootstrap();
