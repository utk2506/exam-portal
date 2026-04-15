import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { Card } from "../../../components/ui/Card";

interface Props {
  examId: string;
}

export function QuestionDifficultyChart({ examId }: Props) {
  const analyticsQuery = useQuery({
    queryKey: ["exam-analytics", examId],
    queryFn: () =>
      apiClient.get<{ analytics: any }>(`/admin/analytics/exams/${examId}`),
    enabled: Boolean(examId),
  });

  const data = analyticsQuery.data?.analytics;

  if (!data || data.submittedCount === 0) {
    return (
      <Card className="space-y-4">
        <div>
          <h3 className="font-display text-2xl text-ink">Question Difficulty</h3>
          <p className="text-sm text-muted">No submissions yet.</p>
        </div>
        <div className="flex h-48 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50">
          <p className="text-sm text-muted">Difficulty chart will appear after first submission</p>
        </div>
      </Card>
    );
  }

  const mcqStats = (data.questionStats ?? []).filter((q: any) => q.type === "mcq");

  const chartData = mcqStats.map((q: any) => ({
    name: `Q${q.sortOrder}`,
    accuracy: Math.round((q.accuracy ?? 0) * 100),
  }));

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-2xl text-ink">Question Difficulty</h3>
          <p className="text-sm text-muted">Correct-answer rate per MCQ question.</p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded bg-teal-500" /> Easy (&gt;60%)</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded bg-amber-500" /> Medium</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded bg-rose-500" /> Hard (&lt;30%)</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e7e5e4", fontSize: 12 }}
            formatter={(value) => [`${value}%`, "Correct Rate"]}
          />
          <ReferenceLine y={60} stroke="#14b8a6" strokeDasharray="4 4" strokeWidth={1.5} />
          <ReferenceLine y={30} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={1.5} />
          <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {chartData.map((entry: any, index: number) => (
              <Cell
                key={index}
                fill={
                  entry.accuracy >= 60
                    ? "#14b8a6"
                    : entry.accuracy >= 30
                    ? "#f59e0b"
                    : "#f43f5e"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
