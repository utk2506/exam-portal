import { Router } from "express";
import jwt from "jsonwebtoken";
import {
  candidateRegistrationSchema,
  heartbeatSchema
} from "@exam-platform/shared";

import { env } from "../../env.js";
import { requireCandidateSession } from "../../middleware/require-candidate-session.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/http.js";
import { finalizeSessionSubmission, getResultSummary } from "../results/service.js";
import {
  getCandidateRegistrationPayload,
  getCandidateRuntime,
  heartbeatCandidateSession,
  registerOrResumeCandidate,
  startCandidateSession
} from "./service.js";

function getIpAddress(request: {
  headers: Record<string, unknown>;
  ip?: string;
}) {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }

  return request.ip ?? "unknown";
}

export const candidateSessionsRouter = Router();

candidateSessionsRouter.post(
  "/register",
  validateBody(candidateRegistrationSchema),
  asyncHandler(async (request, response) => {
    const registration = await registerOrResumeCandidate({
      ...request.body,
      ipAddress: getIpAddress(request)
    });

    response.cookie(
      "candidate_session",
      jwt.sign(
        {
          sessionId: registration.session.id,
          candidateId: registration.session.candidateId
        },
        env.JWT_SECRET,
        { expiresIn: "12h" }
      ),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: false
      }
    );

    response.status(201).json({
      session: registration.session,
      exam: registration.exam,
      requiresResume: registration.requiresResume
    });
  })
);

candidateSessionsRouter.get(
  "/:sessionId",
  requireCandidateSession,
  asyncHandler(async (request, response) => {
    const payload = await getCandidateRegistrationPayload(String(request.params.sessionId));
    response.json(payload);
  })
);

candidateSessionsRouter.post(
  "/:sessionId/start",
  requireCandidateSession,
  asyncHandler(async (request, response) => {
    const session = await startCandidateSession(String(request.params.sessionId));
    response.json({ session });
  })
);

candidateSessionsRouter.post(
  "/:sessionId/submit",
  requireCandidateSession,
  asyncHandler(async (request, response) => {
    const result = await finalizeSessionSubmission(String(request.params.sessionId), "submitted");
    response.json({ result });
  })
);

candidateSessionsRouter.get(
  "/:sessionId/runtime",
  requireCandidateSession,
  asyncHandler(async (request, response) => {
    const runtime = await getCandidateRuntime(String(request.params.sessionId));
    response.json(runtime);
  })
);

candidateSessionsRouter.post(
  "/:sessionId/heartbeat",
  requireCandidateSession,
  validateBody(heartbeatSchema),
  asyncHandler(async (request, response) => {
    const session = await heartbeatCandidateSession({
      sessionId: String(request.params.sessionId),
      currentQuestionId: request.body.currentQuestionId,
      ipAddress: getIpAddress(request)
    });

    response.json({ session });
  })
);

candidateSessionsRouter.get(
  "/:sessionId/result",
  requireCandidateSession,
  asyncHandler(async (request, response) => {
    const result = await getResultSummary(String(request.params.sessionId));
    response.json({ result });
  })
);
