import type { AnalyticsOverviewDto } from "@exam-platform/shared";

import { Card } from "../../../components/ui/Card";

export function OverviewCards({ overview }: { overview?: AnalyticsOverviewDto }) {
  const stats = [
    { label: "Exams", value: overview?.examsCount ?? 0 },
    { label: "Active Sessions", value: overview?.activeSessions ?? 0 },
    { label: "Submitted", value: overview?.submittedSessions ?? 0 },
    { label: "Pending Reviews", value: overview?.pendingSubjectiveReviews ?? 0 },
    { label: "Violations", value: overview?.violationCount ?? 0 },
    { label: "Average Score", value: overview?.averageScore.toFixed(1) ?? "0.0" }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="space-y-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{stat.label}</p>
          <p className="font-display text-4xl text-ink">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}
