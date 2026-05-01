import "dotenv/config";
import { createServer } from "http";

const { app } = require("./app");

const httpServer = createServer(app);
const port = Number(process.env.PORT || 5000);

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`API running on port ${port} 🚀`);
});
