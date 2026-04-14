import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import type { CandidateRuntimeDto, CandidateRuntimeQuestion, McqOptionKey } from "@exam-platform/shared";

import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { QuestionCard } from "../components/QuestionCard";
import { QuestionNavigator } from "../components/QuestionNavigator";
import { WatermarkOverlay } from "../components/WatermarkOverlay";
import { useNotification } from "../../../components/ViolationNotification";
import { useWebcamProctor } from "../hooks/useWebcamProctor";

interface DraftState {
  selectedOption: McqOptionKey | null;
  subjectiveAnswerHtml: string;
}

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function ExamRuntimePage() {
  const navigate = useNavigate();
  const { sessionId = "" } = useParams();
  const { addNotification } = useNotification();
  const [currentQuestionId, setCurrentQuestionId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const saveTimers = useRef<Record<string, number>>({});


  const runtimeQuery = useQuery({
    queryKey: ["candidate-runtime", sessionId],
    queryFn: () => apiClient.get<CandidateRuntimeDto>(`/candidate-sessions/${sessionId}/runtime`),
    enabled: Boolean(sessionId)
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { questionId: string; selectedOption: McqOptionKey | null; subjectiveAnswerHtml: string | null }) =>
      apiClient.put(`/responses/${sessionId}`, payload)
  });

  const violationMutation = useMutation({
    mutationFn: (payload: { type: string; severity: "info" | "warning" | "critical"; metadata?: Record<string, unknown> }) =>
      apiClient.post("/violations", {
        sessionId,
        type: payload.type,
        severity: payload.severity,
        metadata: payload.metadata ?? {}
      })
  });

  const heartbeatMutation = useMutation({
    mutationFn: (payload: { currentQuestionId: string }) =>
      apiClient.post(`/candidate-sessions/${sessionId}/heartbeat`, {
        sessionId,
        currentQuestionId: payload.currentQuestionId
      })
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (currentQuestionId) {
        await saveCurrentDraft(currentQuestionId);
      }
      return apiClient.post(`/candidate-sessions/${sessionId}/submit`);
    },
    onSuccess: () => {
      navigate(`/exam/${sessionId}/result`, { replace: true });
    }
  });

  async function saveCurrentDraft(questionId: string) {
    const draft = drafts[questionId];
    if (!draft) return;
    await saveMutation.mutateAsync({
      questionId,
      selectedOption: draft.selectedOption,
      subjectiveAnswerHtml: draft.subjectiveAnswerHtml || null
    });
  }

  function goToQuestion(questionId: string) {
    setCurrentQuestionId(questionId);
    setVisited((current) => new Set(current).add(questionId));
  }

  function goToNextQuestion() {
    const questions = runtimeQuery.data?.questions ?? [];
    const currentIndex = questions.findIndex((question) => question.id === currentQuestionId);
    const nextQuestion = questions[currentIndex + 1];
    if (nextQuestion) goToQuestion(nextQuestion.id);
  }

  useEffect(() => {
    if (!runtimeQuery.data) return;

    const responseMap = new Map(runtimeQuery.data.responses.map((response) => [response.questionId, response]));
    setDrafts((current) => {
      if (Object.keys(current).length > 0) return current;
      const nextDrafts: Record<string, DraftState> = {};
      runtimeQuery.data.questions.forEach((question) => {
        const response = responseMap.get(question.id);
        nextDrafts[question.id] = {
          selectedOption: response?.selectedOption ?? null,
          subjectiveAnswerHtml: response?.subjectiveAnswerHtml ?? "<p></p>"
        };
      });
      return nextDrafts;
    });

    setTimeRemaining(runtimeQuery.data.timeRemainingSeconds);

    if (!currentQuestionId && runtimeQuery.data.questions.length > 0) {
      const firstQuestionId = runtimeQuery.data.questions[0].id;
      setCurrentQuestionId(firstQuestionId);
      setVisited(new Set([firstQuestionId]));
    }
  }, [currentQuestionId, runtimeQuery.data]);

  // Countdown timer — only start once we have real data from server
  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining === 0) return; // don't start a 0-second countdown
    const timer = window.setInterval(() => {
      setTimeRemaining((current) => (current === null ? null : Math.max(0, current - 1)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timeRemaining === null]); // only re-run when null→number transition

  // Heartbeat
  useEffect(() => {
    if (!currentQuestionId) return;
    const interval = window.setInterval(() => {
      void heartbeatMutation.mutateAsync({ currentQuestionId });
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [currentQuestionId, heartbeatMutation]);

  // Auto-submit when timer hits 0 — only after timer is initialized from server
  useEffect(() => {
    if (timeRemaining === null || timeRemaining > 0) return;
    if (!submitMutation.isPending && runtimeQuery.isSuccess) {
      void submitMutation.mutateAsync();
    }
  }, [runtimeQuery.isSuccess, submitMutation, timeRemaining]);

  // Cleanup save timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // Redirect to result page if session is already submitted/stopped/expired.
  // This handles: (1) normal navigation after submit, (2) browser Back button,
  // (3) back-forward cache (bfcache) restoration via the pageshow event.
  const sessionStatus = runtimeQuery.data?.session?.status;
  useEffect(() => {
    if (sessionStatus === "submitted" || sessionStatus === "stopped" || sessionStatus === "expired") {
      navigate(`/exam/${sessionId}/result`, { replace: true });
    }
  }, [sessionStatus, sessionId, navigate]);

  // If the runtime query errors (e.g. 409 "already submitted"), redirect to result page.
  useEffect(() => {
    if (runtimeQuery.error) {
      navigate(`/exam/${sessionId}/result`, { replace: true });
    }
  }, [runtimeQuery.error, sessionId, navigate]);

  // Handle bfcache — browser restores page from cache without re-running effects.
  // Force a query refetch so the status check above fires again.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        void runtimeQuery.refetch();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [runtimeQuery]);

  const webcamProctor = useWebcamProctor({
    enabled: runtimeQuery.isSuccess,
    sessionId
  });

  const questions = runtimeQuery.data?.questions ?? [];
  const navigatorResponses = useMemo(
    () =>
      questions.map((question) => {
        const existing = runtimeQuery.data?.responses.find((response) => response.questionId === question.id);
        return {
          questionId: question.id,
          selectedOption: drafts[question.id]?.selectedOption ?? existing?.selectedOption ?? null,
          subjectiveAnswerHtml: drafts[question.id]?.subjectiveAnswerHtml ?? existing?.subjectiveAnswerHtml ?? null,
          savedAt: existing?.savedAt ?? new Date().toISOString(),
          finalSubmitted: existing?.finalSubmitted ?? false
        };
      }),
    [drafts, questions, runtimeQuery.data?.responses]
  );

  const currentQuestion =
    questions.find((question) => question.id === currentQuestionId) ?? (questions[0] as CandidateRuntimeQuestion | undefined);
  const currentDraft = currentQuestion ? drafts[currentQuestion.id] : undefined;

  // Track window focus state and violations for tab switching
  const windowFocusRef = useRef(true);
  const focusIntervalRef = useRef<number | null>(null);

  // Block text selection, copying, dragging, and log security violations
  useEffect(() => {
    const candidateName = runtimeQuery.data?.session.name || 'Unknown Candidate';

    const handleSelectStart = (e: Event) => e.preventDefault();

    const handleCopy = (e: Event) => {
      e.preventDefault();
      addNotification({
        message: 'Copy is disabled during exam',
        candidateName,
        type: 'warning',
      });
      void violationMutation.mutateAsync({
        type: 'copy_attempt',
        severity: 'warning',
        metadata: { candidateName }
      });
    };

    const handleCut = (e: Event) => {
      e.preventDefault();
      addNotification({
        message: 'Cut is disabled during exam',
        candidateName,
        type: 'warning',
      });
      void violationMutation.mutateAsync({
        type: 'cut_attempt',
        severity: 'warning',
        metadata: { candidateName }
      });
    };

    const handlePaste = (e: Event) => {
      e.preventDefault();
      addNotification({
        message: 'Paste is disabled during exam',
        candidateName,
        type: 'warning',
      });
      void violationMutation.mutateAsync({
        type: 'paste_attempt',
        severity: 'warning',
        metadata: { candidateName }
      });
    };

    const handleDrag = (e: Event) => {
      e.preventDefault();
      addNotification({
        message: 'Dragging is disabled during exam',
        candidateName,
        type: 'warning',
      });
      void violationMutation.mutateAsync({
        type: 'drag_attempt',
        severity: 'warning',
        metadata: { candidateName }
      });
    };

    const handleDrop = (e: Event) => {
      e.preventDefault();
      addNotification({
        message: 'Drop is disabled during exam',
        candidateName,
        type: 'warning',
      });
      void violationMutation.mutateAsync({
        type: 'drop_attempt',
        severity: 'warning',
        metadata: { candidateName }
      });
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      addNotification({
        message: 'Right-click is disabled during exam',
        candidateName,
        type: 'warning',
      });
      void violationMutation.mutateAsync({
        type: 'right_click_attempt',
        severity: 'warning',
        metadata: { candidateName }
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Alt+Tab (window switching)
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        addNotification({
          message: 'Window switching (Alt+Tab) is blocked',
          candidateName,
          type: 'critical',
        });
        void violationMutation.mutateAsync({
          type: 'window_switch_attempt',
          severity: 'critical',
          metadata: { candidateName, shortcut: 'Alt+Tab' }
        });
      }

      // Block Tab key alone
      if (e.key === 'Tab') {
        e.preventDefault();
        addNotification({
          message: 'Tab key is disabled during exam',
          candidateName,
          type: 'warning',
        });
        void violationMutation.mutateAsync({
          type: 'tab_key_pressed',
          severity: 'warning',
          metadata: { candidateName }
        });
      }

      // Block Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A, Ctrl+S
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          addNotification({
            message: 'Copy shortcut (Ctrl+C) is blocked',
            candidateName,
            type: 'warning',
          });
          void violationMutation.mutateAsync({
            type: 'keyboard_copy_shortcut',
            severity: 'warning',
            metadata: { candidateName, shortcut: 'Ctrl+C' }
          });
        } else if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          addNotification({
            message: 'Cut shortcut (Ctrl+X) is blocked',
            candidateName,
            type: 'warning',
          });
          void violationMutation.mutateAsync({
            type: 'keyboard_cut_shortcut',
            severity: 'warning',
            metadata: { candidateName, shortcut: 'Ctrl+X' }
          });
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          addNotification({
            message: 'Paste shortcut (Ctrl+V) is blocked',
            candidateName,
            type: 'warning',
          });
          void violationMutation.mutateAsync({
            type: 'keyboard_paste_shortcut',
            severity: 'warning',
            metadata: { candidateName, shortcut: 'Ctrl+V' }
          });
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          addNotification({
            message: 'Select All shortcut (Ctrl+A) is blocked',
            candidateName,
            type: 'warning',
          });
          void violationMutation.mutateAsync({
            type: 'keyboard_selectall_shortcut',
            severity: 'warning',
            metadata: { candidateName, shortcut: 'Ctrl+A' }
          });
        }
      }
    };

    const handleFocus = () => {
      windowFocusRef.current = true;
      if (focusIntervalRef.current !== null) {
        window.clearInterval(focusIntervalRef.current);
        focusIntervalRef.current = null;
      }
    };

    const handleBlur = () => {
      windowFocusRef.current = false;
      // Start logging violations every 2 seconds when user leaves the window
      focusIntervalRef.current = window.setInterval(() => {
        void violationMutation.mutateAsync({
          type: 'window_left',
          severity: 'critical',
          metadata: { candidateName, reason: 'User left exam window' }
        });
      }, 2000);
    };

    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragstart', handleDrag);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragstart', handleDrag);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (focusIntervalRef.current !== null) {
        window.clearInterval(focusIntervalRef.current);
      }
    };
  }, [runtimeQuery.data?.session.name, violationMutation]);

  // Auto-enter fullscreen as soon as exam runtime is ready
  useEffect(() => {
    if (!runtimeQuery.isSuccess) return;
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen may be blocked by browser policy — silently ignore
      });
    }
  }, [runtimeQuery.isSuccess]);

  if (runtimeQuery.isLoading || !currentQuestion) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Card>Loading exam runtime...</Card>
      </main>
    );
  }

  if (runtimeQuery.error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Card>Redirecting...</Card>
      </main>
    );
  }


  const runtime = runtimeQuery.data!;
  const isLowTime = timeRemaining !== null && timeRemaining > 0 && timeRemaining < 300;

  return (
    <main className="min-h-screen w-full select-none px-2 sm:px-4 md:px-6 lg:px-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <WatermarkOverlay
        candidateName={runtime.session.name}
        candidateId={runtime.session.candidateId}
        ipAddress={runtime.session.ipAddress}
      />

      {/* Hidden webcam elements for AI proctoring – invisible to candidates */}
      <video ref={webcamProctor.videoRef} className="sr-only" muted playsInline />
      <canvas ref={webcamProctor.canvasRef} className="sr-only" />


      <div className="flex w-full flex-col gap-4 lg:grid lg:grid-cols-[2fr,360px]" style={{ maxWidth: '95vw' }}>
        <div className="space-y-4 lg:flex lg:flex-col lg:items-stretch">
          <Card className="sticky top-0 z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Candidate</p>
              <h1 className="font-display text-3xl text-ink">{runtime.session.name}</h1>
              <p className="text-sm text-muted">{runtime.session.candidateId}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`rounded-2xl px-4 py-3 transition-colors ${
                  isLowTime ? "animate-pulse bg-rose-100" : "bg-stone-50"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Time Remaining</p>
                <p
                  className={`font-display text-3xl ${
                    isLowTime ? "font-bold text-rose-600" : "text-ink"
                  }`}
                >
                  {timeRemaining !== null ? formatTime(timeRemaining) : "--:--:--"}
                </p>
              </div>
            </div>
          </Card>

          <QuestionCard
            question={currentQuestion}
            selectedOption={currentDraft?.selectedOption ?? null}
            subjectiveAnswerHtml={currentDraft?.subjectiveAnswerHtml ?? "<p></p>"}
            onSelectOption={(originalOption) => {
              setDrafts((current) => ({
                ...current,
                [currentQuestion.id]: {
                  selectedOption: originalOption,
                  subjectiveAnswerHtml: current[currentQuestion.id]?.subjectiveAnswerHtml ?? "<p></p>"
                }
              }));
              void saveMutation.mutateAsync({
                questionId: currentQuestion.id,
                selectedOption: originalOption,
                subjectiveAnswerHtml: null
              });
            }}
            onChangeSubjective={(html) => {
              setDrafts((current) => ({
                ...current,
                [currentQuestion.id]: {
                  selectedOption: null,
                  subjectiveAnswerHtml: html
                }
              }));

              window.clearTimeout(saveTimers.current[currentQuestion.id]);
              saveTimers.current[currentQuestion.id] = window.setTimeout(() => {
                void saveMutation.mutateAsync({
                  questionId: currentQuestion.id,
                  selectedOption: null,
                  subjectiveAnswerHtml: html
                });
              }, 900);
            }}
          />

          <Card className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={async () => {
                await saveCurrentDraft(currentQuestion.id);
                goToNextQuestion();
              }}
            >
              Save & Next
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                setMarkedForReview((current) => new Set(current).add(currentQuestion.id));
                await saveCurrentDraft(currentQuestion.id);
                goToNextQuestion();
              }}
            >
              Mark for Review
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={async () => {
                setDrafts((current) => ({
                  ...current,
                  [currentQuestion.id]: {
                    selectedOption: null,
                    subjectiveAnswerHtml: "<p></p>"
                  }
                }));
                await saveMutation.mutateAsync({
                  questionId: currentQuestion.id,
                  selectedOption: null,
                  subjectiveAnswerHtml: null
                });
              }}
            >
              Clear Response
            </Button>
            {/* Submit button — shows inline confirmation instead of window.confirm */}
            {showSubmitConfirm ? (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="flex-1 text-sm font-medium text-rose-800">
                  Submit the exam now? You will <strong>not</strong> be able to resume editing.
                </p>
                <Button
                  id="confirm-submit-btn"
                  type="button"
                  variant="danger"
                  onClick={() => { void submitMutation.mutateAsync(); }}
                >
                  {submitMutation.isPending ? "Submitting..." : "Yes, Submit"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowSubmitConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                id="submit-exam-btn"
                type="button"
                variant="danger"
                onClick={() => setShowSubmitConfirm(true)}
              >
                Submit Exam
              </Button>
            )}
          </Card>
        </div>

        <Card className="space-y-4 h-fit sticky top-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Question Navigator</p>
            <h2 className="font-display text-3xl text-ink">Progress Map</h2>
          </div>
          <QuestionNavigator
            questions={questions}
            responses={navigatorResponses}
            currentQuestionId={currentQuestion.id}
            visited={visited}
            markedForReview={markedForReview}
            onSelect={goToQuestion}
          />
        </Card>
      </div>
    </main>
  );
}
