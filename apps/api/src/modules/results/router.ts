import { Router } from "express";
import { stringify } from "csv-stringify/sync";
import { subjectiveScoreSchema } from "@exam-platform/shared";

import { requireAdmin, type AdminRequest } from "../../middleware/require-admin.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/http.js";
import { toPendingSubjectiveReviewDto, toResultSummaryDto } from "../../utils/mappers.js";
import {
  getResultsExportFilename,
  gradeSubjectiveAnswer,
  listPendingSubjectiveReviews,
  listResultsExportRows,
  syncResultForSession
} from "./service.js";

export const resultsRouter = Router();

resultsRouter.use(requireAdmin);

resultsRouter.get(
  "/pending-subjective",
  asyncHandler(async (_request, response) => {
    const pending = await listPendingSubjectiveReviews();
    response.json({ pending: pending.map(toPendingSubjectiveReviewDto) });
  })
);

resultsRouter.put(
  "/sessions/:sessionId/questions/:questionId",
  validateBody(subjectiveScoreSchema),
  asyncHandler(async (request, response) => {
    const adminRequest = request as AdminRequest;
    const result = await gradeSubjectiveAnswer({
      sessionId: String(request.params.sessionId),
      questionId: String(request.params.questionId),
      evaluatorAdminId: adminRequest.admin!.adminId,
      awardedMarks: request.body.awardedMarks,
      remarks: request.body.remarks ?? null
    });

    response.json({ result: toResultSummaryDto(result) });
  })
);

resultsRouter.get(
  "/sessions/:sessionId",
  asyncHandler(async (request, response) => {
    const result = await syncResultForSession(String(request.params.sessionId));
    response.json({ result: toResultSummaryDto(result) });
  })
);

resultsRouter.get(
  "/export",
  asyncHandler(async (request, response) => {
    const examId = typeof request.query.examId === "string" ? request.query.examId : undefined;
    const rows = await listResultsExportRows(examId);
    const filename = await getResultsExportFilename(examId);

    const csv = stringify(
      rows.map((session) => ({
        candidateId: session.candidateId,
        candidateName: session.name,
        email: session.email,
        phone: session.phone,
        examTitle: session.exam.title,
        status: session.status,
        mcqScore: session.result?.mcqScore ?? 0,
        subjectiveScore: session.result?.subjectiveScore ?? 0,
        totalScore: session.result?.totalScore ?? 0,
        finalizedAt: session.result?.finalizedAt?.toISOString() ?? ""
      })),
      {
        header: true
      }
    );

    response.setHeader("Content-Type", "text/csv");
    response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    response.send(csv);
  })
);
