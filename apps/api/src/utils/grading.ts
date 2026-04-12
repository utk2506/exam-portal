import { McqOption, type Question, type Response, type SubjectiveScore } from "@prisma/client";

interface GradeResult {
  mcqScore: number;
  subjectiveScore: number;
  totalScore: number;
  subjectivePendingCount: number;
}

export function gradeSubmission({
  questions,
  responses,
  subjectiveScores
}: {
  questions: Question[];
  responses: Response[];
  subjectiveScores: SubjectiveScore[];
}): GradeResult {
  const responseMap = new Map(responses.map((response) => [response.questionId, response]));
  const subjectiveMap = new Map(subjectiveScores.map((score) => [score.questionId, score]));

  let mcqScore = 0;
  let subjectiveScore = 0;
  let subjectivePendingCount = 0;

  for (const question of questions) {
    if (question.type === "mcq") {
      const response = responseMap.get(question.id);
      if (response?.selectedOption && response.selectedOption === question.correctOption) {
        mcqScore += question.marks;
      }
      continue;
    }

    const score = subjectiveMap.get(question.id);
    if (!score) {
      subjectivePendingCount += 1;
      continue;
    }

    subjectiveScore += score.awardedMarks;
  }

  return {
    mcqScore,
    subjectiveScore,
    totalScore: mcqScore + subjectiveScore,
    subjectivePendingCount
  };
}

export function normalizeOption(option: string | null | undefined): McqOption | null {
  if (!option) {
    return null;
  }

  if (option === "A" || option === "B" || option === "C" || option === "D") {
    return option;
  }

  return null;
}
