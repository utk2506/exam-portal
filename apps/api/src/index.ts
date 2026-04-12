import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import { createApp } from "./app.js";
import { env } from "./env.js";
import { createRealtimeServer } from "./lib/realtime.js";
import { expireOverdueSessions } from "./modules/results/service.js";

const app = createApp();
const server = http.createServer(app);

createRealtimeServer(server);

fs.mkdirSync(path.resolve(env.UPLOADS_DIR), { recursive: true });

server.listen(env.API_PORT, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${env.API_PORT}`);
});

setInterval(() => {
  void expireOverdueSessions();
}, 15_000);
