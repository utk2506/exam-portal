import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/http.js";
import { sanitizeRichHtml } from "../../utils/sanitize-rich-html.js";

export async function saveCandidateResponse({
  sessionId,
  questionId,
  selectedOption,
  subjectiveAnswerHtml
}: {
  sessionId: string;
  questionId: string;
  selectedOption?: "A" | "B" | "C" | "D" | null;
  subjectiveAnswerHtml?: string | null;
}) {
  const session = await prisma.candidateSession.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    throw new AppError("Candidate session not found", 404);
  }

  if (session.status !== "in_progress") {
    throw new AppError("Exam session is not active", 409);
  }

  if (session.endsAt && session.endsAt.getTime() <= Date.now()) {
    throw new AppError("Exam time is over", 409);
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId }
  });

  if (!question || question.examId !== session.examId) {
    throw new AppError("Question not found for this candidate", 404);
  }

  return prisma.response.upsert({
    where: {
      sessionId_questionId: {
        sessionId,
        questionId
      }
    },
    update: {
      selectedOption: selectedOption ?? null,
      subjectiveAnswerHtml: subjectiveAnswerHtml ? sanitizeRichHtml(subjectiveAnswerHtml) : null,
      savedAt: new Date()
    },
    create: {
      sessionId,
      questionId,
      selectedOption: selectedOption ?? null,
      subjectiveAnswerHtml: subjectiveAnswerHtml ? sanitizeRichHtml(subjectiveAnswerHtml) : null
    }
  });
}
