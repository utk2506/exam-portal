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

export function ExamFunnelChart({ sessions }: Props) {
  const registered = sessions.length;
  const started = sessions.filter((s) =>
    ["in_progress", "submitted", "expired", "stopped"].includes(s.session.status)
  ).length;
  const submitted = sessions.filter((s) =>
    ["submitted", "expired"].includes(s.session.status)
  ).length;

  const data = [
    { stage: "Registered", count: registered, color: "#6366f1" },
    { stage: "Started", count: started, color: "#0ea5e9" },
    { stage: "Submitted", count: submitted, color: "#14b8a6" },
  ];

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-display text-2xl text-ink">Exam Funnel</h3>
        <p className="text-sm text-muted">Candidate pipeline from registration to submission.</p>
      </div>

      {/* Visual funnel steps */}
      <div className="space-y-2">
        {data.map((item) => {
          const pct = registered > 0 ? Math.round((item.count / registered) * 100) : 0;
          return (
            <div key={item.stage} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-ink">{item.stage}</span>
                <span className="text-muted">{item.count} ({pct}%)</span>
              </div>
              <div className="h-8 overflow-hidden rounded-lg bg-stone-100">
                <div
                  className="flex h-full items-center justify-center rounded-lg text-xs font-semibold text-white transition-all duration-700"
                  style={{ backgroundColor: item.color, width: `${pct}%` }}
                >
                  {item.count}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
          <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e7e5e4", fontSize: 12 }}
            formatter={(value) => [`${value} candidates`, ""]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
