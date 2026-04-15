import { SessionStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { emitRealtimeEvent } from "../../lib/realtime.js";
import { AppError } from "../../utils/http.js";
import { gradeSubmission } from "../../utils/grading.js";
import { toResultSummaryDto } from "../../utils/mappers.js";

export async function syncResultForSession(sessionId: string) {
  const session = await prisma.candidateSession.findUnique({
    where: { id: sessionId },
    include: {
      exam: {
        include: {
          questions: true
        }
      },
      responses: true,
      subjectiveScores: true,
      result: true
    }
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  const grade = gradeSubmission({
    questions: session.exam.questions,
    responses: session.responses,
    subjectiveScores: session.subjectiveScores
  });

  const result = await prisma.result.upsert({
    where: { sessionId },
    update: {
      mcqScore: grade.mcqScore,
      subjectiveScore: grade.subjectiveScore,
      totalScore: grade.totalScore,
      finalizedAt:
        grade.subjectivePendingCount === 0 &&
        (session.status === "submitted" || session.status === "expired" || session.status === "stopped")
          ? new Date()
          : null
    },
    create: {
      sessionId,
      mcqScore: grade.mcqScore,
      subjectiveScore: grade.subjectiveScore,
      totalScore: grade.totalScore,
      finalizedAt:
        grade.subjectivePendingCount === 0 &&
        (session.status === "submitted" || session.status === "expired" || session.status === "stopped")
          ? new Date()
          : null
    }
  });

  if (result.finalizedAt) {
    emitRealtimeEvent("result.finalized", {
      sessionId,
      resultId: result.id
    });
  }

  return result;
}

export async function finalizeSessionSubmission(
  sessionId: string,
  finalStatus: SessionStatus = "submitted"
) {
  const session = await prisma.candidateSession.findUnique({
    where: { id: sessionId },
    include: {
      responses: true
    }
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  if (session.status === "submitted" || session.status === "expired" || session.status === "stopped") {
    return syncResultForSession(sessionId);
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.candidateSession.update({
      where: { id: sessionId },
      data: {
        status: finalStatus,
        submittedAt: now
      }
    }),
    prisma.response.updateMany({
      where: { sessionId },
      data: {
        finalSubmitted: true,
        savedAt: now
      }
    })
  ]);

  emitRealtimeEvent("session.changed", {
    sessionId,
    status: finalStatus
  });

  return syncResultForSession(sessionId);
}

export async function expireOverdueSessions() {
  const expiredSessions = await prisma.candidateSession.findMany({
    where: {
      status: "in_progress",
      endsAt: {
        lte: new Date()
      }
    },
    select: {
      id: true
    }
  });

  for (const session of expiredSessions) {
    await finalizeSessionSubmission(session.id, "expired");
  }
}

export async function gradeSubjectiveAnswer({
  sessionId,
  questionId,
  evaluatorAdminId,
  awardedMarks,
  remarks
}: {
  sessionId: string;
  questionId: string;
  evaluatorAdminId: string;
  awardedMarks: number;
  remarks?: string | null;
}) {
  const question = await prisma.question.findUnique({
    where: { id: questionId }
  });

  if (!question || question.type !== "subjective") {
    throw new AppError("Subjective question not found", 404);
  }

  // Update both SubjectiveScore and Response tables
  await prisma.$transaction([
    prisma.subjectiveScore.upsert({
      where: {
        sessionId_questionId: {
          sessionId,
          questionId
        }
      },
      update: {
        awardedMarks,
        remarks: remarks ?? null,
        evaluatorAdminId
      },
      create: {
        sessionId,
        questionId,
        evaluatorAdminId,
        awardedMarks,
        remarks: remarks ?? null
      }
    }),
    prisma.response.update({
      where: {
        sessionId_questionId: {
          sessionId,
          questionId
        }
      },
      data: {
        awardedMarks,
        reviewRemarks: remarks ?? null
      }
    })
  ]);

  emitRealtimeEvent("grading.updated", { sessionId });
  return syncResultForSession(sessionId);
}

export async function listPendingSubjectiveReviews() {
  const sessions = await prisma.candidateSession.findMany({
    where: {
      status: {
        in: ["submitted", "expired", "stopped"]
      }
    },
    include: {
      exam: true,
      responses: {
        where: {
          question: {
            type: "subjective"
          }
        },
        include: {
          question: true
        }
      },
      subjectiveScores: true,
      result: true
    }
  });

  return sessions
    .map((session) => {
      const pendingResponses = session.responses.filter(
        (response) => !session.subjectiveScores.some((score) => score.questionId === response.questionId)
      );

      return {
        session,
        pendingResponses
      };
    })
    .filter((entry) => entry.pendingResponses.length > 0);
}

export async function listResultsExportRows(examId?: string) {
  return prisma.candidateSession.findMany({
    where: examId ? { examId } : undefined,
    include: {
      exam: {
        include: {
          questions: {
            orderBy: { sortOrder: "asc" }
          }
        }
      },
      responses: {
        include: {
          question: true
        }
      },
      result: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getResultsExportFilename(examId?: string) {
  if (!examId) {
    return "results-export.csv";
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: {
      examCode: true
    }
  });

  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  const safeExamCode = exam.examCode.replace(/[^a-zA-Z0-9-_]+/g, "-").toLowerCase();
  return `results-${safeExamCode}.csv`;
}

export async function getResultSummary(sessionId: string) {
  const result = await prisma.result.findUnique({
    where: {
      sessionId
    }
  });

  if (!result) {
    throw new AppError("Result not found", 404);
  }

  return toResultSummaryDto(result);
}
