import { Router } from "express";
import { saveResponseSchema } from "@exam-platform/shared";

import { requireCandidateSession } from "../../middleware/require-candidate-session.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/http.js";
import { toCandidateResponseDto } from "../../utils/mappers.js";
import { saveCandidateResponse } from "./service.js";

export const responsesRouter = Router();

responsesRouter.put(
  "/:sessionId",
  requireCandidateSession,
  validateBody(saveResponseSchema),
  asyncHandler(async (request, response) => {
    const savedResponse = await saveCandidateResponse({
      sessionId: String(request.params.sessionId),
      questionId: request.body.questionId,
      selectedOption: request.body.selectedOption ?? null,
      subjectiveAnswerHtml: request.body.subjectiveAnswerHtml ?? null
    });

    response.json({ response: toCandidateResponseDto(savedResponse) });
  })
);
