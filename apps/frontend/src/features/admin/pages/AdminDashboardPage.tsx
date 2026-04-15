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
  ViolationDto
} from "@exam-platform/shared";

import { apiClient, API_BASE } from "../../../api/client";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Logo } from "../../../components/ui/Logo";
import { ExamManager } from "../components/ExamManager";
import { ExamAnalyticsPanel } from "../components/ExamAnalyticsPanel";
import { MonitoringPanel } from "../components/MonitoringPanel";
import { OverviewCards } from "../components/OverviewCards";
import { PendingReviewsPanel } from "../components/PendingReviewsPanel";
import { ResultsPanel } from "../components/ResultsPanel";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => apiClient.get<{ admin: AdminProfile }>("/auth/me"),
    retry: false
  });

  const overviewQuery = useQuery({
    queryKey: ["overview"],
    queryFn: () => apiClient.get<{ overview: AnalyticsOverviewDto }>("/admin/analytics/overview"),
    enabled: meQuery.isSuccess
  });

  const examsQuery = useQuery({
    queryKey: ["admin-exams"],
    queryFn: () => apiClient.get<{ exams: ExamSummaryDto[] }>("/admin/exams"),
    enabled: meQuery.isSuccess
  });

  const monitoringQuery = useQuery({
    queryKey: ["monitoring-sessions"],
    queryFn: () => apiClient.get<{ sessions: MonitoringCandidateRow[] }>("/admin/monitoring/sessions"),
    enabled: meQuery.isSuccess
  });

  const violationsQuery = useQuery({
    queryKey: ["monitoring-violations"],
    queryFn: () => apiClient.get<{ violations: ViolationDto[] }>("/admin/monitoring/violations"),
    enabled: meQuery.isSuccess
  });

  const pendingReviewsQuery = useQuery({
    queryKey: ["pending-reviews"],
    queryFn: () => apiClient.get<{ pending: PendingSubjectiveReviewDto[] }>("/admin/results/pending-subjective"),
    enabled: meQuery.isSuccess
  });

  useEffect(() => {
    if (meQuery.isError) {
      navigate("/admin/login");
    }
  }, [meQuery.isError, navigate]);

  // Handle bfcache: when admin presses Back after logout, force auth re-check
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        void meQuery.refetch();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [meQuery]);



  useEffect(() => {
    if (!meQuery.isSuccess) {
      return;
    }

    const socket = io(API_BASE.replace(/\/api$/, ""), {
      withCredentials: true
    });
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

    return () => {
      socket.disconnect();
    };
  }, [meQuery.isSuccess, queryClient]);

  useEffect(() => {
    if (!selectedExamId && examsQuery.data?.exams.length) {
      setSelectedExamId(examsQuery.data.exams[0].id);
    }
  }, [examsQuery.data?.exams, selectedExamId]);

  const exams = useMemo(() => examsQuery.data?.exams ?? [], [examsQuery.data?.exams]);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Chimera Fresher's Drive 2026</p>
            <h1 className="font-display text-4xl text-ink">
              Welcome back, {meQuery.data?.admin.displayName ?? "Admin"}
            </h1>
            <p className="text-sm text-muted">Create exams, watch live sessions, grade subjective answers, and export LAN-only results.</p>
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

        <OverviewCards overview={overviewQuery.data?.overview} />

        <ExamManager exams={exams} selectedExamId={selectedExamId} onSelectExam={setSelectedExamId} />

        {selectedExamId ? <ExamAnalyticsPanel examId={selectedExamId} /> : null}

        {selectedExamId ? (
          <ResultsPanel
            examId={selectedExamId}
            sessions={monitoringQuery.data?.sessions ?? []}
            exam={exams.find((e) => e.id === selectedExamId)}
          />
        ) : null}

        <MonitoringPanel
          sessions={monitoringQuery.data?.sessions ?? []}
          violations={violationsQuery.data?.violations ?? []}
        />

        <PendingReviewsPanel entries={pendingReviewsQuery.data?.pending ?? []} />
      </div>
    </main>
  );
}
