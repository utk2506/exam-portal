import type { MonitoringCandidateRow } from "@exam-platform/shared";
import { Card } from "../../../components/ui/Card";

interface Props {
  sessions: MonitoringCandidateRow[];
  resultsMap: Record<string, { totalScore?: number; mcqScore?: number; subjectiveScore?: number }>;
  totalMarks?: number;
}

const medals = ["🥇", "🥈", "🥉"];

export function LeaderboardPanel({ sessions, resultsMap, totalMarks }: Props) {
  const submitted = sessions.filter(
    (s) => s.session.status === "submitted" || s.session.status === "expired"
  );

  const ranked = [...submitted]
    .map((s) => ({
      session: s.session,
      score: resultsMap[s.session.id]?.totalScore ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (ranked.length === 0) {
    return (
      <Card className="space-y-4">
        <div>
          <h3 className="font-display text-2xl text-ink">Leaderboard</h3>
          <p className="text-sm text-muted">Rankings will appear once results are available.</p>
        </div>
        <div className="flex h-40 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50">
          <p className="text-sm text-muted">No submissions yet</p>
        </div>
      </Card>
    );
  }

  const maxScore = ranked[0]?.score ?? 1;

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-display text-2xl text-ink">Leaderboard</h3>
        <p className="text-sm text-muted">Top {ranked.length} performers ranked by total score.</p>
      </div>

      <div className="space-y-2">
        {ranked.map((entry, idx) => {
          const pct = maxScore > 0 ? Math.round((entry.score / maxScore) * 100) : 0;
          const isTop3 = idx < 3;
          const totalPct = totalMarks && totalMarks > 0
            ? Math.round((entry.score / totalMarks) * 100)
            : null;

          return (
            <div
              key={entry.session.id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                isTop3
                  ? "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100"
                  : "bg-stone-50 border border-stone-100"
              }`}
            >
              {/* Rank */}
              <div className="w-8 shrink-0 text-center">
                {idx < 3 ? (
                  <span className="text-xl">{medals[idx]}</span>
                ) : (
                  <span className="text-sm font-bold text-muted">#{idx + 1}</span>
                )}
              </div>

              {/* Name */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{entry.session.name}</p>
                <p className="truncate text-xs text-muted">{entry.session.candidateId}</p>
              </div>

              {/* Progress bar */}
              <div className="hidden w-24 sm:block">
                <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isTop3 ? "bg-amber-500" : "bg-teal-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className={`text-lg font-bold ${isTop3 ? "text-amber-700" : "text-ink"}`}>
                  {entry.score}
                </p>
                {totalPct !== null && (
                  <p className="text-xs text-muted">{totalPct}%</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
