import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PendingSubjectiveReviewDto } from "@exam-platform/shared";

import { apiClient } from "../../../api/client";
import { MathHtml } from "../../../components/MathHtml";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input, TextArea } from "../../../components/ui/Input";

export function PendingReviewsPanel({ entries }: { entries: PendingSubjectiveReviewDto[] }) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  const gradeMutation = useMutation({
    mutationFn: ({
      sessionId,
      questionId,
      awardedMarks,
      reviewRemarks
    }: {
      sessionId: string;
      questionId: string;
      awardedMarks: number;
      reviewRemarks: string;
    }) =>
      apiClient.put(`/admin/results/sessions/${sessionId}/questions/${questionId}`, {
        awardedMarks,
        remarks: reviewRemarks
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pending-reviews"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    }
  });

  return (
    <Card className="space-y-4 flex flex-col">
      <div>
        <h3 className="font-display text-2xl text-ink">Subjective Review Queue</h3>
        <p className="text-sm text-muted">Evaluate typed responses and update result totals without leaving the dashboard.</p>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[700px] rounded-2xl border border-stone-100 bg-stone-50 p-4 space-y-6">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-80">
            <p className="text-sm text-muted">No pending subjective reviews.</p>
          </div>
        ) : (
          <>

        {entries.map((entry) => (
          <div key={entry.session.id} className="rounded-3xl border border-stone-100 bg-stone-50/80 p-4">
            <div className="mb-4">
              <h4 className="font-semibold text-ink">{entry.session.name}</h4>
              <p className="text-xs text-muted">{entry.session.candidateId}</p>
            </div>

            <div className="space-y-4">
              {entry.pendingResponses.map((response) => {
                const key = `${entry.session.id}:${response.questionId}`;
                return (
                  <div key={response.questionId} className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Question</p>
                      <MathHtml html={response.question.promptHtml} />
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Candidate Answer</p>
                      <MathHtml html={response.subjectiveAnswerHtml ?? "<p>No response.</p>"} />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-[160px,1fr,auto]">
                      <label className="space-y-2 text-sm">
                        <span className="font-medium text-ink">Marks / {response.question.marks}</span>
                        <Input
                          type="number"
                          value={marks[key] ?? ""}
                          onChange={(event) =>
                            setMarks((current) => ({ ...current, [key]: event.target.value }))
                          }
                        />
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className="font-medium text-ink">Remarks</span>
                        <TextArea
                          rows={3}
                          value={remarks[key] ?? ""}
                          onChange={(event) =>
                            setRemarks((current) => ({ ...current, [key]: event.target.value }))
                          }
                        />
                      </label>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          disabled={gradeMutation.isPending || !marks[key]}
                          onClick={() =>
                            gradeMutation.mutate({
                              sessionId: entry.session.id,
                              questionId: response.questionId,
                              awardedMarks: Number(marks[key]),
                              reviewRemarks: remarks[key] ?? ""
                            })
                          }
                        >
                          Save Grade
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          ))}
          </>
        )}
      </div>
    </Card>
  );
}
