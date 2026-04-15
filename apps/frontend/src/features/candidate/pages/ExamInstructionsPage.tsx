import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { CandidateRegistrationResult } from "@exam-platform/shared";
import { useNavigate, useParams } from "react-router-dom";

import { apiClient, ApiError } from "../../../api/client";
import { MathHtml } from "../../../components/MathHtml";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

type CameraStatus = "idle" | "requesting" | "granted" | "denied";

// ── Forbidden actions listed in the policy card ───────────────────────────────
const FORBIDDEN_ACTIONS: [string, string][] = [
  ["Alt+Tab",          "Switch window or application"],
  ["F12",              "Open Developer Tools"],
  ["Ctrl+Shift+I",     "DevTools (Chrome/Edge)"],
  ["Ctrl+Shift+J",     "Console (Chrome)"],
  ["Ctrl+Shift+C",     "Inspect Element"],
  ["Ctrl+Shift+K",     "Console (Firefox)"],
  ["Ctrl+Shift+M",     "Toggle Device Mode"],
  ["Ctrl+U",           "View Page Source"],
  ["Window blur",      "Clicking outside exam window"],
  ["Esc / F11",        "Exit fullscreen mode"],
  ["Ctrl+C / Ctrl+X",  "Copy or Cut text"],
  ["Ctrl+V",           "Paste text"],
  ["Ctrl+A",           "Select all text"],
  ["Right-click",      "Context menu"],
];

// ── Question state colour legend — must match QuestionNavigator.tsx exactly ──
const Q_STATES: { bg: string; text: string; border?: string; label: string; desc: string }[] = [
  { bg: "#0d9488", text: "#fff",     label: "Answered",          desc: "You have saved an answer." },
  { bg: "#0ea5e9", text: "#fff",     label: "Marked for Review",  desc: "Flagged to revisit before submit." },
  { bg: "#f43f5e", text: "#fff",     label: "Not Answered",       desc: "Visited but no answer saved." },
  { bg: "#ffffff", text: "#1c1917",  border: "#e7e5e4", label: "Not Visited", desc: "You haven't opened this question yet." },
];

