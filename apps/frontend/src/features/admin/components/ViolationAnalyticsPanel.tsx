import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import type { ViolationDto } from "@exam-platform/shared";
import { Card } from "../../../components/ui/Card";

interface Props {
  violations: ViolationDto[];
}

const VIOLATION_COLORS: Record<string, string> = {
  tab_switch: "#f59e0b",
  malpractice: "#f43f5e",
  ip_change: "#8b5cf6",
  heartbeat_gap: "#64748b",
  ai_proctor: "#0ea5e9",
  face_not_detected: "#ec4899",
  window_left: "#d946ef",
  window_switch_attempt: "#f97316",
  developer_tools_attempt: "#ef4444",
  right_click_attempt: "#84cc16",
  view_source_attempt: "#14b8a6",
  keyboard_copy_shortcut: "#3b82f6",
  keyboard_cut_shortcut: "#6366f1",
  keyboard_paste_shortcut: "#a855f7",
  keyboard_selectall_shortcut: "#eab308",
};

const FALLBACK_COLOR = "#a8a29e";

function getColor(type: string): string {
  return VIOLATION_COLORS[type] ?? FALLBACK_COLOR;
}

export function ViolationAnalyticsPanel({ violations }: Props) {
  if (violations.length === 0) {
    return (
      <Card className="space-y-4">
        <div>
          <h3 className="font-display text-2xl text-ink">Violation Analytics</h3>
          <p className="text-sm text-muted">No violations recorded yet — all clear!</p>
        </div>
        <div className="flex h-40 items-center justify-center rounded-2xl bg-emerald-50">
          <p className="text-2xl">✅ Zero violations</p>
        </div>
      </Card>
    );
  }

  // --- Pie chart: type breakdown ---
  const typeCounts: Record<string, number> = {};
  for (const v of violations) {
    typeCounts[v.type] = (typeCounts[v.type] ?? 0) + 1;
  }
  const pieData = Object.entries(typeCounts).map(([type, count]) => ({
    name: type.replace(/_/g, " "),
    value: count,
    type,
  }));

  // --- Bar chart: violations per hour ---
  const hourCounts: Record<number, number> = {};
  for (const v of violations) {
    const hour = new Date(v.detectedAt).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }
  const hours = Object.keys(hourCounts).map(Number).sort((a, b) => a - b);
  const timelineData = hours.map((h) => ({
    time: `${String(h).padStart(2, "0")}:00`,
    count: hourCounts[h],
  }));

  return (
    <Card className="space-y-6">
      <div>
        <h3 className="font-display text-2xl text-ink">Violation Analytics</h3>
        <p className="text-sm text-muted">
          {violations.length} total violations detected. Breakdown by type and time.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie chart */}
        <div>
          <p className="mb-3 text-sm font-semibold text-ink">By Violation Type</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={getColor(entry.type)} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e7e5e4", fontSize: 12 }}
                formatter={(value, name) => [`${value}`, `${name}`]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline bar chart */}
        <div>
          <p className="mb-3 text-sm font-semibold text-ink">Violations Over Time</p>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={timelineData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e7e5e4", fontSize: 12 }}
                  formatter={(value) => [`${value} violations`, ""]}
                />
                <Bar dataKey="count" fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border border-stone-100 bg-stone-50">
              <p className="text-sm text-muted">No time data available</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
