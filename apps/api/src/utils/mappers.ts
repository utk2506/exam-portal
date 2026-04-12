import type {
  AdminQuestionDto,
  AnalyticsOverviewDto,
  CandidateResponseDto,
  CandidateRuntimeDto,
  CandidateRuntimeQuestion,
  CandidateSessionDto,
  ExamDetailDto,
  ExamSummaryDto,
  MonitoringCandidateRow,
  OptionOrderMap,
  PendingSubjectiveReviewDto,
  QuestionDto,
  ResultSummaryDto,
  ViolationDto
} from "@exam-platform/shared";
import type {
  CandidateSession,
  Exam,
  Question,
  Response,
  Result,
  Violation
} from "@prisma/client";

export function toExamSummaryDto(exam: Exam & { questions?: Question[] }): ExamSummaryDto {
  return {
    id: exam.id,
    title: exam.title,
    examCode: exam.examCode,
    instructionsHtml: exam.instructionsHtml,
    status: exam.status,
    totalMarks: exam.totalMarks,
    questionCount: exam.questions?.length ?? 0,
    resultsPublished: exam.resultsPublished,
    createdAt: exam.createdAt.toISOString(),
    updatedAt: exam.updatedAt.toISOString()
  };
}

export function toQuestionDto(question: Question): QuestionDto {
  return {
    id: question.id,
    examId: question.examId,
    type: question.type,
    promptHtml: question.promptHtml,
    optionAHtml: question.optionAHtml,
    optionBHtml: question.optionBHtml,
    optionCHtml: question.optionCHtml,
    optionDHtml: question.optionDHtml,
    marks: question.marks,
    sortOrder: question.sortOrder,
    assetUrl: question.assetUrl
  };
}

export function toAdminQuestionDto(question: Question): AdminQuestionDto {
  return {
    ...toQuestionDto(question),
    correctOption: question.correctOption
  };
}

export function toExamDetailDto(exam: Exam & { questions: Question[] }): ExamDetailDto {
  return {
    ...toExamSummaryDto(exam),
    questions: exam.questions.map(toAdminQuestionDto)
  };
}

export function toCandidateSessionDto(session: CandidateSession): CandidateSessionDto {
  return {
    id: session.id,
    candidateId: session.candidateId,
    examId: session.examId,
    name: session.name,
    email: session.email,
    phone: session.phone,
    ipAddress: session.ipAddress,
    status: session.status,
    registeredAt: session.registeredAt.toISOString(),
    startedAt: session.startedAt?.toISOString() ?? null,
    endsAt: session.endsAt?.toISOString() ?? null,
    submittedAt: session.submittedAt?.toISOString() ?? null,
    warningCount: session.warningCount,
    lastHeartbeatAt: session.lastHeartbeatAt?.toISOString() ?? null
  };
}

export function toCandidateResponseDto(response: Response): CandidateResponseDto {
  return {
    questionId: response.questionId,
    selectedOption: response.selectedOption,
    subjectiveAnswerHtml: response.subjectiveAnswerHtml,
    savedAt: response.savedAt.toISOString(),
    finalSubmitted: response.finalSubmitted
  };
}

export function toCandidateRuntimeDto({
  session,
  exam,
  questions,
  responses
}: {
  session: CandidateSession;
  exam: Exam & { questions: Question[] };
  questions: CandidateRuntimeQuestion[];
  responses: Response[];
}): CandidateRuntimeDto {
  const timeRemainingSeconds = session.endsAt
    ? Math.max(0, Math.floor((session.endsAt.getTime() - Date.now()) / 1000))
    : 60 * 60;

  return {
    session: toCandidateSessionDto(session),
    exam: toExamSummaryDto(exam),
    questions,
    responses: responses.map(toCandidateResponseDto),
    timeRemainingSeconds
  };
}

export function toViolationDto(violation: Violation): ViolationDto {
  return {
    id: violation.id,
    sessionId: violation.sessionId,
    type: violation.type,
    severity: violation.severity,
    metadata: (violation.metadata as Record<string, unknown>) ?? {},
    detectedAt: violation.detectedAt.toISOString()
  };
}

export function toMonitoringCandidateRow({
  session,
  examTitle,
  activeViolations,
  latestViolation
}: {
  session: CandidateSession;
  examTitle: string;
  activeViolations: number;
  latestViolation: Violation | null;
}): MonitoringCandidateRow {
  return {
    session: toCandidateSessionDto(session),
    examTitle,
    activeViolations,
    latestViolation: latestViolation ? toViolationDto(latestViolation) : null
  };
}

export function toResultSummaryDto(result: Result): ResultSummaryDto {
  return {
    id: result.id,
    sessionId: result.sessionId,
    mcqScore: result.mcqScore,
    subjectiveScore: result.subjectiveScore,
    totalScore: result.totalScore,
    finalizedAt: result.finalizedAt?.toISOString() ?? null
  };
}

export function toPendingSubjectiveReviewDto(payload: {
  session: CandidateSession;
  pendingResponses: Array<Response & { question: Question }>;
}): PendingSubjectiveReviewDto {
  return {
    session: {
      id: payload.session.id,
      candidateId: payload.session.candidateId,
      name: payload.session.name
    },
    pendingResponses: payload.pendingResponses.map((response) => ({
      questionId: response.questionId,
      subjectiveAnswerHtml: response.subjectiveAnswerHtml,
      question: {
        promptHtml: response.question.promptHtml,
        marks: response.question.marks
      }
    }))
  };
}

export function toCandidateRuntimeQuestion(question: Question, optionOrderMap?: OptionOrderMap) {
  return {
    ...toQuestionDto(question),
    optionOrder: optionOrderMap ?? null
  };
}

export function toAnalyticsOverviewDto(payload: AnalyticsOverviewDto) {
  return payload;
}
