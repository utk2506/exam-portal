import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { Card } from "../../../components/ui/Card";

interface ExamAnalyticsData {
  examId: string;
  title: string;
  status: string;
  submittedCount: number;
  averageScore: number;
  totalMarks: number;
  questionStats: Array<{
    questionId: string;
    type: string;
    sortOrder: number;
    marks: number;
    attempts: number;
    correctCount?: number;
    accuracy?: number | null;
    marksAwarded?: number;
    averageMarksAwarded?: number;
    totalMarksAwarded?: number;
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
        <span className="shrink-0 font-mono">{value.toFixed(1)}</span>
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
  const subjectiveStats = data.questionStats.filter((q) => q.type === "subjective");

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-display text-2xl text-ink">Exam Analytics</h3>
        <p className="text-sm text-muted">Comprehensive results and performance breakdown for {data.title}.</p>
      </div>

      {/* Scrollable analytics area */}
      <div className="max-h-[700px] overflow-y-auto rounded-2xl border border-stone-100 bg-white p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Submissions</p>
            <p className="mt-2 font-display text-4xl text-ink">{data.submittedCount}</p>
          </div>
          <div className="rounded-2xl bg-teal-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Average Score</p>
            <p className="mt-2 font-display text-4xl text-teal-800">{data.averageScore.toFixed(1)}/{data.totalMarks}</p>
          </div>
          <div className="rounded-2xl bg-sky-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">MCQ Qs</p>
            <p className="mt-2 font-display text-4xl text-sky-800">{mcqStats.length}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Subjective Qs</p>
            <p className="mt-2 font-display text-4xl text-amber-800">{subjectiveStats.length}</p>
          </div>
        </div>

        {/* MCQ Performance */}
        {mcqStats.length > 0 && (
          <div className="space-y-4 border-t border-stone-100 pt-6">
            <div>
              <p className="text-sm font-semibold text-ink">MCQ Questions Performance</p>
              <p className="mt-1 text-xs text-muted">Correct answers and marks earned</p>
            </div>
            <div className="space-y-3">
              {mcqStats.map((q) => {
                const accuracy = q.accuracy ?? 0;
                const accuracyColor =
                  accuracy >= 0.6 ? "teal" : accuracy >= 0.35 ? "amber" : "rose";
                return (
                  <div key={q.questionId} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink">Q{q.sortOrder} • {q.marks} marks</p>
                        <p className="mt-1 text-sm text-muted">
                          {q.correctCount}/{q.attempts} correct • {(accuracy * 100).toFixed(0)}% accuracy
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-ink">{q.marksAwarded}/{q.marks * q.attempts}</p>
                        <p className="text-xs text-muted">marks</p>
                      </div>
                    </div>
                    <BarChart
                      label="Correct Answers"
                      value={q.correctCount ?? 0}
                      max={q.attempts || 1}
                      color={accuracyColor as any}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subjective Performance */}
        {subjectiveStats.length > 0 && (
          <div className="space-y-4 border-t border-stone-100 pt-6">
            <div>
              <p className="text-sm font-semibold text-ink">Subjective Questions Performance</p>
              <p className="mt-1 text-xs text-muted">Average marks awarded by examiner</p>
            </div>
            <div className="space-y-3">
              {subjectiveStats.map((q) => {
                const avgMarks = q.averageMarksAwarded ?? 0;
                const percentage = (avgMarks / q.marks) * 100;
                return (
                  <div key={q.questionId} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink">Q{q.sortOrder} • {q.marks} marks</p>
                        <p className="mt-1 text-sm text-muted">
                          {q.attempts} submission{q.attempts !== 1 ? 's' : ''} • Avg {avgMarks.toFixed(1)}/{q.marks}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-ink">{percentage.toFixed(0)}%</p>
                        <p className="text-xs text-muted">avg</p>
                      </div>
                    </div>
                    <BarChart
                      label="Average Marks Awarded"
                      value={avgMarks}
                      max={q.marks}
                      color={percentage >= 60 ? "teal" : percentage >= 35 ? "amber" : "rose"}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Attempts per question */}
        <div className="space-y-4 border-t border-stone-100 pt-6">
          <p className="text-sm font-semibold text-ink">Total Attempts per Question</p>
          <div className="space-y-3">
            {data.questionStats.map((q) => (
              <BarChart
                key={q.questionId}
                label={`Q${q.sortOrder} (${q.type === "mcq" ? "MCQ" : "Subjective"})`}
                value={q.attempts}
                max={Math.max(...data.questionStats.map((qs) => qs.attempts), 1)}
                color="sky"
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