export function ExamInstructionsPage() {
  const navigate   = useNavigate();
  const { sessionId = "" } = useParams();

  // ── Multi-step UI ────────────────────────────────────────────────────────
  // Step 1: Malpractice Policy
  // Step 2: Exam Instructions + Feature Guide
  // Step 3: Camera Check + Start Exam
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Camera permission — requested on mount (Step 1) so the perm dialog never
  //    fires during the exam (which would blur the window → malpractice).
  const videoRef    = useRef<HTMLVideoElement | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const [cameraStatus,  setCameraStatus]  = useState<CameraStatus>("idle");
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);

  // Policy must be acknowledged before proceeding to Step 2
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false);

  // 5-minute reading timer on Step 2 — auto-starts exam when it hits 0
  const READING_SECONDS = 5 * 60;
  const [readingTime, setReadingTime] = useState(READING_SECONDS);
  const timerStartedRef = useRef(false);

  const requestCameraRef = useRef<() => void>(() => {});

  function requestCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraStatus("requesting");
    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240 }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraStatus("granted");
        setPermissionState("granted");
      })
      .catch(() => { setCameraStatus("denied"); });
  }
  requestCameraRef.current = requestCamera;

  // Request camera on mount; watch Permissions API for changes
  useEffect(() => {
    requestCameraRef.current();

    let permStatus: PermissionStatus | null = null;
    navigator.permissions?.query({ name: "camera" as PermissionName }).then((status) => {
      permStatus = status;
      setPermissionState(status.state);
      status.onchange = () => {
        setPermissionState(status.state);
        if (status.state === "granted") requestCameraRef.current();
      };
    }).catch(() => {});

    return () => {
      if (permStatus) permStatus.onchange = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // ── Session data ──────────────────────────────────────────────────────────
  const sessionQuery = useQuery({
    queryKey: ["candidate-session", sessionId],
    queryFn: () => apiClient.get<CandidateRegistrationResult>(`/candidate-sessions/${sessionId}`),
    enabled: Boolean(sessionId)
  });

  const startMutation = useMutation({
    mutationFn: () => apiClient.post(`/candidate-sessions/${sessionId}/start`),
    onSuccess: () => { navigate(`/exam/${sessionId}/runtime`); }
  });

  // 5-min reading countdown — starts as soon as session data loads (on any step)
  useEffect(() => {
    if (!sessionQuery.isSuccess) return;
    if (timerStartedRef.current) return;
    timerStartedRef.current = true;

    const interval = window.setInterval(() => {
      setReadingTime((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          if (!document.fullscreenElement) {
            void document.documentElement.requestFullscreen().catch(() => {});
          }
          startMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionQuery.isSuccess]);

  // Re-attach the stream to <video> when Step 3 renders.
  // The camera stream is acquired on mount (Step 1) before the video element
  // exists, so srcObject is never set. We attach it here once step 3 is active.
  useEffect(() => {
    if (step !== 3) return;
    if (!streamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [step]);

  // Redirect guards
  useEffect(() => {
    const status = sessionQuery.data?.session.status;
    if (status === "in_progress") {
      navigate(`/exam/${sessionId}/runtime`, { replace: true });
      return;
    }
    if (status === "submitted" || status === "expired" || status === "stopped") {
      navigate("/exam", { replace: true });
    }
  }, [navigate, sessionQuery.data?.session.status, sessionId]);

  useEffect(() => {
    if (!sessionQuery.error) return;
    const status = sessionQuery.error instanceof ApiError ? sessionQuery.error.status : 0;
    if (status === 404 || status === 401 || status === 403) {
      navigate(`/access-denied?reason=invalid_session&to=/exam`, { replace: true });
    }
  }, [sessionQuery.error, navigate]);

  // ── Step indicator ────────────────────────────────────────────────────────
  const steps = ["Malpractice Policy", "Exam Instructions", "Camera Check"];

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-4">

        {/* ── Global Reading Countdown — visible on all 3 steps ──────────── */}
        {sessionQuery.isSuccess && (
          <div className={`rounded-2xl border px-5 py-3 ${
            readingTime <= 60  ? "border-rose-200   bg-rose-50" :
            readingTime <= 120 ? "border-amber-200  bg-amber-50" :
                                  "border-teal-200   bg-teal-50"
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <svg className={`h-4 w-4 shrink-0 ${
                  readingTime <= 60 ? "text-rose-500" : readingTime <= 120 ? "text-amber-500" : "text-teal-600"
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`text-xs font-semibold ${
                  readingTime <= 60 ? "text-rose-700" : readingTime <= 120 ? "text-amber-700" : "text-teal-700"
                }`}>
                  {readingTime <= 60 ? "🚨 Hurry! Exam auto-starts in" :
                   readingTime <= 120 ? "⚠️ Reading time ending in" :
                   "Reading time remaining"}
                </span>
              </div>
              <span className={`font-mono text-lg font-bold tabular-nums ${
                readingTime <= 60 ? "text-rose-700" : readingTime <= 120 ? "text-amber-700" : "text-teal-700"
              }`}>
                {String(Math.floor(readingTime / 60)).padStart(2, "0")}:{String(readingTime % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/60">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${(readingTime / READING_SECONDS) * 100}%`,
                  background: readingTime <= 60 ? "#ef4444" : readingTime <= 120 ? "#f59e0b" : "#0d9488"
                }}
              />
            </div>
          </div>
        )}

        {/* ── Step indicator ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {steps.map((label, i) => {
            const num = i + 1;
            const isCurrent = step === num;
            const isDone    = step > num;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isDone    ? "bg-emerald-500 text-white" :
                  isCurrent ? "bg-primary text-white" :
                              "bg-stone-200 text-stone-500"
                }`} style={isCurrent ? { backgroundColor: "#FF4a03" } : isDone ? {} : {}}>
                  {isDone ? "✓" : num}
                </div>
                <span className={`text-sm font-medium ${isCurrent ? "text-ink" : "text-muted"}`}>{label}</span>
                {i < steps.length - 1 && (
                  <div className={`h-px w-10 ${step > num ? "bg-emerald-400" : "bg-stone-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1 — Malpractice Policy
        ══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <Card className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Step 1 of 2</p>
                <h1 className="font-display text-2xl text-ink">Malpractice Policy</h1>
              </div>
            </div>

            {/* Two-strike explanation */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <p className="font-bold text-amber-900">Strike 1 — Warning</p>
                </div>
                <p className="text-sm text-amber-800 leading-relaxed">
                  A blocking screen pauses the exam. You must click{" "}
                  <em className="font-semibold">「I Understand」</em> to continue.
                  Violations while the warning is open are <strong>ignored</strong>.
                </p>
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚫</span>
                  <p className="font-bold text-red-900">Strike 2 — Auto Submit</p>
                </div>
                <p className="text-sm text-red-800 leading-relaxed">
                  Any violation <strong>after</strong> acknowledging Strike 1 will{" "}
                  <strong>immediately auto-submit</strong> your exam — no further notice.
                </p>
              </div>
            </div>

            {/* Forbidden actions grid */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-red-700">🚫 Forbidden Actions — each triggers a strike:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {FORBIDDEN_ACTIONS.map(([shortcut, desc]) => (
                  <div key={shortcut} className="flex items-center gap-3 rounded-xl bg-stone-50 border border-stone-100 px-3 py-2">
                    <code className="min-w-[6.5rem] rounded-lg bg-red-100 px-2 py-1 text-center font-mono text-[11px] font-bold text-red-800 whitespace-nowrap">
                      {shortcut}
                    </code>
                    <span className="text-sm text-slate-600">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandatory acknowledgment */}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 transition-colors hover:bg-red-100/60">
              <input
                id="policy-acknowledge"
                type="checkbox"
                checked={policyAcknowledged}
                onChange={(e) => setPolicyAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-red-600"
              />
              <span className="text-sm font-medium text-slate-700 leading-relaxed">
                I have read and understood the malpractice policy. I agree that violations will be
                recorded and my exam may be auto-submitted on a second offence.
              </span>
            </label>

            {/* Next button */}
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={!policyAcknowledged}
                onClick={() => setStep(2)}
              >
                Next: Exam Instructions →
              </Button>
            </div>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2 — Exam Instructions + Feature Guide
        ══════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Exam header card */}
            <Card className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary" style={{ color: "#FF4a03" }}>Step 2 of 2 — Exam Instructions</p>
                  <h1 className="font-display text-3xl text-ink">{sessionQuery.data?.exam.title ?? "Loading..."}</h1>
                </div>
                <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-muted">
                  Candidate ID: <span className="font-semibold text-ink">{sessionQuery.data?.session.candidateId ?? "--"}</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Duration",       value: "60 min" },
                  { label: "Total Marks",    value: String(sessionQuery.data?.exam.totalMarks ?? 0) },
                  { label: "Total Questions",value: String(sessionQuery.data?.exam.questionCount ?? 0) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl bg-stone-50 px-4 py-3 text-center">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
                    <p className="mt-1 font-display text-2xl text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Important rules */}
            <Card className="space-y-3 bg-stone-50">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Important Rules</p>
              <ul className="space-y-1.5 text-sm text-ink list-none">
                {[
                  "Remain in fullscreen mode for the entire attempt.",
                  "Do not switch tabs, use blocked shortcuts, or refresh the page.",
                  "Answers are auto-saved, but use Save & Next while navigating.",
                  "Subjective answers must be typed inside the provided editor.",
                  "The exam auto-submits when the timer reaches zero.",
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-500 shrink-0">✓</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Exam features guide */}
            <Card className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">How to Use the Exam Interface</p>

              {/* Feature tiles */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 space-y-1">
                  <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    <span>📌</span> Mark for Review
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Click <strong>Mark for Review</strong> to flag a question you want to revisit.
                    Marked questions show an amber badge in the navigator.
                  </p>
                </div>
                <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 space-y-1">
                  <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    <span>💾</span> Save &amp; Next
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Click <strong>Save &amp; Next</strong> to save your answer and move to the next question automatically.
                  </p>
                </div>
                <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 space-y-1">
                  <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    <span>🗂️</span> Question Navigator
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Use the side panel to jump directly to any question. Colour codes show your progress at a glance.
                  </p>
                </div>
                <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 space-y-1">
                  <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    <span>⏱️</span> Live Timer
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    A countdown timer is displayed at the top. The exam auto-submits when time reaches <strong>00:00:00</strong>.
                  </p>
                </div>
              </div>
            {/* Question colour legend */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted uppercase tracking-[0.14em]">Question Colour Legend</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Q_STATES.map(({ bg, text, border, label, desc }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm"
                        style={{ background: bg, color: text, border: border ? `1.5px solid ${border}` : undefined }}
                      >
                        1
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink">{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Backend exam instructions */}
            <Card className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Exam Instructions</p>
              <MathHtml html={sessionQuery.data?.exam.instructionsHtml ?? "<p>Loading instructions...</p>"} />
            </Card>

            {/* Next: Camera Check */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-stone-100 transition-colors"
              >
                ← Back to Policy
              </button>
              <Button type="button" onClick={() => setStep(3)}>
                Next: Camera Check →
              </Button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 3 — Camera Check + Start Exam
        ══════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-5">
            <Card className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#FF4a03" }}>Step 3 of 3 — Camera Check</p>
                <h2 className="font-display text-2xl text-ink">Verify Your Camera &amp; Start</h2>
                <p className="mt-1 text-sm text-muted">Your camera must be active for proctoring. Once verified, start the exam.</p>
              </div>

              {/* Camera status badge */}
              <div className="flex items-center gap-3">
                {cameraStatus === "requesting" && (
                  <span className="rounded-full bg-amber-50 px-3 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">⏳ Requesting access…</span>
                )}
                {cameraStatus === "granted" && (
                  <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">✅ Camera Ready</span>
                )}
                {cameraStatus === "denied" && (
                  <span className="rounded-full bg-rose-50 px-3 py-0.5 text-xs font-medium text-rose-700 border border-rose-200">❌ Camera Denied — required to proceed</span>
                )}
              </div>

              {/* Live preview + instructions */}
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative overflow-hidden rounded-2xl bg-slate-100" style={{ width: 240, height: 180, flexShrink: 0 }}>
                  {cameraStatus === "granted" ? (
                    <video ref={videoRef} muted playsInline className="h-full w-full object-cover scale-x-[-1]" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                      <svg className="h-14 w-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <span className="text-xs text-slate-400">No feed</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 text-sm">
                  {cameraStatus === "granted" && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800">
                      ✅ Your camera is working. This feed will be used for proctoring during the exam.
                    </div>
                  )}
                  {cameraStatus === "requesting" && (
                    <p className="text-slate-500">Please allow camera access when prompted by your browser.</p>
                  )}
                  {cameraStatus === "denied" && (
                    <div className="space-y-3">
                      <p className="font-medium text-rose-600">Camera access was denied. You cannot start the exam without it.</p>
                      {permissionState === "prompt" && (
                        <button type="button" onClick={requestCamera} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: "#FF4a03" }}>
                          Enable Camera Access
                        </button>
                      )}
                      {(permissionState === "denied" || permissionState === null) && (
                        <>
                          <ol className="text-xs text-slate-500 space-y-1.5 list-decimal list-inside">
                            <li>Click the <strong>🔒 lock</strong> icon in your browser’s address bar</li>
                            <li>Set <strong>Camera</strong> → <strong>Allow</strong></li>
                            <li>This page detects the change automatically</li>
                          </ol>
                          <button type="button" onClick={requestCamera} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors">
                            Try Again Manually
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Reading countdown + start */}
            <Card className="space-y-4">
              {startMutation.error && (
                <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {(startMutation.error as Error).message}
                </p>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-stone-100 transition-colors"
                >
                  ← Back to Instructions
                </button>
                <Button
                  type="button"
                  disabled={
                    startMutation.isPending ||
                    cameraStatus === "requesting" ||
                    cameraStatus === "denied" ||
                    cameraStatus === "idle"
                  }
                  onClick={() => {
                    if (!document.fullscreenElement) {
                      void document.documentElement.requestFullscreen().catch(() => {});
                    }
                    startMutation.mutate();
                  }}
                >
                  {startMutation.isPending ? "Starting..." : readingTime > 0 ? "Start Exam Now" : "Start Exam"}
                </Button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </main>
  );
}
