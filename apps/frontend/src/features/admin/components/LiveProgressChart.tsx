import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { MonitoringCandidateRow } from "@exam-platform/shared";
import { Card } from "../../../components/ui/Card";

interface Props {
  sessions: MonitoringCandidateRow[];
}

export function LiveProgressChart({ sessions }: Props) {
  const activeSessions = sessions.filter((s) => s.session.status === "in_progress");

  if (activeSessions.length === 0) {
    return (
      <Card className="space-y-4">
        <div>
          <h3 className="font-display text-2xl text-ink">Live Exam Progress</h3>
          <p className="text-sm text-muted">No active candidates right now.</p>
        </div>
        <div className="flex h-40 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50">
          <p className="text-sm text-muted">Chart will appear when the exam is live</p>
        </div>
      </Card>
    );
  }

  // Count candidates on each question
  const questionCounts: Record<string, number> = {};
  for (const session of activeSessions) {
    const qId = (session.session as any).currentQuestionId ?? "Unknown";
    questionCounts[qId] = (questionCounts[qId] ?? 0) + 1;
  }

  const chartData = Object.entries(questionCounts)
    .map(([questionId, count], idx) => ({
      name: `Q${idx + 1}`,
      questionId,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const COLORS = ["#14b8a6", "#6366f1", "#f59e0b", "#0ea5e9", "#ec4899", "#22c55e"];

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-2xl text-ink">Live Exam Progress</h3>
          <p className="text-sm text-muted">
            Where are the {activeSessions.length} active candidates right now?
          </p>
        </div>
        <div className="rounded-xl bg-sky-50 px-3 py-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Active</p>
          <p className="font-display text-2xl text-sky-800">{activeSessions.length}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={30} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e7e5e4", fontSize: 12 }}
            formatter={(value) => [`${value} candidates`, "At this question"]}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={32}>
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
