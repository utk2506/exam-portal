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
import { Card } from "../../../components/ui/Card";

interface Props {
  resultsMap: Record<string, { totalScore?: number }>;
  totalMarks: number;
}

export function ScoreDistributionChart({ resultsMap, totalMarks }: Props) {
  const scores = Object.values(resultsMap)
    .map((r) => r?.totalScore ?? 0)
    .filter((s) => s > 0);

  if (scores.length === 0) {
    return (
      <Card className="space-y-4">
        <div>
          <h3 className="font-display text-2xl text-ink">Score Distribution</h3>
          <p className="text-sm text-muted">No submitted results yet.</p>
        </div>
        <div className="flex h-48 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50">
          <p className="text-sm text-muted">Distribution will appear after first submission</p>
        </div>
      </Card>
    );
  }

  const buckets = [
    { label: "0–20%", min: 0, max: 0.2, color: "#f43f5e" },
    { label: "20–40%", min: 0.2, max: 0.4, color: "#f97316" },
    { label: "40–60%", min: 0.4, max: 0.6, color: "#eab308" },
    { label: "60–80%", min: 0.6, max: 0.8, color: "#22c55e" },
    { label: "80–100%", min: 0.8, max: 1.01, color: "#14b8a6" },
  ];

  const data = buckets.map((b) => ({
    label: b.label,
    count: scores.filter((s) => {
      const pct = s / (totalMarks || 1);
      return pct >= b.min && pct < b.max;
    }).length,
    color: b.color,
  }));

  const passCount = scores.filter((s) => s / (totalMarks || 1) >= 0.4).length;
  const passRate = Math.round((passCount / scores.length) * 100);

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-2xl text-ink">Score Distribution</h3>
          <p className="text-sm text-muted">How candidates are spread across score brackets.</p>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Pass Rate</p>
          <p className="font-display text-2xl text-emerald-800">{passRate}%</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e7e5e4", fontSize: 12 }}
            formatter={(value) => [`${value} candidates`, "Count"]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
