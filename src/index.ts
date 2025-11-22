// src/index.ts
import dotenv from "dotenv";
import { Application } from "./config/app.config";
import { connectDB, disconnectDB } from "./db/connection";

dotenv.config();

const app = Application;
const port = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB(); // Wait for DB first

    const server = app.listen(port, () => {
      console.log(`🚀 Server started on port ${port}`);
    });

    // Graceful shutdown when process stops
    const shutdown = async () => {
      console.log("\n⚠️ Shutting down server...");
      await disconnectDB();
      server.close(() => {
        console.log("🟢 Server closed.");
        process.exit(0);
      });
    };

    // Handle Node exit events
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("SIGQUIT", shutdown);
  } catch (error) {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
  }
})();
