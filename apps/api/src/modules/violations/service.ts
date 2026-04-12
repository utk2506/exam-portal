import { type Prisma, type ViolationSeverity } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { emitRealtimeEvent } from "../../lib/realtime.js";
import { AppError } from "../../utils/http.js";

export async function createViolation({
  sessionId,
  type,
  severity,
  metadata
}: {
  sessionId: string;
  type: string;
  severity: ViolationSeverity;
  metadata?: Record<string, unknown>;
}) {
  const session = await prisma.candidateSession.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  const violation = await prisma.violation.create({
    data: {
      sessionId,
      type,
      severity,
      metadata: (metadata ?? {}) as Prisma.InputJsonValue
    }
  });

  if (severity === "warning" || severity === "critical") {
    await prisma.candidateSession.update({
      where: { id: sessionId },
      data: {
        warningCount: {
          increment: 1
        }
      }
    });
  }

  emitRealtimeEvent("violation.created", {
    sessionId,
    violationId: violation.id
  });

  return violation;
}
