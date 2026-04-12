export type QuestionType = "mcq" | "subjective";

export type ExamStatus = "draft" | "scheduled" | "live" | "stopped" | "completed";

export type SessionStatus =
  | "registered"
  | "in_progress"
  | "submitted"
  | "expired"
  | "stopped";

export type ViolationSeverity = "info" | "warning" | "critical";

export type McqOptionKey = "A" | "B" | "C" | "D";

export interface OptionOrderMap {
  A: McqOptionKey;
  B: McqOptionKey;
  C: McqOptionKey;
  D: McqOptionKey;
}

export interface AdminProfile {
  id: string;
  username: string;
  displayName: string;
  lastLoginAt: string | null;
}

export interface QuestionDto {
  id: string;
  examId: string;
  type: QuestionType;
  promptHtml: string;
  optionAHtml: string | null;
  optionBHtml: string | null;
  optionCHtml: string | null;
  optionDHtml: string | null;
  marks: number;
  sortOrder: number;
  assetUrl: string | null;
}

export interface AdminQuestionDto extends QuestionDto {
  correctOption: McqOptionKey | null;
}

export interface ExamSummaryDto {
  id: string;
  title: string;
  examCode: string;
  instructionsHtml: string;
  status: ExamStatus;
  totalMarks: number;
  questionCount: number;
  resultsPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamDetailDto extends ExamSummaryDto {
  questions: AdminQuestionDto[];
}

export interface CandidateSessionDto {
  id: string;
  candidateId: string;
  examId: string;
  name: string;
  email: string;
  phone: string;
  ipAddress: string;
  status: SessionStatus;
  registeredAt: string;
  startedAt: string | null;
  endsAt: string | null;
  submittedAt: string | null;
  warningCount: number;
  lastHeartbeatAt: string | null;
}

export interface CandidateRegistrationResult {
  session: CandidateSessionDto;
  exam: ExamSummaryDto;
  requiresResume: boolean;
}

export interface CandidateRuntimeQuestion extends QuestionDto {
  optionOrder: OptionOrderMap | null;
}

export interface CandidateResponseDto {
  questionId: string;
  selectedOption: McqOptionKey | null;
  subjectiveAnswerHtml: string | null;
  savedAt: string;
  finalSubmitted: boolean;
}

export interface CandidateRuntimeDto {
  session: CandidateSessionDto;
  exam: ExamSummaryDto;
  questions: CandidateRuntimeQuestion[];
  responses: CandidateResponseDto[];
  timeRemainingSeconds: number;
}

export interface ViolationDto {
  id: string;
  sessionId: string;
  type: string;
  severity: ViolationSeverity;
  metadata: Record<string, unknown>;
  detectedAt: string;
}

export interface MonitoringCandidateRow {
  session: CandidateSessionDto;
  examTitle: string;
  activeViolations: number;
  latestViolation: ViolationDto | null;
}

export interface SubjectiveScoreDto {
  id: string;
  sessionId: string;
  questionId: string;
  awardedMarks: number;
  remarks: string | null;
  evaluatorAdminId: string;
}

export interface ResultSummaryDto {
  id: string;
  sessionId: string;
  mcqScore: number;
  subjectiveScore: number;
  totalScore: number;
  finalizedAt: string | null;
}

export interface PendingSubjectiveReviewDto {
  session: {
    id: string;
    candidateId: string;
    name: string;
  };
  pendingResponses: Array<{
    questionId: string;
    subjectiveAnswerHtml: string | null;
    question: {
      promptHtml: string;
      marks: number;
    };
  }>;
}

export interface AnalyticsOverviewDto {
  examsCount: number;
  activeSessions: number;
  submittedSessions: number;
  pendingSubjectiveReviews: number;
  violationCount: number;
  averageScore: number;
}

export interface RealtimeEventPayloadMap {
  "exam.started": { examId: string };
  "exam.stopped": { examId: string };
  "session.changed": { sessionId: string; status: SessionStatus };
  "violation.created": { sessionId: string; violationId: string };
  "grading.updated": { sessionId: string };
  "result.finalized": { sessionId: string; resultId: string };
}
