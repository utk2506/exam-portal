import { Router } from "express";

import { requireAdmin } from "../../middleware/require-admin.js";
import { asyncHandler } from "../../utils/http.js";
import { deleteCandidateSession, listMonitoringSessions, listRecentViolations } from "./service.js";

export const monitoringRouter = Router();

monitoringRouter.use(requireAdmin);

monitoringRouter.get(
  "/sessions",
  asyncHandler(async (_request, response) => {
    const sessions = await listMonitoringSessions();
    response.json({ sessions });
  })
);

monitoringRouter.get(
  "/violations",
  asyncHandler(async (_request, response) => {
    const violations = await listRecentViolations();
    response.json({ violations });
  })
);

monitoringRouter.delete(
  "/sessions/:sessionId",
  asyncHandler(async (request, response) => {
    await deleteCandidateSession(String(request.params.sessionId));
    response.status(204).send();
  })
);
