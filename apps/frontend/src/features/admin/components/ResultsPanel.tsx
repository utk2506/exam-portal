import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MonitoringCandidateRow, ExamSummaryDto } from "@exam-platform/shared";

import { apiClient } from "../../../api/client";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";

interface ResultsTabProps {
  examId: string;
  sessions: MonitoringCandidateRow[];
  exam?: ExamSummaryDto;
}

export function ResultsPanel({ examId, sessions, exam }: ResultsTabProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "analytics" | "details" | "comparison">("summary");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
  const [resultsMap, setResultsMap] = useState<Record<string, any>>({});

  const submitted = useMemo(
    () => sessions.filter((s) => s.session.status === "submitted" || s.session.status === "expired"),
    [sessions]
  );

  // Fetch all results in bulk
  const resultsQuery = useQuery({
    queryKey: ["exam-results", examId],
    queryFn: async () => {
      const results: Record<string, any> = {};
      try {
        await Promise.all(
          submitted.map((session) =>
            apiClient
              .get<{ result: any }>(`/admin/results/sessions/${session.session.id}`)
              .then((res) => {
                results[session.session.id] = res.result;
              })
              .catch(() => {
                // Session result not available yet
              })
          )
        );
      } catch (e) {
        // Handle batch fetch errors
      }
      setResultsMap(results);
      return results;
    },
    enabled: submitted.length > 0,
    refetchInterval: 3000, // Refetch every 3 seconds to get latest results
  });

  // Fetch detailed result for selected session
  const detailQuery = useQuery({
    queryKey: ["session-detail", selectedSessionId],
    queryFn: () =>
      selectedSessionId
        ? apiClient.get<{ session: any }>(`/admin/results/sessions/${selectedSessionId}`)
        : Promise.reject("No session selected"),
    enabled: !!selectedSessionId,
  });

  return (
    <Card className="space-y-6">
      <div>
        <h3 className="font-display text-2xl text-ink">Detailed Results</h3>
        <p className="text-sm text-muted">View, compare, and analyze candidate performance with detailed breakdowns.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-stone-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 font-medium text-sm transition whitespace-nowrap ${
            activeTab === "summary"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-ink"
          }`}
        >
          Results Summary
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 font-medium text-sm transition whitespace-nowrap ${
            activeTab === "analytics"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-ink"
          }`}
        >
          Question Analytics
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 font-medium text-sm transition whitespace-nowrap ${
            activeTab === "details"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-ink"
          }`}
        >
          Candidate Details
        </button>
        {selectedForComparison.size > 0 && (
          <button
            onClick={() => setActiveTab("comparison")}
            className={`px-4 py-2 font-medium text-sm transition whitespace-nowrap ${
              activeTab === "comparison"
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-ink"
            }`}
          >
            Compare ({selectedForComparison.size})
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "summary" && <ResultsSummaryTab sessions={submitted} resultsMap={resultsMap} isLoading={resultsQuery.isLoading} />}
      {activeTab === "analytics" && <QuestionAnalyticsTab examId={examId} sessions={submitted} resultsMap={resultsMap} exam={exam} />}
      {activeTab === "details" && (
        <CandidateDetailsTab
          sessions={submitted}
          selectedSessionId={selectedSessionId}
          onSelectSession={setSelectedSessionId}
          detailData={detailQuery.data}
          isLoading={detailQuery.isLoading}
          selectedForComparison={selectedForComparison}
          onToggleComparison={(id) => {
            const newSet = new Set(selectedForComparison);
            if (newSet.has(id)) {
              newSet.delete(id);
            } else {
              newSet.add(id);
            }
            setSelectedForComparison(newSet);
          }}
          onCompare={() => setActiveTab("comparison")}
          resultsMap={resultsMap}
        />
      )}
      {activeTab === "comparison" && (
        <ComparisonTab
          sessions={submitted}
          selectedForComparison={selectedForComparison}
          onBack={() => {
            setActiveTab("details");
            setSelectedForComparison(new Set());
          }}
          resultsMap={resultsMap}
        />
      )}
    </Card>
  );
}

// Tab 1: Results Summary
function ResultsSummaryTab({ sessions, resultsMap, isLoading }: { sessions: MonitoringCandidateRow[]; resultsMap: Record<string, any>; isLoading: boolean }) {
  const stats = useMemo(() => {
    if (sessions.length === 0) return { avg: 0, highest: 0, lowest: 0 };
    const scores = sessions
      .map((s) => resultsMap[s.session.id]?.totalScore || 0)
      .filter((score) => score > 0);
    return {
      avg: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      highest: Math.max(...scores, 0),
      lowest: Math.min(...scores.filter((s) => s > 0), 999),
    };
  }, [sessions, resultsMap]);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Submissions</p>
          <p className="mt-2 text-2xl font-bold text-ink">{sessions.length}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Avg Score</p>
          <p className="mt-2 text-2xl font-bold text-ink">{stats.avg.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Highest</p>
          <p className="mt-2 text-2xl font-bold text-teal-600">{stats.highest.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Lowest</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{stats.lowest === 999 ? "N/A" : stats.lowest.toFixed(1)}</p>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-ink">Candidate</th>
              <th className="px-4 py-3 text-left font-semibold text-ink">ID</th>
              <th className="px-4 py-3 text-center font-semibold text-ink">MCQ</th>
              <th className="px-4 py-3 text-center font-semibold text-ink">Subj</th>
              <th className="px-4 py-3 text-center font-semibold text-ink">Total</th>
              <th className="px-4 py-3 text-center font-semibold text-ink">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {sessions.map((session) => {
              const result = resultsMap[session.session.id];
              return (
                <tr key={session.session.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{session.session.name}</div>
                    <div className="text-xs text-muted">{session.session.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{session.session.candidateId}</td>
                  <td className="px-4 py-3 text-center font-semibold text-ink">
                    {result?.mcqScore || 0}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-ink">
                    {result?.subjectiveScore || 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-lg text-primary">{result?.totalScore || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge label="Submitted" tone="success" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Tab 2: Question Analytics
function QuestionAnalyticsTab({
  examId,
  sessions,
  resultsMap,
  exam,
}: {
  examId: string;
  sessions: MonitoringCandidateRow[];
  resultsMap: Record<string, any>;
  exam?: ExamSummaryDto;
}) {
  // Fetch full exam details with questions
  const examQuery = useQuery({
    queryKey: ["exam-detail", examId],
    queryFn: () => apiClient.get<{ exam: any }>(`/admin/exams/${examId}`),
    enabled: !!examId,
  });

  // Fetch all session details to get responses
  const [allSessionDetails, setAllSessionDetails] = useState<Record<string, any>>({});

  useQuery({
    queryKey: ["session-details-bulk", examId],
    queryFn: async () => {
      const details: Record<string, any> = {};
      try {
        await Promise.all(
          sessions.map((session) =>
            apiClient
              .get<{ session: any }>(`/admin/results/sessions/${session.session.id}`)
              .then((res) => {
                details[session.session.id] = res.session;
              })
              .catch(() => {})
          )
        );
      } catch (e) {}
      setAllSessionDetails(details);
      return details;
    },
    enabled: sessions.length > 0,
  });

  // Calculate question-wise analytics
  const questionAnalytics = useMemo(() => {
    if (!examQuery.data?.exam?.questions) return [];

    return examQuery.data.exam.questions.map((question: any) => {
      const responses = sessions
        .flatMap((session) => allSessionDetails[session.session.id]?.responses || [])
        .filter((r: any) => r.questionId === question.id);

      if (question.type === "mcq") {
        const correct = responses.filter((r: any) => r.selectedOption === question.correctOption).length;
        const accuracy = responses.length > 0 ? ((correct / responses.length) * 100) : 0;
        return {
          id: question.id,
          type: "mcq",
          sortOrder: question.sortOrder,
          marks: question.marks,
          correct,
          total: responses.length,
          accuracy,
        };
      } else {
        const totalMarks = responses.reduce((sum: number, r: any) => sum + (r.awardedMarks || 0), 0);
        const avgMarks = responses.length > 0 ? totalMarks / responses.length : 0;
        const percentage = question.marks > 0 ? (avgMarks / question.marks) * 100 : 0;
        return {
          id: question.id,
          type: "subjective",
          sortOrder: question.sortOrder,
          marks: question.marks,
          avgMarks,
          total: responses.length,
          percentage,
        };
      }
    });
  }, [examQuery.data?.exam?.questions, sessions, allSessionDetails]);

  if (!examQuery.data?.exam?.questions || questionAnalytics.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            📊 Loading question analytics...
          </p>
        </div>
      </div>
    );
  }

  const totalSubmissions = sessions.length;
  const avgScore = Object.values(resultsMap).reduce((sum: number, r: any) => sum + (r?.totalScore || 0), 0) / totalSubmissions || 0;
  const passRate = (Object.values(resultsMap).filter((r: any) => (r?.totalScore || 0) > (examQuery.data?.exam?.totalMarks || 0) / 2).length / totalSubmissions * 100) || 0;

  return (
    <div className="space-y-6">
      {/* Overall Performance */}
      <div className="space-y-3">
        <h4 className="font-semibold text-ink">📊 Overall Performance</h4>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-stone-200 p-4 bg-stone-50">
            <p className="text-xs text-muted uppercase tracking-wide">Total Responses</p>
            <p className="mt-2 text-2xl font-bold text-ink">{totalSubmissions}</p>
          </div>
          <div className="rounded-lg border border-stone-200 p-4 bg-stone-50">
            <p className="text-xs text-muted uppercase tracking-wide">Avg Score</p>
            <p className="mt-2 text-2xl font-bold text-primary">{avgScore.toFixed(1)}/{examQuery.data?.exam?.totalMarks || "?"}</p>
          </div>
          <div className="rounded-lg border border-stone-200 p-4 bg-stone-50">
            <p className="text-xs text-muted uppercase tracking-wide">Pass Rate</p>
            <p className="mt-2 text-2xl font-bold text-teal-600">{passRate.toFixed(0)}%</p>
          </div>
          <div className="rounded-lg border border-stone-200 p-4 bg-stone-50">
            <p className="text-xs text-muted uppercase tracking-wide">Avg Difficulty</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {(questionAnalytics.reduce((sum: number, q: any) => sum + (q.type === "mcq" ? q.accuracy : q.percentage), 0) / questionAnalytics.length).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Question Performance */}
      <div className="space-y-3">
        <h4 className="font-semibold text-ink">Question Performance</h4>
        {questionAnalytics.map((q: any) => (
          <div key={q.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="font-semibold text-ink">
                  Q{q.sortOrder} {q.type === "mcq" ? "(MCQ)" : "(Subjective)"} • {q.marks} marks
                </h5>
                <p className="text-sm text-muted">
                  {q.type === "mcq"
                    ? `${q.correct}/${q.total} correct`
                    : `${q.total} submission${q.total !== 1 ? "s" : ""} • Avg ${q.avgMarks.toFixed(1)} marks`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{q.type === "mcq" ? q.accuracy.toFixed(0) : q.percentage.toFixed(0)}%</div>
                <div className="w-24 h-2 bg-stone-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${
                      (q.type === "mcq" ? q.accuracy : q.percentage) > 70
                        ? "bg-teal-500"
                        : (q.type === "mcq" ? q.accuracy : q.percentage) > 40
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(q.type === "mcq" ? q.accuracy : q.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tab 3: Candidate Details
interface CandidateDetailsTabProps {
  sessions: MonitoringCandidateRow[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  detailData?: any;
  isLoading: boolean;
  selectedForComparison: Set<string>;
  onToggleComparison: (id: string) => void;
  onCompare: () => void;
  resultsMap: Record<string, any>;
}

function CandidateDetailsTab({
  sessions,
  selectedSessionId,
  onSelectSession,
  detailData,
  isLoading,
  selectedForComparison,
  onToggleComparison,
  onCompare,
  resultsMap,
}: CandidateDetailsTabProps) {
  const selectedSession = sessions.find((s) => s.session.id === selectedSessionId);
  const selectedResult = selectedSessionId ? resultsMap[selectedSessionId] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      {/* Candidate List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-ink">Candidates ({sessions.length})</h4>
          {selectedForComparison.size > 0 && (
            <button
              onClick={onCompare}
              className="text-xs font-medium text-primary hover:underline"
            >
              Compare ({selectedForComparison.size})
            </button>
          )}
        </div>
        <div className="space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3 max-h-[600px] overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.session.id}
              className={`rounded-lg border p-3 transition ${
                selectedSessionId === session.session.id
                  ? "border-primary bg-blue-50"
                  : "border-stone-200 bg-white hover:bg-stone-50"
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedForComparison.has(session.session.id)}
                  onChange={() => onToggleComparison(session.session.id)}
                  className="mt-0.5 rounded cursor-pointer"
                />
                <div
                  onClick={() => onSelectSession(session.session.id)}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium text-sm text-ink truncate">{session.session.name}</div>
                  <div className="text-xs text-muted truncate">{session.session.candidateId}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">{resultsMap[session.session.id]?.totalScore || 0} pts</span>
                    <span className="text-muted">
                      {resultsMap[session.session.id]?.totalScore
                        ? `${((resultsMap[session.session.id].totalScore / 22) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Panel */}
      {selectedSession ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-display text-xl text-ink">{selectedSession.session.name}</h4>
                <p className="text-sm text-muted">
                  {selectedSession.session.candidateId} • {selectedSession.session.email}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Total Score</p>
                <p className="text-3xl font-bold text-primary">{selectedResult?.totalScore || 0}</p>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <p className="text-sm text-muted">MCQ Score</p>
              <p className="mt-2 text-2xl font-bold text-teal-600">{selectedResult?.mcqScore || 0}</p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <p className="text-sm text-muted">Subjective Score</p>
              <p className="mt-2 text-2xl font-bold text-amber-600">{selectedResult?.subjectiveScore || 0}</p>
            </div>
          </div>

          {/* Answer Details */}
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <h5 className="font-semibold text-ink mb-4">Answer Details</h5>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              <div className="text-center py-8 text-muted">
                <p>📋 Answer details will be shown here</p>
                <p className="text-xs mt-2">- MCQ answers with marking</p>
                <p className="text-xs">- Subjective answers with uploaded files</p>
                <p className="text-xs">- Time spent on each question</p>
                <p className="text-xs">- Examiner remarks and grading</p>
              </div>
            </div>
          </div>

          {/* Comparison Section */}
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <h5 className="font-semibold text-ink mb-3">Compare with Other Candidates</h5>
            <p className="text-sm text-muted mb-3">Select candidates from the list (left) to compare scores, answers, and performance metrics.</p>
            <button
              onClick={() => onCompare()}
              disabled={selectedForComparison.size < 2}
              className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-primary hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedForComparison.size < 2 ? `Select ${2 - selectedForComparison.size} more` : `Compare (${selectedForComparison.size})`}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-stone-200 p-12">
          <p className="text-center text-muted">👈 Select a candidate to view details</p>
        </div>
      )}
    </div>
  );
}

// Tab 4: Comparison View
interface ComparisonTabProps {
  sessions: MonitoringCandidateRow[];
  selectedForComparison: Set<string>;
  onBack: () => void;
  resultsMap: Record<string, any>;
}

function ComparisonTab({ sessions, selectedForComparison, onBack, resultsMap }: ComparisonTabProps) {
  const selectedSessions = sessions.filter((s) => selectedForComparison.has(s.session.id));

  if (selectedSessions.length < 2) {
    return (
      <div className="text-center py-12">
        <p className="text-muted mb-4">Please select at least 2 candidates to compare</p>
        <button
          onClick={onBack}
          className="rounded-lg bg-stone-100 px-4 py-2 text-sm font-medium text-ink hover:bg-stone-200 transition"
        >
          Back to Details
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comparison Header */}
      <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4">
        <h4 className="font-display text-xl text-ink">Candidate Comparison ({selectedSessions.length})</h4>
        <button
          onClick={onBack}
          className="text-sm text-primary hover:underline"
        >
          Done Comparing
        </button>
      </div>

      {/* Score Comparison Table */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h5 className="font-semibold text-ink mb-4">📊 Score Comparison</h5>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-ink">Candidate</th>
                <th className="px-4 py-3 text-center font-semibold text-ink">MCQ</th>
                <th className="px-4 py-3 text-center font-semibold text-ink">Subjective</th>
                <th className="px-4 py-3 text-center font-semibold text-ink">Total</th>
                <th className="px-4 py-3 text-center font-semibold text-ink">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {selectedSessions
                .sort((a, b) => (resultsMap[b.session.id]?.totalScore || 0) - (resultsMap[a.session.id]?.totalScore || 0))
                .map((session, idx) => {
                  const result = resultsMap[session.session.id];
                  const percentage = result?.totalScore ? ((result.totalScore / 22) * 100).toFixed(1) : "0";
                  return (
                    <tr key={session.session.id} className={idx === 0 ? "bg-teal-50" : ""}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {idx === 0 && <span className="text-lg">🏆</span>}
                          <div>
                            <div className="font-medium text-ink">{session.session.name}</div>
                            <div className="text-xs text-muted">{session.session.candidateId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{resultsMap[session.session.id]?.mcqScore || 0}</td>
                      <td className="px-4 py-3 text-center font-semibold">{resultsMap[session.session.id]?.subjectiveScore || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block rounded-lg bg-blue-50 px-3 py-1 font-bold text-primary">
                          {resultsMap[session.session.id]?.totalScore || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 h-2 bg-stone-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${idx === 0 ? "bg-teal-500" : "bg-primary"}`}
                              style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold w-12 text-right">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Top Performer</p>
          <p className="mt-2 text-sm font-bold text-ink">
            {selectedSessions.reduce((max, s) => (resultsMap[s.session.id]?.totalScore || 0) > (resultsMap[max.session.id]?.totalScore || 0) ? s : max).session.name.split(" ")[0]}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Highest Score</p>
          <p className="mt-2 text-lg font-bold text-teal-600">
            {Math.max(...selectedSessions.map((s) => resultsMap[s.session.id]?.totalScore || 0)).toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Score Difference</p>
          <p className="mt-2 text-lg font-bold text-amber-600">
            {(Math.max(...selectedSessions.map((s) => resultsMap[s.session.id]?.totalScore || 0)) -
              Math.min(...selectedSessions.map((s) => resultsMap[s.session.id]?.totalScore || 0))).toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Average Score</p>
          <p className="mt-2 text-lg font-bold text-primary">
            {(selectedSessions.reduce((sum, s) => sum + (resultsMap[s.session.id]?.totalScore || 0), 0) / selectedSessions.length).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Category Performance */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h6 className="font-semibold text-ink mb-3">MCQ Performance</h6>
          <div className="space-y-2 text-sm">
            {selectedSessions
              .sort((a, b) => (resultsMap[b.session.id]?.mcqScore || 0) - (resultsMap[a.session.id]?.mcqScore || 0))
              .map((s) => (
                <div key={s.session.id} className="flex items-center justify-between">
                  <span className="text-muted truncate">{s.session.name.split(" ")[0]}</span>
                  <span className="font-semibold text-teal-600">{resultsMap[s.session.id]?.mcqScore || 0}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h6 className="font-semibold text-ink mb-3">Subjective Performance</h6>
          <div className="space-y-2 text-sm">
            {selectedSessions
              .sort((a, b) => (resultsMap[b.session.id]?.subjectiveScore || 0) - (resultsMap[a.session.id]?.subjectiveScore || 0))
              .map((s) => (
                <div key={s.session.id} className="flex items-center justify-between">
                  <span className="text-muted truncate">{s.session.name.split(" ")[0]}</span>
                  <span className="font-semibold text-amber-600">{resultsMap[s.session.id]?.subjectiveScore || 0}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          ℹ️ <strong>Comparison Insights:</strong> Use these metrics to identify top performers, analyze performance gaps, and provide targeted feedback. The score difference and average metrics help identify the overall performance spread among selected candidates.
        </p>
      </div>
    </div>
  );
}
