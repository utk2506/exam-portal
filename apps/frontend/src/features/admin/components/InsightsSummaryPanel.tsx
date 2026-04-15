import { useMemo } from "react";
import type { MonitoringCandidateRow, ViolationDto } from "@exam-platform/shared";
import { Card } from "../../../components/ui/Card";

interface Props {
  sessions: MonitoringCandidateRow[];
  violations: ViolationDto[];
  resultsMap: Record<string, { totalScore?: number }>;
  totalMarks?: number;
}

export function InsightsSummaryPanel({ sessions, violations, resultsMap, totalMarks }: Props) {
  const insights = useMemo(() => {
    const list: { icon: string; text: string; tone: "info" | "warning" | "success" }[] = [];

    const submitted = sessions.filter(
      (s) => s.session.status === "submitted" || s.session.status === "expired"
    );
    const active = sessions.filter((s) => s.session.status === "in_progress");
    const scores = submitted.map((s) => resultsMap[s.session.id]?.totalScore ?? 0).filter((s) => s > 0);
    const total = sessions.length;

    // Pass rate
    if (scores.length > 0 && totalMarks) {
      const passed = scores.filter((s) => s / totalMarks >= 0.4).length;
      const passRate = Math.round((passed / scores.length) * 100);
      list.push({
        icon: passRate >= 50 ? "✅" : "⚠️",
        text: `${passRate}% of candidates passed (${passed}/${scores.length} submissions).`,
        tone: passRate >= 50 ? "success" : "warning",
      });
    }

    // Average score
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      list.push({
        icon: "📊",
        text: `Average score is ${avg.toFixed(1)} ${totalMarks ? `/ ${totalMarks}` : "pts"} across ${scores.length} submissions.`,
        tone: "info",
      });
    }

    // Completion rate
    if (total > 0) {
      const compRate = Math.round((submitted.length / total) * 100);
      list.push({
        icon: compRate >= 70 ? "🎯" : "📉",
        text: `Completion rate is ${compRate}% — ${submitted.length} of ${total} registered candidates submitted.`,
        tone: compRate >= 70 ? "success" : "warning",
      });
    }

    // Active right now
    if (active.length > 0) {
      list.push({
        icon: "⏱️",
        text: `${active.length} candidate${active.length > 1 ? "s are" : " is"} currently taking the exam right now.`,
        tone: "info",
      });
    }

    // Violation summary
    if (violations.length > 0) {
      const critical = violations.filter((v) => v.severity === "critical").length;
      const tabSwitches = violations.filter((v) => v.type === "tab_switch").length;
      const ipChanges = violations.filter((v) => v.type === "ip_change").length;

      if (critical > 0) {
        list.push({
          icon: "🚨",
          text: `${critical} critical violation${critical > 1 ? "s" : ""} detected — immediate review recommended.`,
          tone: "warning",
        });
      }
      if (tabSwitches > 0) {
        list.push({
          icon: "🔀",
          text: `${tabSwitches} tab-switch event${tabSwitches > 1 ? "s" : ""} recorded across all sessions.`,
          tone: "warning",
        });
      }
      if (ipChanges > 0) {
        list.push({
          icon: "🌐",
          text: `${ipChanges} IP change${ipChanges > 1 ? "s" : ""} detected — possible proxy or device switch.`,
          tone: "warning",
        });
      }
    } else {
      list.push({
        icon: "🛡️",
        text: "No violations flagged — all candidates are following exam rules.",
        tone: "success",
      });
    }

    // Top performer
    const ranked = submitted
      .map((s) => ({ name: s.session.name, score: resultsMap[s.session.id]?.totalScore ?? 0 }))
      .sort((a, b) => b.score - a.score);
    if (ranked.length > 0 && ranked[0].score > 0) {
      list.push({
        icon: "🏆",
        text: `Top performer: ${ranked[0].name} with ${ranked[0].score} pts${totalMarks ? ` (${Math.round((ranked[0].score / totalMarks) * 100)}%)` : ""}.`,
        tone: "success",
      });
    }

    return list;
  }, [sessions, violations, resultsMap, totalMarks]);

  const toneStyles = {
    info:    "bg-sky-50 border-sky-100 text-sky-900",
    warning: "bg-amber-50 border-amber-100 text-amber-900",
    success: "bg-emerald-50 border-emerald-100 text-emerald-900",
  };

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-display text-2xl text-ink">AI Insights</h3>
        <p className="text-sm text-muted">Auto-generated summary from exam data.</p>
      </div>
      <div className="space-y-2">
        {insights.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl bg-stone-50">
            <p className="text-sm text-muted">Insights will appear once the exam has data.</p>
          </div>
        ) : (
          insights.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${toneStyles[item.tone]}`}
            >
              <span className="mt-0.5 shrink-0 text-base">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
