import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { CandidateRegistrationResult } from "@exam-platform/shared";
import { useNavigate, useParams } from "react-router-dom";

import { apiClient } from "../../../api/client";
import { MathHtml } from "../../../components/MathHtml";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

export function ExamInstructionsPage() {
  const navigate = useNavigate();
  const { sessionId = "" } = useParams();

  const sessionQuery = useQuery({
    queryKey: ["candidate-session", sessionId],
    queryFn: () => apiClient.get<CandidateRegistrationResult>(`/candidate-sessions/${sessionId}`),
    enabled: Boolean(sessionId)
  });

  const startMutation = useMutation({
    mutationFn: () => apiClient.post(`/candidate-sessions/${sessionId}/start`),
    onSuccess: () => {
      navigate(`/exam/${sessionId}/runtime`);
    }
  });

  useEffect(() => {
    const status = sessionQuery.data?.session.status;
    if (status === "submitted" || status === "expired" || status === "stopped") {
      navigate("/exam", { replace: true });
    }
  }, [navigate, sessionQuery.data?.session.status]);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Exam Instructions</p>
              <h1 className="font-display text-4xl text-ink">{sessionQuery.data?.exam.title ?? "Loading..."}</h1>
            </div>
            <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-muted">
              Candidate ID: <span className="font-semibold text-ink">{sessionQuery.data?.session.candidateId ?? "--"}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Duration</p>
              <p className="mt-2 font-display text-3xl text-ink">60 min</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Total Marks</p>
              <p className="mt-2 font-display text-3xl text-ink">{sessionQuery.data?.exam.totalMarks ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Question Count</p>
              <p className="mt-2 font-display text-3xl text-ink">{sessionQuery.data?.exam.questionCount ?? 0}</p>
            </Card>
          </div>

          <Card className="space-y-4 bg-stone-50">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Important Rules</p>
            <ul className="space-y-2 text-sm text-ink">
              <li>Remain in fullscreen mode for the entire attempt.</li>
              <li>Do not switch tabs, use blocked shortcuts, or refresh the page.</li>
              <li>Answers are auto-saved, but you should still use Save & Next while navigating.</li>
              <li>Subjective answers must be typed inside the provided editor.</li>
            </ul>
          </Card>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Exam Instructions</p>
            <MathHtml html={sessionQuery.data?.exam.instructionsHtml ?? "<p>Loading instructions...</p>"} />
          </div>

          {startMutation.error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {(startMutation.error as Error).message}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={startMutation.isPending}
              onClick={() => {
                // Request fullscreen NOW (user gesture required by browsers)
                if (!document.fullscreenElement) {
                  void document.documentElement.requestFullscreen().catch(() => {});
                }
                startMutation.mutate();
              }}
            >
              {startMutation.isPending ? "Starting..." : "Start Exam"}
            </Button>

          </div>
        </Card>
      </div>
    </main>
  );
}
