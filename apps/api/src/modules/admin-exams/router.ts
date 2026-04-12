import { Router } from "express";
import multer from "multer";
import { examCreateSchema, examUpdateSchema, questionCreateSchema } from "@exam-platform/shared";

import { requireAdmin } from "../../middleware/require-admin.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError, asyncHandler } from "../../utils/http.js";
import { toExamDetailDto, toExamSummaryDto } from "../../utils/mappers.js";
import {
  addQuestion,
  createExam,
  deleteExam,
  deleteQuestion,
  getExam,
  importQuestions,
  listExams,
  startExam,
  stopExam,
  updateExam,
  updateQuestion
} from "./service.js";

const upload = multer({ storage: multer.memoryStorage() });

export const adminExamsRouter = Router();

adminExamsRouter.use(requireAdmin);

adminExamsRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const exams = await listExams();
    response.json({ exams: exams.map(toExamSummaryDto) });
  })
);

adminExamsRouter.post(
  "/",
  validateBody(examCreateSchema),
  asyncHandler(async (request, response) => {
    const exam = await createExam(request.body);
    response.status(201).json({ exam: toExamSummaryDto(exam) });
  })
);

adminExamsRouter.get(
  "/:examId",
  asyncHandler(async (request, response) => {
    const exam = await getExam(String(request.params.examId));
    response.json({ exam: toExamDetailDto(exam) });
  })
);

adminExamsRouter.put(
  "/:examId",
  validateBody(examUpdateSchema),
  asyncHandler(async (request, response) => {
    const exam = await updateExam(String(request.params.examId), request.body);
    response.json({ exam: toExamSummaryDto(exam) });
  })
);

adminExamsRouter.post(
  "/:examId/start",
  asyncHandler(async (request, response) => {
    const exam = await startExam(String(request.params.examId));
    response.json({ exam: toExamSummaryDto({ ...exam, questions: [] }) });
  })
);

adminExamsRouter.post(
  "/:examId/stop",
  asyncHandler(async (request, response) => {
    const exam = await stopExam(String(request.params.examId));
    response.json({ exam: toExamSummaryDto({ ...exam, questions: [] }) });
  })
);

adminExamsRouter.delete(
  "/:examId",
  asyncHandler(async (request, response) => {
    await deleteExam(String(request.params.examId));
    response.status(204).send();
  })
);

adminExamsRouter.post(
  "/:examId/questions",
  validateBody(questionCreateSchema),
  asyncHandler(async (request, response) => {
    const question = await addQuestion(String(request.params.examId), request.body);
    response.status(201).json({ question });
  })
);

adminExamsRouter.put(
  "/questions/:questionId",
  validateBody(questionCreateSchema),
  asyncHandler(async (request, response) => {
    const question = await updateQuestion(String(request.params.questionId), request.body);
    response.json({ question });
  })
);

adminExamsRouter.delete(
  "/questions/:questionId",
  asyncHandler(async (request, response) => {
    await deleteQuestion(String(request.params.questionId));
    response.status(204).send();
  })
);

adminExamsRouter.post(
  "/:examId/questions/import",
  upload.fields([
    { name: "sheet", maxCount: 1 },
    { name: "assets", maxCount: 1 }
  ]),
  asyncHandler(async (request, response) => {
    const files = request.files as Record<string, Express.Multer.File[]> | undefined;
    const workbookFile = files?.sheet?.[0];
    const assetsArchiveFile = files?.assets?.[0];

    if (!workbookFile) {
      throw new AppError("A sheet file is required", 422);
    }

    const importedCount = await importQuestions({
      examId: String(request.params.examId),
      workbookFile,
      assetsArchiveFile
    });

    response.status(201).json({ importedCount });
  })
);
