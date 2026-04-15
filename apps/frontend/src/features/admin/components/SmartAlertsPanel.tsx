import { useMemo } from "react";
import type { MonitoringCandidateRow, ViolationDto } from "@exam-platform/shared";
import { Card } from "../../../components/ui/Card";

interface Props {
  sessions: MonitoringCandidateRow[];
  violations: ViolationDto[];
}

interface AlertItem {
  icon: string;
  title: string;
  count: number;
  tone: "danger" | "warning" | "info";
}

export function SmartAlertsPanel({ sessions, violations }: Props) {
  const alerts = useMemo((): AlertItem[] => {
    const list: AlertItem[] = [];

    const disconnected = sessions.filter((s) => {
      if (s.session.status !== "in_progress") return false;
      const last = (s.session as any).lastHeartbeatAt;
      if (!last) return false;
      return Date.now() - new Date(last).getTime() > 30_000;
    }).length;

    if (disconnected > 0) {
      list.push({ icon: "📡", title: "candidates lost connection", count: disconnected, tone: "danger" });
    }

    const ipChanges = violations.filter((v) => v.type === "ip_change").length;
    if (ipChanges > 0) {
      list.push({ icon: "🌐", title: "IP changes detected", count: ipChanges, tone: "danger" });
    }

    const tabSwitches = violations.filter((v) => v.type === "tab_switch").length;
    if (tabSwitches > 0) {
      list.push({ icon: "🔀", title: "tab switch events", count: tabSwitches, tone: "warning" });
    }

    const aiFlags = violations.filter((v) => v.type === "ai_proctor" || v.type === "face_not_detected").length;
    if (aiFlags > 0) {
      list.push({ icon: "🤖", title: "AI proctoring flags", count: aiFlags, tone: "warning" });
    }

    const malpractice = violations.filter((v) => v.type === "malpractice").length;
    if (malpractice > 0) {
      list.push({ icon: "⛔", title: "malpractice events", count: malpractice, tone: "danger" });
    }

    const highWarning = sessions.filter((s) => s.session.warningCount >= 2).length;
    if (highWarning > 0) {
      list.push({ icon: "⚠️", title: "candidates with 2+ warnings", count: highWarning, tone: "warning" });
    }

    return list;
  }, [sessions, violations]);

  const toneMap = {
    danger:  { card: "border-rose-200 bg-rose-50",   icon: "bg-rose-100",   text: "text-rose-800",   count: "text-rose-700" },
    warning: { card: "border-amber-200 bg-amber-50", icon: "bg-amber-100", text: "text-amber-800", count: "text-amber-700" },
    info:    { card: "border-sky-200 bg-sky-50",     icon: "bg-sky-100",   text: "text-sky-800",   count: "text-sky-700" },
  };

  if (alerts.length === 0) return null;

  return (
    <Card className="space-y-4 border-l-4 border-l-rose-400">
      <div>
        <h3 className="font-display text-2xl text-ink">🚨 Smart Alerts</h3>
        <p className="text-sm text-muted">{alerts.length} issue{alerts.length > 1 ? "s" : ""} require your attention.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {alerts.map((alert, idx) => {
          const t = toneMap[alert.tone];
          return (
            <div
              key={idx}
              className={`flex items-center gap-4 rounded-2xl border px-4 py-4 ${t.card}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${t.icon}`}>
                {alert.icon}
              </div>
              <div>
                <p className={`text-2xl font-bold ${t.count}`}>{alert.count}</p>
                <p className={`text-xs font-medium ${t.text}`}>{alert.title}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
