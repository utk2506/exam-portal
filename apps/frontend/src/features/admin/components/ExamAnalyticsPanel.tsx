import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { Card } from "../../../components/ui/Card";

interface ExamAnalyticsData {
  examId: string;
  title: string;
  status: string;
  submittedCount: number;
  averageScore: number;
  questionStats: Array<{
    questionId: string;
    type: string;
    sortOrder: number;
    attempts: number;
    correctCount: number;
    accuracy: number | null;
  }>;
}

function BarChart({
  label,
  value,
  max,
  color = "teal"
}: {
  label: string;
  value: number;
  max: number;
  color?: "teal" | "rose" | "sky" | "amber";
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barColors = {
    teal: "bg-teal-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
    amber: "bg-amber-500"
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="truncate pr-2 font-medium text-ink">{label}</span>
        <span className="shrink-0 font-mono">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barColors[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ExamAnalyticsPanel({ examId }: { examId: string }) {
  const analyticsQuery = useQuery({
    queryKey: ["exam-analytics", examId],
    queryFn: () => apiClient.get<{ analytics: ExamAnalyticsData | null }>(`/admin/analytics/exams/${examId}`),
    enabled: Boolean(examId)
  });

  const data = analyticsQuery.data?.analytics;

  if (analyticsQuery.isLoading) {
    return (
      <Card className="space-y-3">
        <p className="text-sm text-muted">Loading analytics…</p>
      </Card>
    );
  }

  if (!data || data.submittedCount === 0) {
    return (
      <Card className="space-y-3">
        <h3 className="font-display text-2xl text-ink">Exam Analytics</h3>
        <p className="text-sm text-muted">No completed submissions yet for this exam.</p>
        <div className="min-h-96 rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <p className="text-center text-sm text-muted py-8">Analytics will appear here once students submit exams</p>
        </div>
      </Card>
    );
  }

  const mcqStats = data.questionStats.filter((q) => q.type === "mcq");
  const maxAttempts = Math.max(...data.questionStats.map((q) => q.attempts), 1);

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-display text-2xl text-ink">Exam Analytics</h3>
        <p className="text-sm text-muted">Score and accuracy breakdown for {data.title}.</p>
      </div>

      {/* Scrollable analytics area */}
      <div className="max-h-[600px] overflow-y-auto rounded-2xl border border-stone-100 bg-white p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Submissions</p>
          <p className="mt-2 font-display text-4xl text-ink">{data.submittedCount}</p>
        </div>
        <div className="rounded-2xl bg-teal-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Average Score</p>
          <p className="mt-2 font-display text-4xl text-teal-800">{data.averageScore.toFixed(1)}</p>
        </div>
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">MCQ Questions</p>
          <p className="mt-2 font-display text-4xl text-ink">{mcqStats.length}</p>
        </div>
      </div>

      {/* MCQ accuracy per question */}
      {mcqStats.length > 0 && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              MCQ Accuracy per Question
            </p>
            <p className="mt-1 text-xs text-muted">
              Bar length = correct answers out of total attempts
            </p>
          </div>
          <div className="space-y-3">
            {mcqStats.map((q, idx) => (
              <BarChart
                key={q.questionId}
                label={`Q${q.sortOrder} — ${q.correctCount}/${q.attempts} correct`}
                value={q.correctCount}
                max={q.attempts || 1}
                color={
                  (q.accuracy ?? 0) >= 0.6
                    ? "teal"
                    : (q.accuracy ?? 0) >= 0.35
                    ? "amber"
                    : "rose"
                }
              />
            ))}
          </div>
        </div>
      )}

        {/* Attempts per question */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Attempts per Question
          </p>
          <div className="space-y-3">
            {data.questionStats.map((q) => (
              <BarChart
                key={q.questionId}
                label={`Q${q.sortOrder} (${q.type})`}
                value={q.attempts}
                max={maxAttempts}
                color="sky"
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
