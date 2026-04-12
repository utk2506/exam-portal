import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminQuestionDto, ExamDetailDto, ExamSummaryDto } from "@exam-platform/shared";

import { apiClient, API_BASE } from "../../../api/client";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input, TextArea } from "../../../components/ui/Input";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { QuestionComposer } from "./QuestionComposer";
import { QuestionImportPanel } from "./QuestionImportPanel";

export function ExamManager({
  exams,
  selectedExamId,
  onSelectExam
}: {
  exams: ExamSummaryDto[];
  selectedExamId: string | null;
  onSelectExam: (examId: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestionDto | null>(null);
  const [confirmDeleteQuestionId, setConfirmDeleteQuestionId] = useState<string | null>(null);
  const [title, setTitle] = useState("JEE Practice Test");
  const [examCode, setExamCode] = useState("JEE-001");
  const [totalMarks, setTotalMarks] = useState(300);
  const [instructionsHtml, setInstructionsHtml] = useState(
    "<p>Read each question carefully. Remain in fullscreen. Do not switch tabs or use restricted shortcuts.</p>"
  );


  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId) ?? null,
    [exams, selectedExamId]
  );

  const examDetailQuery = useQuery({
    queryKey: ["exam-detail", selectedExamId],
    queryFn: () => apiClient.get<{ exam: ExamDetailDto }>(`/admin/exams/${selectedExamId}`),
    enabled: Boolean(selectedExamId)
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post("/admin/exams", {
        title,
        examCode,
        instructionsHtml,
        totalMarks: Number(totalMarks),
        status: "draft"
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (mode: "start" | "stop") =>
      apiClient.post(`/admin/exams/${selectedExamId}/${mode}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/admin/exams/${selectedExamId}`),
    onSuccess: async () => {
      setConfirmDelete(false);
      onSelectExam(exams.find((e) => e.id !== selectedExamId)?.id ?? (null as unknown as string));
      await queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => apiClient.delete(`/admin/exams/questions/${questionId}`),
    onSuccess: async () => {
      setConfirmDeleteQuestionId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      await queryClient.invalidateQueries({ queryKey: ["exam-detail", selectedExamId] });
    }
  });

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[380px,1fr]">
      <div className="space-y-4">
        <Card className="space-y-4">
          <div>
            <h3 className="font-display text-2xl text-ink">Create Exam</h3>
            <p className="text-sm text-muted">Fill in the exam details below. Duration is fixed at 60 minutes. Start and stop exams manually.</p>
          </div>
          <form className="space-y-3" onSubmit={handleCreate}>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Exam Title" />
            <Input value={examCode} onChange={(event) => setExamCode(event.target.value)} placeholder="Exam Code" />
            <Input type="number" value={totalMarks} onChange={(event) => setTotalMarks(Number(event.target.value))} placeholder="Total Marks" />
            <TextArea
              rows={5}
              value={instructionsHtml}
              onChange={(event) => setInstructionsHtml(event.target.value)}
            />

            {createMutation.error ? <p className="text-sm text-rose-700">{(createMutation.error as Error).message}</p> : null}
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Exam"}
            </Button>
          </form>
        </Card>

        <Card className="space-y-4">
          <div>
            <h3 className="font-display text-2xl text-ink">Exam List</h3>
            <p className="text-sm text-muted">Select an exam to edit questions, import content, or control the live window.</p>
          </div>

          <div className="space-y-3">
            {exams.map((exam) => (
              <button
                key={exam.id}
                type="button"
                onClick={() => {
                  onSelectExam(exam.id);
                  setEditingQuestion(null);
                  setConfirmDeleteQuestionId(null);
                }}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  exam.id === selectedExamId
                    ? "border-primary bg-teal-50"
                    : "border-stone-200 bg-white hover:border-teal-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{exam.title}</p>
                    <p className="text-xs text-muted">{exam.examCode}</p>
                  </div>
                  <StatusBadge
                    label={exam.status}
                    tone={
                      exam.status === "live"
                        ? "success"
                        : exam.status === "stopped"
                          ? "danger"
                          : "neutral"
                    }
                  />
                </div>
              </button>
            ))}
            {exams.length === 0 ? <p className="text-sm text-muted">No exams created yet.</p> : null}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl text-ink">{selectedExam?.title ?? "Select an exam"}</h3>
              <p className="text-sm text-muted">
                Candidate URL: {selectedExam ? `${window.location.origin}/exam` : "Create or select an exam"}
              </p>
            </div>
            {selectedExam ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    window.open(
                      `${API_BASE}/admin/results/export?examId=${encodeURIComponent(selectedExam.id)}`,
                      "_blank"
                    )
                  }
                >
                  Export Results
                </Button>
                <Button
                  type="button"
                  onClick={() => toggleMutation.mutate(selectedExam.status === "live" ? "stop" : "start")}
                >
                  {selectedExam.status === "live" ? "Stop Exam" : "Start Exam"}
                </Button>
                {selectedExam.status !== "live" ? (
                  confirmDelete ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2">
                      <p className="text-sm text-rose-700 font-medium">Permanently delete this exam and all its data?</p>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => deleteMutation.mutate()}
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Delete Exam
                    </Button>
                  )
                ) : null}
                {deleteMutation.error ? (
                  <p className="w-full text-sm text-rose-700">{(deleteMutation.error as Error).message}</p>
                ) : null}
              </div>
            ) : null}

          </div>

          {selectedExam ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Question Count</p>
                <p className="mt-2 font-display text-3xl text-ink">{selectedExam.questionCount}</p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Duration</p>
                <p className="mt-2 font-display text-3xl text-ink">60 min</p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Total Marks</p>
                <p className="mt-2 font-display text-3xl text-ink">{selectedExam.totalMarks}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Choose an exam to manage its questions and live controls.</p>
          )}

          {selectedExam && examDetailQuery.data?.exam?.questions ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink">
                Current Questions ({examDetailQuery.data.exam.questions.length})
              </p>
              <div className="max-h-96 space-y-3 overflow-auto rounded-2xl border border-stone-100 bg-stone-50 p-4">
                {examDetailQuery.data.exam.questions.map((question) => (
                  <div
                    key={question.id}
                    className={`rounded-2xl bg-white p-4 transition ${
                      editingQuestion?.id === question.id ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">
                          Q{question.sortOrder} • {question.type} • {question.marks} marks
                          {question.correctOption ? ` • Answer: ${question.correctOption}` : ""}
                        </p>
                        <div className="mt-2 text-sm text-ink" dangerouslySetInnerHTML={{ __html: question.promptHtml }} />
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          title="Edit question"
                          onClick={() => {
                            setEditingQuestion(question);
                            document.getElementById("question-composer")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="rounded-lg p-1.5 text-teal-600 transition hover:bg-teal-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        {confirmDeleteQuestionId === question.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title="Confirm delete"
                              onClick={() => deleteQuestionMutation.mutate(question.id)}
                              className="rounded-lg p-1.5 text-white bg-rose-600 transition hover:bg-rose-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              title="Cancel"
                              onClick={() => setConfirmDeleteQuestionId(null)}
                              className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            title="Delete question"
                            onClick={() => setConfirmDeleteQuestionId(question.id)}
                            className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {examDetailQuery.data.exam.questions.length === 0 ? (
                  <p className="text-sm text-muted">No questions added yet. Use the form below to add questions.</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </Card>

        {selectedExam ? (
          <QuestionComposer
            examId={selectedExam.id}
            editingQuestion={editingQuestion}
            onCancelEdit={() => setEditingQuestion(null)}
          />
        ) : null}
        {selectedExam ? <QuestionImportPanel examId={selectedExam.id} /> : null}
      </div>
    </div>
  );
}
