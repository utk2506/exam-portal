import path from "node:path";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

import { env } from "./env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { adminAuthRouter } from "./modules/admin-auth/router.js";
import { adminExamsRouter } from "./modules/admin-exams/router.js";
import { analyticsRouter } from "./modules/analytics/router.js";
import { candidateSessionsRouter } from "./modules/candidate-sessions/router.js";
import { monitoringRouter } from "./modules/monitoring/router.js";
import { responsesRouter } from "./modules/responses/router.js";
import { resultsRouter } from "./modules/results/router.js";
import { uploadsRouter } from "./modules/uploads/router.js";
import { violationsRouter } from "./modules/violations/router.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  app.use("/uploads", express.static(path.resolve(env.UPLOADS_DIR)));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/auth", adminAuthRouter);
  app.use("/api/admin/exams", adminExamsRouter);
  app.use("/api/admin/analytics", analyticsRouter);
  app.use("/api/admin/monitoring", monitoringRouter);
  app.use("/api/admin/results", resultsRouter);
  app.use("/api/admin/uploads", uploadsRouter);
  app.use("/api/candidate-sessions", candidateSessionsRouter);
  app.use("/api/responses", responsesRouter);
  app.use("/api/violations", violationsRouter);

  app.use(errorHandler);

  return app;
}
