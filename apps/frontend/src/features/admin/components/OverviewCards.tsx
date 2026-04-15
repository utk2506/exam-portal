import { useEffect, useRef, useState } from "react";
import type { AnalyticsOverviewDto, MonitoringCandidateRow } from "@exam-platform/shared";
import { Card } from "../../../components/ui/Card";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = Date.now();
    const duration = 800;
    const from = 0;
    const to = value;

    ref.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress >= 1 && ref.current) {
        clearInterval(ref.current);
      }
    }, 16);

    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [value]);

  return <>{display}</>;
}

interface KpiCardProps {
  label: string;
  value: number | string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  color: "teal" | "sky" | "amber" | "rose" | "violet" | "emerald";
  suffix?: string;
  animate?: boolean;
}

const colorMap = {
  teal:    { bg: "from-teal-500 to-teal-700",   text: "text-teal-100",   val: "text-white", label: "text-teal-200" },
  sky:     { bg: "from-sky-500 to-sky-700",     text: "text-sky-100",   val: "text-white", label: "text-sky-200" },
  amber:   { bg: "from-amber-500 to-amber-700", text: "text-amber-100", val: "text-white", label: "text-amber-200" },
  rose:    { bg: "from-rose-500 to-rose-700",   text: "text-rose-100",  val: "text-white", label: "text-rose-200" },
  violet:  { bg: "from-violet-500 to-violet-700", text: "text-violet-100", val: "text-white", label: "text-violet-200" },
  emerald: { bg: "from-emerald-500 to-emerald-700", text: "text-emerald-100", val: "text-white", label: "text-emerald-200" },
};

function KpiCard({ label, value, trend, trendLabel, color, suffix = "", animate = true }: KpiCardProps) {
  const c = colorMap[color];
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const trendColor = trend === "up" ? "text-green-200" : trend === "down" ? "text-red-200" : "text-white/60";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.bg} p-5 shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl`}
    >
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-6 h-28 w-28 rounded-full bg-white/5" />

      <p className={`relative text-xs font-semibold uppercase tracking-[0.18em] ${c.label}`}>{label}</p>
      <p className={`relative mt-2 font-display text-4xl font-bold ${c.val}`}>
        {animate && typeof value === "number" ? <AnimatedNumber value={value} /> : value}
        {suffix}
      </p>
      {trendLabel && (
        <p className={`relative mt-2 text-xs font-medium ${trendColor}`}>
          {trendIcon} {trendLabel}
        </p>
      )}
    </div>
  );
}

export function OverviewCards({
  overview,
  sessions,
}: {
  overview?: AnalyticsOverviewDto;
  sessions?: MonitoringCandidateRow[];
}) {
  const total = (overview?.activeSessions ?? 0) + (overview?.submittedSessions ?? 0);
  const submitted = overview?.submittedSessions ?? 0;
  const active = overview?.activeSessions ?? 0;
  const completionRate = total > 0 ? Math.round((submitted / total) * 100) : 0;

  const stopped = sessions?.filter((s) => s.session.status === "stopped" || s.session.status === "expired").length ?? 0;
  const dropoutRate = total > 0 ? Math.round((stopped / total) * 100) : 0;

  const violations = overview?.violationCount ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <KpiCard
        label="Total Candidates"
        value={total}
        color="teal"
        trendLabel={`${active} currently active`}
        trend="neutral"
      />
      <KpiCard
        label="Active Now"
        value={active}
        color="sky"
        trendLabel={active > 0 ? "Live exam session" : "No active sessions"}
        trend={active > 0 ? "up" : "neutral"}
      />
      <KpiCard
        label="Completion Rate"
        value={completionRate}
        suffix="%"
        color="emerald"
        trendLabel={`${submitted} submitted`}
        trend={completionRate >= 50 ? "up" : "down"}
      />
      <KpiCard
        label="Average Score"
        value={overview?.averageScore?.toFixed(1) ?? "0.0"}
        color="violet"
        trendLabel="Across all submissions"
        trend="neutral"
        animate={false}
      />
      <KpiCard
        label="Violations"
        value={violations}
        color="amber"
        trendLabel={violations > 0 ? "Requires attention" : "All clear"}
        trend={violations > 5 ? "down" : "neutral"}
      />
      <KpiCard
        label="Dropout Rate"
        value={dropoutRate}
        suffix="%"
        color="rose"
        trendLabel={`${stopped} exited early`}
        trend={dropoutRate > 20 ? "down" : "neutral"}
      />
    </div>
  );
}
