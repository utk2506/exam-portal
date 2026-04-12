import { Router } from "express";
import { violationCreateSchema } from "@exam-platform/shared";

import { env, isAiProctoringEnabled } from "../../env.js";
import { requireCandidateSession } from "../../middleware/require-candidate-session.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/http.js";
import { toViolationDto } from "../../utils/mappers.js";
import { createViolation } from "./service.js";

export const violationsRouter = Router();

violationsRouter.post(
  "/",
  requireCandidateSession,
  validateBody(violationCreateSchema),
  asyncHandler(async (request, response) => {
    const violation = await createViolation({
      sessionId: request.body.sessionId,
      type: request.body.type,
      severity: request.body.severity,
      metadata: request.body.metadata
    });

    response.status(201).json({ violation: toViolationDto(violation) });
  })
);

violationsRouter.post(
  "/ai",
  asyncHandler(async (request, response) => {
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token || token !== env.PROCTOR_API_TOKEN) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const violation = await createViolation({
      sessionId: request.body.sessionId,
      type: request.body.type,
      severity: request.body.severity,
      metadata: request.body.metadata
    });

    response.status(201).json({ violation: toViolationDto(violation) });
  })
);

violationsRouter.post(
  "/proctor-frame",
  requireCandidateSession,
  asyncHandler(async (request, response) => {
    const { sessionId, imageBase64 } = request.body as {
      sessionId: string;
      imageBase64: string;
    };

    if (!isAiProctoringEnabled) {
      response.json({ skipped: true });
      return;
    }

    try {
      const proctorResponse = await fetch(`${env.PROCTOR_SERVICE_URL}/analyze-frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          image_base64: imageBase64,
          posted_at: new Date().toISOString(),
          metadata: {}
        })
      });

      if (!proctorResponse.ok) {
        response.json({ skipped: true });
        return;
      }

      const proctorResult = (await proctorResponse.json()) as {
        violations: Array<{ type: string; severity: string }>;
      };

      const created: string[] = [];
      for (const v of proctorResult.violations ?? []) {
        const sev = (["info", "warning", "critical"].includes(v.severity)
          ? v.severity
          : "warning") as "info" | "warning" | "critical";
        const violation = await createViolation({
          sessionId,
          type: v.type,
          severity: sev,
          metadata: { source: "ai_proctor" }
        });
        created.push(violation.id);
      }

      response.json({ created });
    } catch {
      response.json({ skipped: true });
    }
  })
);
