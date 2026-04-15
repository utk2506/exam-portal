import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MonitoringCandidateRow, ViolationDto } from "@exam-platform/shared";

import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";

export function MonitoringPanel({
  sessions,
  violations
}: {
  sessions: MonitoringCandidateRow[];
  violations: ViolationDto[];
}) {
  const queryClient = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.delete(`/admin/monitoring/sessions/${sessionId}`),
    onSuccess: async () => {
      setConfirmDeleteId(null);
      await queryClient.invalidateQueries({ queryKey: ["monitoring-sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["monitoring-violations"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
      await queryClient.invalidateQueries({ queryKey: ["exam-analytics"] });
    }
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
      <Card className="space-y-4 flex flex-col">
        <div>
          <h3 className="font-display text-2xl text-ink">Live Monitoring</h3>
          <p className="text-sm text-muted">Track active candidates, warnings, and session health in one place.</p>
        </div>
        <div className="flex-1 overflow-auto max-h-[500px] rounded-2xl border border-stone-100 bg-stone-50">
          {sessions.length === 0 ? (
            <div className="flex items-center justify-center h-80">
              <p className="text-sm text-muted">No active sessions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="pb-3">Candidate</th>
                <th className="pb-3">Exam</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Warnings</th>
                <th className="pb-3">Violations</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sessions.map((row) => (
                <tr key={row.session.id}>
                  <td className="py-3">
                    <div className="font-medium text-ink">{row.session.name}</div>
                    <div className="text-xs text-muted">{row.session.candidateId}</div>
                  </td>
                  <td className="py-3">{row.examTitle}</td>
                  <td className="py-3">
                    <StatusBadge
                      label={row.session.status}
                      tone={row.session.status === "in_progress" ? "success" : "neutral"}
                    />
                  </td>
                  <td className="py-3">{row.session.warningCount}</td>
                  <td className="py-3">
                    {row.latestViolation ? (
                      <div className="space-y-1">
                        <StatusBadge label={row.latestViolation.type} tone="warning" />
                        <div className="text-xs text-muted">{new Date(row.latestViolation.detectedAt).toLocaleString()}</div>
                      </div>
                    ) : (
                      <span className="text-muted">None</span>
                    )}
                  </td>
                  <td className="py-3">
                    {confirmDeleteId === row.session.id ? (
                      <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                        <span className="text-xs text-rose-700 font-medium">Delete session?</span>
                        <Button
                          type="button"
                          variant="danger"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(row.session.id)}
                          className="h-7 px-2 text-xs"
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Yes"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-7 px-2 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={deleteMutation.isPending}
                        onClick={() => setConfirmDeleteId(row.session.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-4 flex flex-col">
        <div>
          <h3 className="font-display text-2xl text-ink">Recent Violations</h3>
          <p className="text-sm text-muted">Latest anti-cheat signals across all sessions.</p>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[500px] rounded-2xl border border-stone-100 bg-stone-50 p-4 space-y-3">
          {violations.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-muted">No violations logged yet.</p>
            </div>
          ) : (
            <>

          {violations.map((violation) => (
            <div key={violation.id} className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <StatusBadge
                  label={violation.type}
                  tone={
                    violation.severity === "critical"
                      ? "danger"
                      : violation.severity === "warning"
                        ? "warning"
                        : "info"
                  }
                />
                <span className="text-xs text-muted">{new Date(violation.detectedAt).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-xs text-muted">{violation.sessionId}</p>
            </div>
            ))}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
