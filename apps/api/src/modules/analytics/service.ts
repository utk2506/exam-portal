import { prisma } from "../../lib/prisma.js";

export async function getAnalyticsOverview() {
  const [examsCount, activeSessions, submittedSessions, pendingSubjectiveReviews, violationCount, average] =
    await Promise.all([
      prisma.exam.count(),
      prisma.candidateSession.count({
        where: {
          status: {
            in: ["registered", "in_progress"]
          }
        }
      }),
      prisma.candidateSession.count({
        where: {
          status: {
            in: ["submitted", "expired", "stopped"]
          }
        }
      }),
      prisma.response.count({
        where: {
          question: {
            type: "subjective"
          },
          session: {
            status: {
              in: ["submitted", "expired", "stopped"]
            }
          }
        }
      }),
      prisma.violation.count(),
      prisma.result.aggregate({
        _avg: {
          totalScore: true
        }
      })
    ]);

  return {
    examsCount,
    activeSessions,
    submittedSessions,
    pendingSubjectiveReviews,
    violationCount,
    averageScore: Number(average._avg.totalScore ?? 0)
  };
}

export async function getExamAnalytics(examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        orderBy: {
          sortOrder: "asc"
        }
      },
      candidateSessions: {
        include: {
          responses: true,
          result: true
        }
      }
    }
  });

  if (!exam) {
    return null;
  }

  const completedSessions = exam.candidateSessions.filter((session) =>
    ["submitted", "expired", "stopped"].includes(session.status)
  );

  const averageScore =
    completedSessions.reduce((sum, session) => sum + (session.result?.totalScore ?? 0), 0) /
    (completedSessions.length || 1);

  return {
    examId: exam.id,
    title: exam.title,
    status: exam.status,
    submittedCount: completedSessions.length,
    averageScore,
    questionStats: exam.questions.map((question) => {
      const responses = completedSessions
        .map((session) => session.responses.find((response) => response.questionId === question.id))
        .filter(Boolean);

      const correctCount =
        question.type === "mcq"
          ? responses.filter((response) => response?.selectedOption === question.correctOption).length
          : 0;

      return {
        questionId: question.id,
        type: question.type,
        sortOrder: question.sortOrder,
        attempts: responses.length,
        correctCount,
        accuracy: question.type === "mcq" && responses.length > 0 ? correctCount / responses.length : null
      };
    })
  };
}
