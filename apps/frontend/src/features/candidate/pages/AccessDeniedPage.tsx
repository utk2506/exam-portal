import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const REDIRECT_SECONDS = 5;

const REASON_MAP: Record<string, { title: string; detail: string }> = {
  invalid_session: {
    title: "Invalid Session",
    detail: "The session ID in the URL does not exist or has expired. You cannot access this page directly."
  },
  already_submitted: {
    title: "Exam Already Submitted",
    detail: "This exam has already been submitted. You cannot re-enter the exam runtime."
  },
  not_started: {
    title: "Exam Not Started",
    detail: "You must complete registration and read the instructions before entering the exam."
  },
  unauthorized: {
    title: "Unauthorized Access",
    detail: "You are not authorized to view this page. Please log in with valid credentials."
  },
  default: {
    title: "Access Denied",
    detail: "You attempted to access a restricted page directly. Please follow the proper flow."
  }
};

export function AccessDeniedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const reasonKey = searchParams.get("reason") ?? "default";
  const redirectTo = searchParams.get("to") ?? "/exam";
  const { title, detail } = REASON_MAP[reasonKey] ?? REASON_MAP.default;

  useEffect(() => {
    if (countdown <= 0) {
      navigate(redirectTo, { replace: true });
      return;
    }
    const timer = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, navigate, redirectTo]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #18181b 100%)",
        padding: "24px",
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24,
          padding: "48px 40px",
          textAlign: "center",
          backdropFilter: "blur(12px)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(239,68,68,0.15)",
            border: "1.5px solid rgba(239,68,68,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 28px"
          }}
        >
          <svg width={40} height={40} fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
          </svg>
        </div>

        {/* Title */}
        <p style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.2em", color: "#f87171", textTransform: "uppercase", marginBottom: 10 }}>
          Access Denied
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: 16, lineHeight: 1.2 }}>
          {title}
        </h1>
        <p style={{ fontSize: "0.95rem", color: "#94a3b8", lineHeight: 1.7, marginBottom: 32 }}>
          {detail}
        </p>

        {/* Countdown bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 100, height: 6, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(countdown / REDIRECT_SECONDS) * 100}%`,
                background: "linear-gradient(90deg, #f97316, #ef4444)",
                borderRadius: 100,
                transition: "width 1s linear"
              }}
            />
          </div>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 10 }}>
            Redirecting automatically in <strong style={{ color: "#f97316" }}>{countdown}s</strong>…
          </p>
        </div>

        {/* Manual redirect button */}
        <button
          type="button"
          onClick={() => navigate(redirectTo, { replace: true })}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, #f97316, #ef4444)",
            color: "#fff", border: "none", borderRadius: 12,
            padding: "12px 32px", fontSize: "0.95rem",
            fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 15px rgba(249,115,22,0.35)",
            transition: "transform 0.15s, box-shadow 0.15s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 25px rgba(249,115,22,0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(249,115,22,0.35)";
          }}
        >
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Go Now
        </button>
      </div>
    </main>
  );
}
