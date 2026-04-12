import type { CandidateRuntimeQuestion, McqOptionKey } from "@exam-platform/shared";

import { MathHtml } from "../../../components/MathHtml";
import { RichTextEditor } from "../../../components/RichTextEditor";
import { Card } from "../../../components/ui/Card";

function optionHtml(question: CandidateRuntimeQuestion, originalOption: McqOptionKey) {
  if (originalOption === "A") return question.optionAHtml;
  if (originalOption === "B") return question.optionBHtml;
  if (originalOption === "C") return question.optionCHtml;
  return question.optionDHtml;
}

export function QuestionCard({
  question,
  selectedOption,
  subjectiveAnswerHtml,
  onSelectOption,
  onChangeSubjective
}: {
  question: CandidateRuntimeQuestion;
  selectedOption: McqOptionKey | null;
  subjectiveAnswerHtml: string;
  onSelectOption: (originalOption: McqOptionKey) => void;
  onChangeSubjective: (html: string) => void;
}) {
  const optionOrder = question.optionOrder ?? {
    A: "A",
    B: "B",
    C: "C",
    D: "D"
  };

  const orderedOptions = (["A", "B", "C", "D"] as const).map((displayLabel) => ({
    displayLabel,
    originalOption: optionOrder[displayLabel] as McqOptionKey,
    html: optionHtml(question, optionOrder[displayLabel] as McqOptionKey)
  }));

  return (
    <Card className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {question.type.toUpperCase()} • {question.marks} marks
        </p>
        <MathHtml html={question.promptHtml} className="text-base" />
      </div>

      {question.type === "mcq" ? (
        <div className="space-y-3">
          {orderedOptions.map((option) => (
            <button
              key={`${question.id}-${option.displayLabel}`}
              type="button"
              className={`flex w-full items-start gap-4 rounded-2xl border px-4 py-4 text-left transition ${
                selectedOption === option.originalOption
                  ? "border-primary bg-teal-50"
                  : "border-stone-200 bg-white hover:border-teal-300"
              }`}
              onClick={() => onSelectOption(option.originalOption)}
            >
              <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-ink">
                {option.displayLabel}
              </span>
              <div className="flex-1">
                <MathHtml html={option.html ?? "<p></p>"} />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">Type your answer</p>
          <RichTextEditor
            value={subjectiveAnswerHtml}
            onChange={onChangeSubjective}
            placeholder="Write your detailed answer here..."
          />
        </div>
      )}
    </Card>
  );
}
