import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import type {
  AdminProfile,
  AnalyticsOverviewDto,
  ExamSummaryDto,
  MonitoringCandidateRow,
  PendingSubjectiveReviewDto,
  ViolationDto,
} from "@exam-platform/shared";

import { apiClient, API_BASE } from "../../../api/client";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Logo } from "../../../components/ui/Logo";

// Existing panels
import { ExamManager } from "../components/ExamManager";
import { ExamAnalyticsPanel } from "../components/ExamAnalyticsPanel";
import { PendingReviewsPanel } from "../components/PendingReviewsPanel";
import { ResultsPanel } from "../components/ResultsPanel";

// Enhanced / new panels
import { OverviewCards } from "../components/OverviewCards";
import { MonitoringPanel } from "../components/MonitoringPanel";
import { ScoreDistributionChart } from "../components/ScoreDistributionChart";
import { ExamFunnelChart } from "../components/ExamFunnelChart";
import { QuestionDifficultyChart } from "../components/QuestionDifficultyChart";
import { ViolationAnalyticsPanel } from "../components/ViolationAnalyticsPanel";
import { LiveProgressChart } from "../components/LiveProgressChart";
import { LeaderboardPanel } from "../components/LeaderboardPanel";
import { InsightsSummaryPanel } from "../components/InsightsSummaryPanel";
import { SmartAlertsPanel } from "../components/SmartAlertsPanel";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [resultsMap, setResultsMap] = useState<Record<string, any>>({});

  // ── Auth ──────────────────────────────────────────────────────────────────
  const meQuery = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => apiClient.get<{ admin: AdminProfile }>("/auth/me"),
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError) navigate("/admin/login");
  }, [meQuery.isError, navigate]);

  // bfcache: re-check auth when coming back via browser back button
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void meQuery.refetch();
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [meQuery]);

  // ── Data queries ──────────────────────────────────────────────────────────
  const overviewQuery = useQuery({
    queryKey: ["overview"],
    queryFn: () =>
      apiClient.get<{ overview: AnalyticsOverviewDto }>("/admin/analytics/overview"),
    enabled: meQuery.isSuccess,
  });

  const examsQuery = useQuery({
    queryKey: ["admin-exams"],
    queryFn: () => apiClient.get<{ exams: ExamSummaryDto[] }>("/admin/exams"),
    enabled: meQuery.isSuccess,
  });

  const monitoringQuery = useQuery({
    queryKey: ["monitoring-sessions"],
    queryFn: () =>
      apiClient.get<{ sessions: MonitoringCandidateRow[] }>("/admin/monitoring/sessions"),
    enabled: meQuery.isSuccess,
  });

  const violationsQuery = useQuery({
    queryKey: ["monitoring-violations"],
    queryFn: () =>
      apiClient.get<{ violations: ViolationDto[] }>("/admin/monitoring/violations"),
    enabled: meQuery.isSuccess,
  });

  const pendingReviewsQuery = useQuery({
    queryKey: ["pending-reviews"],
    queryFn: () =>
      apiClient.get<{ pending: PendingSubjectiveReviewDto[] }>(
        "/admin/results/pending-subjective"
      ),
    enabled: meQuery.isSuccess,
  });

  // ── Socket.IO real-time invalidation ────────────────────────────────────
  useEffect(() => {
    if (!meQuery.isSuccess) return;

    const socket = io(API_BASE.replace(/\/api$/, ""), { withCredentials: true });
    socket.emit("join:admin");

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["overview"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
      void queryClient.invalidateQueries({ queryKey: ["monitoring-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["monitoring-violations"] });
      void queryClient.invalidateQueries({ queryKey: ["pending-reviews"] });
    };

    socket.on("exam.started", invalidate);
    socket.on("exam.stopped", invalidate);
    socket.on("session.changed", invalidate);
    socket.on("violation.created", invalidate);
    socket.on("grading.updated", invalidate);
    socket.on("result.finalized", invalidate);

    return () => { socket.disconnect(); };
  }, [meQuery.isSuccess, queryClient]);

  // ── Auto-select first exam ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedExamId && examsQuery.data?.exams.length) {
      setSelectedExamId(examsQuery.data.exams[0].id);
    }
  }, [examsQuery.data?.exams, selectedExamId]);

  // ── Build results map from submitted sessions ────────────────────────────
  useEffect(() => {
    const submitted = (monitoringQuery.data?.sessions ?? []).filter(
      (s) => s.session.status === "submitted" || s.session.status === "expired"
    );
    if (submitted.length === 0) return;

    const map: Record<string, any> = {};
    Promise.all(
      submitted.map((s) =>
        apiClient
          .get<{ result: any }>(`/admin/results/sessions/${s.session.id}`)
          .then((res) => { map[s.session.id] = res.result; })
          .catch(() => {})
      )
    ).then(() => setResultsMap({ ...map }));
  }, [monitoringQuery.data?.sessions]);

  const exams = useMemo(() => examsQuery.data?.exams ?? [], [examsQuery.data?.exams]);
  const sessions = useMemo(
    () => monitoringQuery.data?.sessions ?? [],
    [monitoringQuery.data?.sessions]
  );
  const violations = useMemo(
    () => violationsQuery.data?.violations ?? [],
    [violationsQuery.data?.violations]
  );
  const selectedExam = useMemo(
    () => exams.find((e) => e.id === selectedExamId),
    [exams, selectedExamId]
  );

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Chimera Fresher's Drive 2026
              </p>
              <h1 className="font-display text-4xl text-ink">
                Welcome back, {meQuery.data?.admin.displayName ?? "Admin"}
              </h1>
              <p className="text-sm text-muted">
                Create exams, watch live sessions, grade subjective answers, and export results.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate("/exam")}>
              Candidate View
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={async () => {
                await apiClient.post("/auth/logout");
                navigate("/admin/login");
              }}
            >
              Sign Out
            </Button>
          </div>
        </Card>

        {/* ── Smart Alerts (only shown if there are alerts) ──────────────── */}
        <SmartAlertsPanel sessions={sessions} violations={violations} />

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <OverviewCards overview={overviewQuery.data?.overview} sessions={sessions} />

        {/* ── Row 1: Funnel + Score Distribution ─────────────────────────── */}
        <div className="grid gap-4 xl:grid-cols-2">
          <ExamFunnelChart sessions={sessions} />
          <ScoreDistributionChart
            resultsMap={resultsMap}
            totalMarks={selectedExam?.totalMarks ?? 100}
          />
        </div>

        {/* ── Row 2: Question Difficulty + Live Progress ─────────────────── */}
        {selectedExamId && (
          <div className="grid gap-4 xl:grid-cols-2">
            <QuestionDifficultyChart examId={selectedExamId} />
            <LiveProgressChart sessions={sessions} />
          </div>
        )}

        {/* ── Row 3: Violation Analytics (full width) ─────────────────────── */}
        <ViolationAnalyticsPanel violations={violations} />

        {/* ── Row 4: Leaderboard + AI Insights ───────────────────────────── */}
        <div className="grid gap-4 xl:grid-cols-2">
          <LeaderboardPanel
            sessions={sessions}
            resultsMap={resultsMap}
            totalMarks={selectedExam?.totalMarks}
          />
          <InsightsSummaryPanel
            sessions={sessions}
            violations={violations}
            resultsMap={resultsMap}
            totalMarks={selectedExam?.totalMarks}
          />
        </div>

        {/* ── Exam Manager ────────────────────────────────────────────────── */}
        <ExamManager
          exams={exams}
          selectedExamId={selectedExamId}
          onSelectExam={setSelectedExamId}
        />

        {/* ── Exam Analytics (per exam) ────────────────────────────────────── */}
        {selectedExamId ? <ExamAnalyticsPanel examId={selectedExamId} /> : null}

        {/* ── Results Panel ────────────────────────────────────────────────── */}
        {selectedExamId ? (
          <ResultsPanel
            examId={selectedExamId}
            sessions={sessions}
            exam={selectedExam}
          />
        ) : null}

        {/* ── Enhanced Live Monitoring ─────────────────────────────────────── */}
        <MonitoringPanel sessions={sessions} violations={violations} />

        {/* ── Pending Subjective Reviews ───────────────────────────────────── */}
        <PendingReviewsPanel entries={pendingReviewsQuery.data?.pending ?? []} />

      </div>
    </main>
  );
}
