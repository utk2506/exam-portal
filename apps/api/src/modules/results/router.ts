import { Router } from "express";
import { stringify } from "csv-stringify/sync";
import XLSX from "xlsx";
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
    const format = typeof request.query.format === "string" ? request.query.format : "csv";
    const rows = await listResultsExportRows(examId);

    if (format === "excel") {
      // Create Excel workbook with multiple sheets
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summaryData = rows.map((session) => ({
        "Candidate ID": session.candidateId,
        "Name": session.name,
        "Email": session.email,
        "Phone": session.phone,
        "Exam": session.exam.title,
        "Status": session.status,
        "MCQ Score": session.result?.mcqScore ?? 0,
        "Subjective Score": session.result?.subjectiveScore ?? 0,
        "Total Score": session.result?.totalScore ?? 0,
        "Total Marks": session.exam.questions.reduce((sum, q) => sum + q.marks, 0),
        "Percentage": session.result ? ((session.result.totalScore / session.exam.questions.reduce((sum, q) => sum + q.marks, 0)) * 100).toFixed(2) + "%" : "0%",
        "Submitted At": session.submittedAt?.toISOString() ?? ""
      }));

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // Sheet 2: Detailed Answers
      const detailData = rows.flatMap((session) =>
        session.exam.questions.map((question) => {
          const response = session.responses.find((r) => r.questionId === question.id);
          const marks = response?.awardedMarks ?? (question.type === "mcq" && response?.selectedOption === question.correctOption ? question.marks : 0);

          return {
            "Candidate ID": session.candidateId,
            "Name": session.name,
            "Question #": question.sortOrder,
            "Type": question.type === "mcq" ? "MCQ" : "Subjective",
            "Marks": question.marks,
            "Correct Answer": question.correctOption ?? "N/A",
            "Candidate Answer":
              question.type === "mcq"
                ? response?.selectedOption ?? "Not Answered"
                : (response?.subjectiveAnswerHtml?.substring(0, 100) ?? "Not Answered"),
            "Awarded Marks": marks,
            "Status": response ? (question.type === "mcq" ? (response.selectedOption === question.correctOption ? "Correct" : "Incorrect") : "Graded") : "Not Attempted",
            "Remarks": response?.reviewRemarks ?? ""
          };
        })
      );

      const detailSheet = XLSX.utils.json_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, detailSheet, "Detailed Answers");

      // Generate filename
      const examCode = rows[0]?.exam?.examCode ?? "export";
      const safeCode = examCode.replace(/[^a-zA-Z0-9-_]+/g, "-").toLowerCase();
      const filename = `results-${safeCode}-${new Date().toISOString().split("T")[0]}.xlsx`;

      // Send Excel file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
      response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      response.send(excelBuffer);
    } else {
      // CSV format (original behavior)
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

      const filename = await getResultsExportFilename(examId);
      response.setHeader("Content-Type", "text/csv");
      response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      response.send(csv);
    }
  })
);
