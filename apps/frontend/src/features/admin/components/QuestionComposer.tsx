import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AdminQuestionDto } from "@exam-platform/shared";

import { apiClient } from "../../../api/client";
import { RichTextEditor } from "../../../components/RichTextEditor";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";

export function QuestionComposer({
  examId,
  editingQuestion,
  onCancelEdit
}: {
  examId: string;
  editingQuestion?: AdminQuestionDto | null;
  onCancelEdit?: () => void;
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<"mcq" | "subjective">("mcq");
  const [promptHtml, setPromptHtml] = useState("<p></p>");
  const [optionAHtml, setOptionAHtml] = useState("<p>Option A</p>");
  const [optionBHtml, setOptionBHtml] = useState("<p>Option B</p>");
  const [optionCHtml, setOptionCHtml] = useState("<p>Option C</p>");
  const [optionDHtml, setOptionDHtml] = useState("<p>Option D</p>");
  const [correctOption, setCorrectOption] = useState("A");
  const [marks, setMarks] = useState(4);
  const [sortOrder, setSortOrder] = useState(1);
  const [assetUrl, setAssetUrl] = useState("");

  const isEditing = Boolean(editingQuestion);

  // Pre-fill form when editing a question
  useEffect(() => {
    if (editingQuestion) {
      setType(editingQuestion.type);
      setPromptHtml(editingQuestion.promptHtml);
      setOptionAHtml(editingQuestion.optionAHtml ?? "<p>Option A</p>");
      setOptionBHtml(editingQuestion.optionBHtml ?? "<p>Option B</p>");
      setOptionCHtml(editingQuestion.optionCHtml ?? "<p>Option C</p>");
      setOptionDHtml(editingQuestion.optionDHtml ?? "<p>Option D</p>");
      setCorrectOption(editingQuestion.correctOption ?? "A");
      setMarks(editingQuestion.marks);
      setSortOrder(editingQuestion.sortOrder);
      setAssetUrl(editingQuestion.assetUrl ?? "");
    }
  }, [editingQuestion]);

  function resetForm() {
    setType("mcq");
    setPromptHtml("<p></p>");
    setOptionAHtml("<p>Option A</p>");
    setOptionBHtml("<p>Option B</p>");
    setOptionCHtml("<p>Option C</p>");
    setOptionDHtml("<p>Option D</p>");
    setCorrectOption("A");
    setMarks(4);
    setSortOrder(1);
    setAssetUrl("");
  }

  const payload = useMemo(
    () => ({
      type,
      promptHtml,
      optionAHtml: type === "mcq" ? optionAHtml : null,
      optionBHtml: type === "mcq" ? optionBHtml : null,
      optionCHtml: type === "mcq" ? optionCHtml : null,
      optionDHtml: type === "mcq" ? optionDHtml : null,
      correctOption: type === "mcq" ? correctOption : null,
      marks: Number(marks),
      sortOrder: Number(sortOrder),
      assetUrl: assetUrl.trim() || null
    }),
    [assetUrl, correctOption, marks, optionAHtml, optionBHtml, optionCHtml, optionDHtml, promptHtml, sortOrder, type]
  );

  const mutation = useMutation({
    mutationFn: () =>
      isEditing
        ? apiClient.put(`/admin/exams/questions/${editingQuestion!.id}`, payload)
        : apiClient.post(`/admin/exams/${examId}/questions`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      await queryClient.invalidateQueries({ queryKey: ["exam-detail", examId] });
      resetForm();
      onCancelEdit?.();
    }
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <Card className="space-y-4" id="question-composer">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl text-ink">{isEditing ? "Edit Question" : "Add Question"}</h3>
          <p className="text-sm text-muted">
            {isEditing
              ? "Update the question details below. Click Cancel to discard changes."
              : "Rich text is stored as sanitized HTML, and math can be typed with LaTeX delimiters."}
          </p>
        </div>
        {isEditing ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm();
              onCancelEdit?.();
            }}
          >
            Cancel Edit
          </Button>
        ) : null}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-ink">Type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as "mcq" | "subjective")}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
            >
              <option value="mcq">MCQ</option>
              <option value="subjective">Subjective</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-ink">Marks</span>
            <Input type="number" value={marks} onChange={(event) => setMarks(Number(event.target.value))} />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-ink">Sort Order</span>
            <Input
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-ink">Asset URL</span>
            <Input value={assetUrl} onChange={(event) => setAssetUrl(event.target.value)} />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">Prompt</p>
          <RichTextEditor value={promptHtml} onChange={setPromptHtml} placeholder="Type the question prompt..." />
        </div>

        {type === "mcq" ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-ink">Option A</p>
                <RichTextEditor value={optionAHtml} onChange={setOptionAHtml} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-ink">Option B</p>
                <RichTextEditor value={optionBHtml} onChange={setOptionBHtml} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-ink">Option C</p>
                <RichTextEditor value={optionCHtml} onChange={setOptionCHtml} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-ink">Option D</p>
                <RichTextEditor value={optionDHtml} onChange={setOptionDHtml} />
              </div>
            </div>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-ink">Correct Option</span>
              <select
                value={correctOption}
                onChange={(event) => setCorrectOption(event.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </label>
          </div>
        ) : null}

        {mutation.error ? <p className="text-sm text-rose-700">{(mutation.error as Error).message}</p> : null}

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : isEditing ? "Update Question" : "Save Question"}
        </Button>
      </form>
    </Card>
  );
}
