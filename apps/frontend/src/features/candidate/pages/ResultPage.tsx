import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import type { CandidateRegistrationResult } from "@exam-platform/shared";

import { apiClient } from "../../../api/client";
import { Card } from "../../../components/ui/Card";


export function ResultPage() {
  const { sessionId = "" } = useParams();

  const sessionQuery = useQuery({
    queryKey: ["candidate-session", sessionId],
    queryFn: () => apiClient.get<CandidateRegistrationResult>(`/candidate-sessions/${sessionId}`),
    enabled: Boolean(sessionId)
  });

  const session = sessionQuery.data?.session;

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-orange-700 px-8 py-10 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100">
              Office LAN Exam Platform
            </p>
            <h1 className="mt-2 font-display text-4xl leading-tight">Exam Submitted</h1>
            <p className="mt-2 text-sm text-teal-50/85">
              Your responses have been saved successfully.
            </p>
            {session && (
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span className="rounded-xl bg-white/15 px-3 py-1 font-medium">{session.name}</span>
                <span className="rounded-xl bg-white/15 px-3 py-1 font-mono">{session.candidateId}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Confirmation message — no scores shown to candidate */}
        <Card className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
              <svg
                className="h-8 w-8 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-ink">Submission Successful</p>
            <p className="mt-1 text-sm text-muted">
              Your exam has been submitted and is under evaluation.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              📢 Your results will be announced by the administrator after evaluation is complete.
            </p>
          </div>
          {session && (
            <p className="text-xs text-muted">
              Please note your Candidate ID for reference:{" "}
              <span className="font-mono font-semibold text-ink">{session.candidateId}</span>
            </p>
          )}
        </Card>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 text-center">
          <p className="text-xs text-muted">
            You may close this window. Please wait for the administrator to announce results.
          </p>
        </div>

      </div>
    </main>
  );
}
