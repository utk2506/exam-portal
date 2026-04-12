import { Router } from "express";

import { requireAdmin } from "../../middleware/require-admin.js";
import { asyncHandler } from "../../utils/http.js";
import { getAnalyticsOverview, getExamAnalytics } from "./service.js";

export const analyticsRouter = Router();

analyticsRouter.use(requireAdmin);

analyticsRouter.get(
  "/overview",
  asyncHandler(async (_request, response) => {
    const overview = await getAnalyticsOverview();
    response.json({ overview });
  })
);

analyticsRouter.get(
  "/exams/:examId",
  asyncHandler(async (request, response) => {
    const analytics = await getExamAnalytics(String(request.params.examId));
    response.json({ analytics });
  })
);
