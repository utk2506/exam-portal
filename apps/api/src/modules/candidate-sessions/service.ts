import type { OptionOrderMap } from "@exam-platform/shared";
import { SessionStatus, type Prisma, type Question } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { emitRealtimeEvent } from "../../lib/realtime.js";
import { AppError } from "../../utils/http.js";
import { toCandidateRuntimeDto, toCandidateRuntimeQuestion, toCandidateSessionDto, toExamSummaryDto } from "../../utils/mappers.js";
import { createOptionOrderMap, shuffleArray } from "../../utils/randomization.js";
import { createViolation } from "../violations/service.js";
import { generateCandidateId } from "../../utils/candidate-id.js";

function normalizeExamCode(code: string) {
  return code.trim().toUpperCase();
}

function ensureExamIsLive(exam: { status: string }) {
  if (exam.status !== "live") {
    throw new AppError("This exam is not currently live", 403);
  }
}


export async function registerOrResumeCandidate({
  name,
  email,
  phone,
  examCode,
  ipAddress
}: {
  name: string;
  email: string;
  phone: string;
  examCode: string;
  ipAddress: string;
}) {
  const normalizedCode = normalizeExamCode(examCode);

  const exam = await prisma.exam.findUnique({
    where: {
      examCode: normalizedCode
    },
    include: {
      questions: true
    }
  });

  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  ensureExamIsLive(exam);

  const existingSession = await prisma.candidateSession.findFirst({
    where: {
      examId: exam.id,
      email,
      phone
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  if (existingSession) {
    if (existingSession.status === "submitted" || existingSession.status === "expired" || existingSession.status === "stopped") {
      throw new AppError("This candidate has already completed the exam attempt", 409);
    }

    const refreshedSession = await prisma.candidateSession.update({
      where: { id: existingSession.id },
      data: {
        name,
        ipAddress
      }
    });

    return {
      session: refreshedSession,
      exam,
      requiresResume: true
    };
  }

  const candidateId = await generateCandidateId();
  const session = await prisma.candidateSession.create({
    data: {
      candidateId,
      examId: exam.id,
      name,
      email,
      phone,
      ipAddress
    }
  });

  return {
    session,
    exam,
    requiresResume: false
  };
}

export async function startCandidateSession(sessionId: string) {
  const session = await prisma.candidateSession.findUnique({
    where: { id: sessionId },
    include: {
      exam: {
        include: {
          questions: {
            orderBy: {
              sortOrder: "asc"
            }
          }
        }
      }
    }
  });

  if (!session) {
    throw new AppError("Candidate session not found", 404);
  }

  if (session.status === "submitted" || session.status === "expired" || session.status === "stopped") {
    throw new AppError("This session can no longer be started", 409);
  }

  if (session.status === "in_progress" && session.endsAt) {
    return session;
  }

  ensureExamIsLive(session.exam);


  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + session.exam.durationMinutes * 60_000);
  const questionOrder = shuffleArray(session.exam.questions.map((question) => question.id));
  const optionOrderMap: Record<string, OptionOrderMap> = {};

  for (const question of session.exam.questions) {
    if (question.type === "mcq") {
      optionOrderMap[question.id] = createOptionOrderMap();
    }
  }

  const updatedSession = await prisma.candidateSession.update({
    where: { id: sessionId },
    data: {
      status: "in_progress",
      startedAt,
      endsAt,
      questionOrder,
      optionOrderMap: optionOrderMap as unknown as Prisma.InputJsonValue,
      lastHeartbeatAt: startedAt
    }
  });

  emitRealtimeEvent("session.changed", {
    sessionId,
    status: updatedSession.status
  });

  return updatedSession;
}

function reorderQuestions(questions: Question[], questionOrder: string[] | null) {
  if (!questionOrder || questionOrder.length === 0) {
    return questions;
  }

  const questionMap = new Map(questions.map((question) => [question.id, question]));
  return questionOrder
    .map((questionId) => questionMap.get(questionId))
    .filter(Boolean) as Question[];
}

export async function getCandidateRuntime(sessionId: string) {
  const session = await prisma.candidateSession.findUnique({
    where: { id: sessionId },
    include: {
      exam: {
        include: {
          questions: {
            orderBy: {
              sortOrder: "asc"
            }
          }
        }
      },
      responses: true
    }
  });

  if (!session) {
    throw new AppError("Candidate session not found", 404);
  }

  if (session.status === "registered") {
    throw new AppError("Session has not started yet", 409);
  }

  if (session.status === "submitted" || session.status === "expired" || session.status === "stopped") {
    throw new AppError("Exam session has already been submitted", 409);
  }

  const order = (session.questionOrder as string[] | null) ?? null;
  const optionOrderMap = (session.optionOrderMap as Record<string, OptionOrderMap> | null) ?? {};
  const orderedQuestions = reorderQuestions(session.exam.questions, order);

  const runtimeQuestions = orderedQuestions.map((question) =>
    toCandidateRuntimeQuestion(question, optionOrderMap[question.id])
  );

  return toCandidateRuntimeDto({
    session,
    exam: session.exam,
    questions: runtimeQuestions,
    responses: session.responses
  });
}

export async function heartbeatCandidateSession({
  sessionId,
  currentQuestionId,
  ipAddress
}: {
  sessionId: string;
  currentQuestionId?: string | null;
  ipAddress: string;
}) {
  const session = await prisma.candidateSession.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    throw new AppError("Candidate session not found", 404);
  }

  const data: Prisma.CandidateSessionUpdateInput = {
    lastHeartbeatAt: new Date(),
    currentQuestionId: currentQuestionId ?? null
  };

  if (ipAddress && session.ipAddress !== ipAddress) {
    data.ipAddress = ipAddress;
  }

  const updatedSession = await prisma.candidateSession.update({
    where: { id: sessionId },
    data
  });

  if (session.lastHeartbeatAt) {
    const gapSeconds = Math.floor((Date.now() - session.lastHeartbeatAt.getTime()) / 1000);
    if (gapSeconds > 20) {
      await createViolation({
        sessionId,
        type: "heartbeat_gap",
        severity: "info",
        metadata: {
          gapSeconds
        }
      });
    }
  }

  if (ipAddress && session.ipAddress !== ipAddress) {
    await createViolation({
      sessionId,
      type: "ip_change",
      severity: "warning",
      metadata: {
        previousIp: session.ipAddress,
        nextIp: ipAddress
      }
    });
  }

  return toCandidateSessionDto(updatedSession);
}

export async function getCandidateRegistrationPayload(sessionId: string) {
  const session = await prisma.candidateSession.findUnique({
    where: { id: sessionId },
    include: {
      exam: {
        include: {
          questions: true
        }
      }
    }
  });

  if (!session) {
    throw new AppError("Candidate session not found", 404);
  }

  return {
    session: toCandidateSessionDto(session),
    exam: toExamSummaryDto(session.exam)
  };
}

export function toFinalSessionStatus(isForcedStop: boolean): SessionStatus {
  return isForcedStop ? "stopped" : "submitted";
}
