import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";

// Always load the backend-local .env, even if the process CWD differs.
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { app } = require("./app");

const httpServer = createServer(app);
const port = Number(process.env.PORT || 5000);

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`API running on port ${port} 🚀`);
});
