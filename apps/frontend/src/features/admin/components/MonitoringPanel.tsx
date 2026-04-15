import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MonitoringCandidateRow, ViolationDto } from "@exam-platform/shared";

import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";

function getRiskLevel(row: MonitoringCandidateRow): "high" | "medium" | "low" {
  if (
    row.session.warningCount >= 2 ||
    row.latestViolation?.severity === "critical" ||
    row.latestViolation?.type === "malpractice" ||
    row.latestViolation?.type === "ip_change"
  )
    return "high";
  if (
    row.session.warningCount === 1 ||
    row.latestViolation?.severity === "warning" ||
    row.activeViolations > 0
  )
    return "medium";
  return "low";
}

const riskStyles = {
  high:   { row: "bg-rose-50 hover:bg-rose-100",   badge: "🔴 High",   badgeClass: "text-rose-700 bg-rose-100 border-rose-200" },
  medium: { row: "bg-amber-50 hover:bg-amber-100", badge: "🟡 Medium", badgeClass: "text-amber-700 bg-amber-100 border-amber-200" },
  low:    { row: "bg-white hover:bg-stone-50",     badge: "🟢 Low",    badgeClass: "text-emerald-700 bg-emerald-100 border-emerald-200" },
};

export function MonitoringPanel({
  sessions,
  violations,
}: {
  sessions: MonitoringCandidateRow[];
  violations: ViolationDto[];
}) {
  const queryClient = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiClient.delete(`/admin/monitoring/sessions/${sessionId}`),
    onSuccess: async () => {
      setConfirmDeleteId(null);
      await queryClient.invalidateQueries({ queryKey: ["monitoring-sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["monitoring-violations"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
      await queryClient.invalidateQueries({ queryKey: ["exam-analytics"] });
    },
  });

  const sortedSessions = [...sessions].sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    return riskOrder[getRiskLevel(a)] - riskOrder[getRiskLevel(b)];
  });

  const sessionMap = new Map(sessions.map((s) => [s.session.id, s.session]));

  return (
    <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
      <Card className="flex flex-col space-y-4">
        <div>
          <h3 className="font-display text-2xl text-ink">Monitoring</h3>
          <p className="text-sm text-muted">
            Track all candidates, warnings, and session health. Sorted by risk level.
          </p>
        </div>
        <div className="flex-1 overflow-auto max-h-[520px] rounded-2xl border border-stone-100">
          {sortedSessions.length === 0 ? (
            <div className="flex h-80 items-center justify-center">
              <p className="text-sm text-muted">No active sessions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-stone-100 text-left text-xs uppercase tracking-[0.14em] text-muted">
                  <tr>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Exam</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3">Warnings</th>
                    <th className="px-4 py-3">Latest Violation</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sortedSessions.map((row) => {
                    const risk = getRiskLevel(row);
                    const s = riskStyles[risk];
                    return (
                      <tr key={row.session.id} className={`transition ${s.row}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">{row.session.name}</div>
                          <div className="text-xs text-muted">{row.session.candidateId}</div>
                          {(row.session as any).ipAddress && (
                            <div className="text-xs text-muted font-mono">
                              {(row.session as any).ipAddress}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{row.examTitle}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={row.session.status}
                            tone={row.session.status === "in_progress" ? "success" : "neutral"}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs font-semibold ${s.badgeClass}`}>
                            {s.badge}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {row.session.warningCount > 0 ? (
                            <span className="text-rose-600">{row.session.warningCount}</span>
                          ) : (
                            <span className="text-muted">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.latestViolation ? (
                            <div className="space-y-1">
                              <StatusBadge
                                label={row.latestViolation.type}
                                tone={
                                  row.latestViolation.severity === "critical"
                                    ? "danger"
                                    : row.latestViolation.severity === "warning"
                                    ? "warning"
                                    : "info"
                                }
                              />
                              <div className="text-xs text-muted">
                                {new Date(row.latestViolation.detectedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted text-xs">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {confirmDeleteId === row.session.id ? (
                            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                              <span className="text-xs text-rose-700 font-medium">Delete?</span>
                              <Button
                                type="button"
                                variant="danger"
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(row.session.id)}
                                className="h-7 px-2 text-xs"
                              >
                                {deleteMutation.isPending ? "..." : "Yes"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setConfirmDeleteId(null)}
                                className="h-7 px-2 text-xs"
                              >
                                No
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card className="flex flex-col space-y-4">
        <div>
          <h3 className="font-display text-2xl text-ink">Recent Violations</h3>
          <p className="text-sm text-muted">Latest anti-cheat signals across all sessions.</p>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[520px] space-y-3 rounded-2xl border border-stone-100 bg-stone-50 p-4">
          {violations.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted">No violations logged yet.</p>
            </div>
          ) : (
            violations.slice(0, 50).map((violation) => (
              <div
                key={violation.id}
                className={`rounded-2xl border px-4 py-3 ${
                  violation.severity === "critical"
                    ? "border-rose-200 bg-rose-50"
                    : violation.severity === "warning"
                    ? "border-amber-200 bg-amber-50"
                    : "border-stone-200 bg-white"
                }`}
              >
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
                  <span className="text-xs text-muted">
                    {new Date(violation.detectedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-2 text-xs truncate">
                  <span className="text-ink font-medium">
                    {sessionMap.get(violation.sessionId)?.name || (violation.metadata as any)?.candidateName || "Unknown Candidate"}
                  </span>
                  {sessionMap.get(violation.sessionId) && (
                    <span className="text-muted ml-1">
                      ({sessionMap.get(violation.sessionId)?.candidateId})
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
