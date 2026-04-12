import { prisma } from "../../lib/prisma.js";
import { toMonitoringCandidateRow, toViolationDto } from "../../utils/mappers.js";

export async function listMonitoringSessions() {
  const sessions = await prisma.candidateSession.findMany({
    include: {
      exam: true,
      violations: {
        orderBy: {
          detectedAt: "desc"
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    },
    take: 200
  });

  return sessions.map((session) =>
    toMonitoringCandidateRow({
      session,
      examTitle: session.exam.title,
      activeViolations: session.violations.length,
      latestViolation: session.violations[0] ?? null
    })
  );
}

export async function listRecentViolations() {
  const violations = await prisma.violation.findMany({
    orderBy: {
      detectedAt: "desc"
    },
    take: 200
  });

  return violations.map(toViolationDto);
}

export async function deleteCandidateSession(sessionId: string) {
  await prisma.candidateSession.delete({
    where: { id: sessionId }
  });
}
