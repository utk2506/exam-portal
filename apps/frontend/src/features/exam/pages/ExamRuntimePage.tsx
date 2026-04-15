import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import type { CandidateRuntimeDto, CandidateRuntimeQuestion, McqOptionKey } from "@exam-platform/shared";

import { apiClient, ApiError } from "../../../api/client";
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

  // ── localStorage helpers ─────────────────────────────────────────────────
  const lsVisitedKey      = `exam_visited_${sessionId}`;
  const lsReviewKey       = `exam_review_${sessionId}`;
  const lsCurrentQKey     = `exam_current_q_${sessionId}`;

  function loadSet(key: string): Set<string> {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch { /* ignore */ }
    return new Set<string>();
  }
  // ─────────────────────────────────────────────────────────────────────────

  const [currentQuestionId, setCurrentQuestionId] = useState(
    () => localStorage.getItem(lsCurrentQKey) ?? ""
  );
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [visited, setVisited] = useState<Set<string>>(() => loadSet(lsVisitedKey));
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(() => loadSet(lsReviewKey));
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(
    () => Boolean(document.fullscreenElement)
  );

  // ── Malpractice violation tracking ───────────────────────────────────────
  const lsViolationKey = `exam_violations_${sessionId}`;
  // Use a ref so event-listener closures always see the latest count
  const criticalViolationCountRef = useRef(
    parseInt(localStorage.getItem(`exam_violations_${sessionId}`) ?? '0', 10)
  );
  const [criticalViolationCount, setCriticalViolationCount] = useState(
    criticalViolationCountRef.current
  );
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [autoSubmitOnViolation, setAutoSubmitOnViolation] = useState(false);
  // Stable ref — updated every render so event listeners always get latest fn
  const handleCriticalViolationRef = useRef<() => void>(() => {});
  // ─────────────────────────────────────────────────────────────────────────

  const saveTimers = useRef<Record<string, number>>({});
  // When true, disables the webcam hook so it stops the stream immediately
  const [examCompleted, setExamCompleted] = useState(false);

  // Persist visited set to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(lsVisitedKey, JSON.stringify(Array.from(visited)));
  }, [visited, lsVisitedKey]);

  // Persist markedForReview set to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(lsReviewKey, JSON.stringify(Array.from(markedForReview)));
  }, [markedForReview, lsReviewKey]);

  // Persist current question to localStorage whenever it changes
  useEffect(() => {
    if (currentQuestionId) {
      localStorage.setItem(lsCurrentQKey, currentQuestionId);
    }
  }, [currentQuestionId, lsCurrentQKey]);

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
      // Setting examCompleted=true flips webcamProctor enabled→false, which
      // triggers its useEffect cleanup immediately and stops the camera stream.
      setExamCompleted(true);
      // Persist submission flag to BOTH storages:
      // - sessionStorage: survives bfcache (handles back button / same tab)
      // - localStorage:   persists across tab close / page refresh / new tab
      sessionStorage.setItem(`exam_submitted_${sessionId}`, "1");
      localStorage.setItem(`exam_submitted_${sessionId}`, "1");
      // Clean up ALL persisted exam state for this session
      localStorage.removeItem(`exam_end_time_${sessionId}`);
      localStorage.removeItem(`exam_visited_${sessionId}`);
      localStorage.removeItem(`exam_review_${sessionId}`);
      localStorage.removeItem(`exam_current_q_${sessionId}`);
      localStorage.removeItem(`exam_violations_${sessionId}`);
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
    setVisited((current) => {
      const next = new Set(current);
      next.add(questionId);
      return next;
    });
  }

  function goToNextQuestion() {
    const questions = runtimeQuery.data?.questions ?? [];
    const currentIndex = questions.findIndex((question) => question.id === currentQuestionId);
    const nextQuestion = questions[currentIndex + 1];
    if (nextQuestion) goToQuestion(nextQuestion.id);
  }

  // ── Malpractice handler ───────────────────────────────────────────────────
  // 1st critical violation  → show a blocking warning modal
  // 2nd+ critical violation → trigger auto-submit (ONLY if user already
  //   acknowledged the first warning by clicking "I Understand")
  //
  // ⚠️  While the warning modal is visible, ALL further violations are IGNORED.
  //   The count only advances again after the candidate explicitly clicks
  //   "I Understand — Continue Exam".  This prevents a flood of blur/keydown
  //   events that fire while the modal is open from immediately auto-submitting.
  function handleCriticalViolation() {
    // 🔒 Frozen while warning is showing — do nothing
    if (showViolationWarning) return;

    criticalViolationCountRef.current += 1;
    const count = criticalViolationCountRef.current;
    localStorage.setItem(lsViolationKey, String(count));
    setCriticalViolationCount(count);
    if (count === 1) {
      setShowViolationWarning(true);
    } else {
      // 2nd violation AFTER user acknowledged the first
      const candidateName = runtimeQuery.data?.session.name || 'Unknown Candidate';
      void violationMutation.mutateAsync({
        type: 'malpractice',
        severity: 'critical',
        metadata: { candidateName, reason: 'Exceeded maximum warnings (auto-submitted)' }
      }).finally(() => {
        setAutoSubmitOnViolation(true);
      });
    }
  }
  // Keep the ref current so event-listener closures always call the latest copy
  handleCriticalViolationRef.current = handleCriticalViolation;
  // ─────────────────────────────────────────────────────────────────────────

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

    // Initialise the timer using a localStorage-persisted end timestamp so that
    // page reloads do NOT reset the countdown back to the full duration.
    setTimeRemaining((prev) => {
      if (prev !== null) return prev; // already running — don't touch it (question-switch guard)

      const storageKey = `exam_end_time_${sessionId}`;
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        // Page was reloaded — calculate remaining seconds from the stored absolute end time
        const endTime = parseInt(stored, 10);
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        return remaining;
      }

      // First ever load for this session — trust the server and persist the end time
      const serverSeconds = runtimeQuery.data.timeRemainingSeconds;
      const endTime = Date.now() + serverSeconds * 1000;
      localStorage.setItem(storageKey, String(endTime));
      return serverSeconds;
    });

    // Only set the first question if there is no persisted current question
    if (!currentQuestionId && runtimeQuery.data.questions.length > 0) {
      const firstQuestionId = runtimeQuery.data.questions[0].id;
      setCurrentQuestionId(firstQuestionId);
      // Only initialise visited to first question if nothing is persisted yet
      setVisited((prev) => {
        if (prev.size > 0) return prev; // already restored from localStorage
        return new Set([firstQuestionId]);
      });
    }
  }, [currentQuestionId, runtimeQuery.data]);

  // Countdown timer — only start once we have real data from server.
  // Derives remaining seconds from the stored absolute end time so drift
  // doesn't accumulate across reloads or long-running tabs.
  useEffect(() => {
    if (timeRemaining === null) return;
    if (timeRemaining === 0) return; // don't start a 0-second countdown
    const storageKey = `exam_end_time_${sessionId}`;
    const timer = window.setInterval(() => {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const endTime = parseInt(stored, 10);
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeRemaining(remaining);
        if (remaining === 0) window.clearInterval(timer);
      } else {
        // Fallback: decrement by 1 each second
        setTimeRemaining((current) => (current === null ? null : Math.max(0, current - 1)));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timeRemaining === null, sessionId]); // only re-run when null→number transition

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

  // Auto-submit when 2nd critical violation fires
  useEffect(() => {
    if (autoSubmitOnViolation && !submitMutation.isPending && runtimeQuery.isSuccess) {
      void submitMutation.mutateAsync();
    }
  }, [autoSubmitOnViolation, runtimeQuery.isSuccess, submitMutation]);

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

  // If the runtime query errors, redirect based on HTTP status:
  // 409 = already submitted → show "already submitted" error page redirecting to result
  // 404/401 = invalid/fake sessionId → show "invalid session" error page
  useEffect(() => {
    if (!runtimeQuery.error) return;
    const httpStatus = runtimeQuery.error instanceof ApiError ? runtimeQuery.error.status : 0;
    if (httpStatus === 409) {
      navigate(
        `/access-denied?reason=already_submitted&to=${encodeURIComponent(`/exam/${sessionId}/result`)}`,
        { replace: true }
      );
    } else {
      navigate(`/access-denied?reason=invalid_session&to=/exam`, { replace: true });
    }
  }, [runtimeQuery.error, sessionId, navigate]);

  // Handle bfcache — browser restores page from cache without re-running effects.
  // 1. Check sessionStorage immediately (no async delay) so the camera never
  //    restarts and the exam page never flashes back after submission.
  // 2. Fall back to a query refetch for any other navigation (e.g. admin restores).
  useEffect(() => {
    // On initial mount: check both sessionStorage (bfcache) and localStorage
    // (persists across tab close/refresh) before showing any exam UI.
    const submitted =
      sessionStorage.getItem(`exam_submitted_${sessionId}`) ||
      localStorage.getItem(`exam_submitted_${sessionId}`);
    if (submitted) {
      navigate(`/exam/${sessionId}/result`, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Check both storages before any async refetch
        const submitted =
          sessionStorage.getItem(`exam_submitted_${sessionId}`) ||
          localStorage.getItem(`exam_submitted_${sessionId}`);
        if (submitted) {
          navigate(`/exam/${sessionId}/result`, { replace: true });
          return;
        }
        void runtimeQuery.refetch();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [runtimeQuery, sessionId, navigate]);

  const webcamProctor = useWebcamProctor({
    // Disable when exam is completed OR either storage shows it was submitted.
    // Guards against bfcache restoring examCompleted=false AND cross-tab/refresh cases.
    enabled:
      runtimeQuery.isSuccess &&
      !examCompleted &&
      !sessionStorage.getItem(`exam_submitted_${sessionId}`) &&
      !localStorage.getItem(`exam_submitted_${sessionId}`),
    sessionId
  });
  // (stopCameraRef removed — examCompleted state drives cleanup instead)

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
      }).finally(() => {
        handleCriticalViolationRef.current();
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent holding down keys from spamming the backend with hundreds of violations
      if (e.repeat) return;
      // Block developer tools shortcuts
      const isDeveloperToolsShortcut =
        e.key === 'F12' || // F12 (most browsers)
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) || // Ctrl+Shift+I (Inspector)
        (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) || // Ctrl+Shift+J (Console)
        (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) || // Ctrl+Shift+K (Console on Firefox)
        (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) || // Ctrl+Shift+C (Element Inspector)
        (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')); // Ctrl+Shift+M (Responsive Design Mode)

      if (isDeveloperToolsShortcut) {
        e.preventDefault();
        addNotification({
          message: 'Developer tools access is not allowed during exam',
          candidateName,
          type: 'critical',
        });
        void violationMutation.mutateAsync({
          type: 'developer_tools_attempt',
          severity: 'critical',
          metadata: { candidateName, key: e.key }
        }).finally(() => {
          handleCriticalViolationRef.current();
        });
        return;
      }

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
        }).finally(() => {
          handleCriticalViolationRef.current();
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

      // Block Ctrl+U (View Source) — add before the generic Ctrl+* block
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        addNotification({
          message: 'View Source (Ctrl+U) is blocked',
          candidateName,
          type: 'critical',
        });
        void violationMutation.mutateAsync({
          type: 'view_source_attempt',
          severity: 'critical',
          metadata: { candidateName, shortcut: 'Ctrl+U' }
        }).finally(() => {
          handleCriticalViolationRef.current();
        });
        return;
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
          }).finally(() => {
            handleCriticalViolationRef.current();
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
          }).finally(() => {
            handleCriticalViolationRef.current();
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
          }).finally(() => {
            handleCriticalViolationRef.current();
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
          }).finally(() => {
            handleCriticalViolationRef.current();
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
      // Log the immediate tab switch right away, BEFORE triggering the warning/auto-submit
      void violationMutation.mutateAsync({
        type: 'tab_switch',
        severity: 'critical',
        metadata: { candidateName, reason: 'Candidate switched tabs or windows' }
      }).finally(() => {
        // Count ONE critical violation per blur event
        handleCriticalViolationRef.current();
      });

      // Continue logging violations every 2 seconds while window remains unfocused
      focusIntervalRef.current = window.setInterval(() => {
        void violationMutation.mutateAsync({
          type: 'window_left',
          severity: 'critical',
          metadata: { candidateName, reason: 'User remained outside exam window' }
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

  // Fullscreen management:
  // - Track fullscreen state via the `fullscreenchange` event (reliable on all browsers)
  // - Show a blocking overlay when not in fullscreen so the candidate must click to re-enter
  // - We do NOT auto-call requestFullscreen() here because browsers require a user gesture;
  //   the overlay button provides that gesture.
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // URL guard: if session status is `registered` (exam not yet started), send back to instructions
  useEffect(() => {
    if (sessionStatus === "registered") {
      navigate(`/exam/${sessionId}/instructions`, { replace: true });
    }
  }, [sessionStatus, sessionId, navigate]);

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

      {/* ── Fullscreen guard overlay ─────────────────────────────────────────
           Shown whenever the candidate exits fullscreen. Blocks all interaction
           until they click the button (which is the required user gesture). */}
      {!isFullscreen && runtimeQuery.isSuccess && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15,23,42,0.97)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '24px',
            color: '#fff', textAlign: 'center', padding: '32px'
          }}
        >
          <svg style={{ width: 56, height: 56, color: '#f97316' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Fullscreen Required</p>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: 380 }}>
              This exam must be taken in fullscreen mode. Please click the button below to continue.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void document.documentElement.requestFullscreen().catch(() => {});
            }}
            style={{
              background: '#f97316', color: '#fff', border: 'none',
              borderRadius: 12, padding: '12px 32px',
              fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
          Return to Fullscreen
          </button>
        </div>
      )}

      {/* ── Malpractice warning overlay ─────────────────────────────────────
           Shown on the FIRST critical violation. Candidate must acknowledge
           before continuing. A second violation will auto-submit. */}
      {showViolationWarning && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(127,29,29,0.97)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '24px',
            color: '#fff', textAlign: 'center', padding: '32px'
          }}
        >
          <svg style={{ width: 64, height: 64, color: '#fca5a5' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 10, color: '#fca5a5' }}>
              ⚠️ Malpractice Detected!
            </p>
            <p style={{ fontSize: '1rem', color: '#fecaca', maxWidth: 420, lineHeight: 1.6 }}>
              This is your <strong>first and final warning</strong>.<br />
              Any further violation (switching tabs, opening dev tools, or leaving this window)
              will <strong>immediately auto-submit your exam</strong>.
            </p>
            <p style={{ marginTop: 12, fontSize: '0.85rem', color: '#fca5a5' }}>
              Violation count: {criticalViolationCount} / 2
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowViolationWarning(false)}
            style={{
              background: '#fff', color: '#7f1d1d', border: 'none',
              borderRadius: 12, padding: '12px 36px',
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer'
            }}
          >
            I Understand — Continue Exam
          </button>
        </div>
      )}

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
