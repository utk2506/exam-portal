import type { CandidateRuntimeQuestion, CandidateResponseDto } from "@exam-platform/shared";

import { cn } from "../../../lib/cn";

export function QuestionNavigator({
  questions,
  responses,
  currentQuestionId,
  visited,
  markedForReview,
  onSelect
}: {
  questions: CandidateRuntimeQuestion[];
  responses: CandidateResponseDto[];
  currentQuestionId: string;
  visited: Set<string>;
  markedForReview: Set<string>;
  onSelect: (questionId: string) => void;
}) {
  const responseMap = new Map(responses.map((response) => [response.questionId, response]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3 sm:grid-cols-6 lg:grid-cols-5">
        {questions.map((question, index) => {
          const response = responseMap.get(question.id);
          const isAnswered =
            Boolean(response?.selectedOption) || Boolean(response?.subjectiveAnswerHtml?.replace(/<[^>]+>/g, "").trim());
          const isCurrent = question.id === currentQuestionId;
          const isVisited = visited.has(question.id);
          const isMarked = markedForReview.has(question.id);

          return (
            <button
              key={question.id}
              type="button"
              className={cn(
                "rounded-2xl border px-3 py-3 text-sm font-semibold transition",
                isCurrent && "border-ink ring-2 ring-stone-300",
                isMarked && "bg-sky-500 text-white",
                !isMarked && isAnswered && "bg-teal-600 text-white",
                !isMarked && !isAnswered && isVisited && "bg-rose-500 text-white",
                !isMarked && !isAnswered && !isVisited && "bg-white text-ink"
              )}
              onClick={() => onSelect(question.id)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <div className="grid gap-2 text-xs text-muted md:grid-cols-2">
        <p><span className="font-semibold text-teal-700">Green</span> Answered</p>
        <p><span className="font-semibold text-rose-700">Red</span> Not answered</p>
        <p><span className="font-semibold text-sky-700">Blue</span> Marked for review</p>
        <p><span className="font-semibold text-stone-700">White</span> Not visited</p>
      </div>
    </div>
  );
}
