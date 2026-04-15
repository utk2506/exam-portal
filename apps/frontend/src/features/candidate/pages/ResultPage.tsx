import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import type { CandidateRegistrationResult } from "@exam-platform/shared";

import { apiClient, ApiError } from "../../../api/client";
import { Card } from "../../../components/ui/Card";

import QRCode from "qrcode";

// ✏️ Update these URLs to your real social media pages
const LINKEDIN_URL  = "https://www.linkedin.com/company/chimera-technologies-private-limited/";
const INSTAGRAM_URL = "https://www.instagram.com/chimeratechnologies/";

function QrImage({ url, alt, logo }: { url: string; alt: string; logo: React.ReactNode }) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [error,   setError]   = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 140,
      margin: 2,
      color: { dark: "#0D0D0D", light: "#FFFFFF" }
    })
      .then(setDataUrl)
      .catch(() => setError(true));
  }, [url]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative rounded-2xl overflow-hidden border border-stone-100 shadow-sm p-2 bg-white flex items-center justify-center"
        style={{ width: 156, height: 156 }}
      >
        {!dataUrl && !error && (
          <div className="absolute inset-2 rounded-xl bg-stone-100 animate-pulse" />
        )}
        {error && (
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-2xl">⚠️</span>
            <p className="text-[10px] text-slate-400">Could not generate</p>
          </div>
        )}
        {dataUrl && (
          <img src={dataUrl} alt={alt} width={140} height={140} className="block" />
        )}
      </div>
      <div className="flex items-center gap-1.5">{logo}</div>
    </div>
  );
}

function QrCodeCard() {
  return (
    <Card className="space-y-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Follow us on Social Media
      </p>
      <p className="text-sm text-muted">Scan a QR code with your phone to stay connected</p>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <QrImage
          url={LINKEDIN_URL}
          alt="LinkedIn QR Code"
          logo={
            <>
              <svg className="h-4 w-4 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span className="text-xs font-semibold text-slate-700">LinkedIn</span>
            </>
          }
        />

        <div className="hidden sm:block h-32 w-px bg-stone-100" />
        <div className="block sm:hidden h-px w-32 bg-stone-100" />

        <QrImage
          url={INSTAGRAM_URL}
          alt="Instagram QR Code"
          logo={
            <>
              <svg className="h-4 w-4 text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold text-slate-700">Instagram</span>
            </>
          }
        />
      </div>
    </Card>
  );
}

export function ResultPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();

  const sessionQuery = useQuery({
    queryKey: ["candidate-session", sessionId],
    queryFn: () => apiClient.get<CandidateRegistrationResult>(`/candidate-sessions/${sessionId}`),
    enabled: Boolean(sessionId)
  });

  const session = sessionQuery.data?.session;

  // URL guard: only submitted / stopped / expired sessions may view the result page.
  // If someone pastes a URL and edits it to /result, redirect them to the right place.
  useEffect(() => {
    if (!sessionQuery.isSuccess) return;
    const status = session?.status;
    if (status === "in_progress") {
      // Exam is still running — send back to runtime
      navigate(`/exam/${sessionId}/runtime`, { replace: true });
    } else if (!status) {
      // Unknown / invalid session ID — send to registration
      navigate("/exam", { replace: true });
    }
    // submitted / stopped / expired — stay on result page
  }, [sessionQuery.isSuccess, session?.status, sessionId, navigate]);

  // If query errors (e.g. 404 invalid sessionId), show access denied page
  useEffect(() => {
    if (!sessionQuery.error) return;
    const httpStatus = sessionQuery.error instanceof ApiError ? sessionQuery.error.status : 0;
    if (httpStatus === 404 || httpStatus === 401 || httpStatus === 403 || httpStatus === 0) {
      navigate(`/access-denied?reason=invalid_session&to=/exam`, { replace: true });
    }
  }, [sessionQuery.error, navigate]);

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-orange-700 px-8 py-10 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100">
              Chimera Fresher's Drive 2026
            </p>
            <h1 className="mt-2 font-display text-4xl leading-tight">Exam Submitted</h1>
            <p className="mt-2 text-sm text-teal-50/85">
              Your responses have been saved successfully.
            </p>
            {session && (
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span className="rounded-xl bg-white/15 px-3 py-1 font-medium">{session.name}</span>
                <span className="rounded-xl bg-white/15 px-3 py-1 font-mono">{session.candidateId}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Confirmation message — no scores shown to candidate */}
        <Card className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
              <svg
                className="h-8 w-8 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-ink">Submission Successful</p>
            <p className="mt-1 text-sm text-muted">
              Your exam has been submitted and is under evaluation.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              📢 Your results will be announced by the administrator after evaluation is complete.
            </p>
          </div>
          {session && (
            <p className="text-xs text-muted">
              Please note your Candidate ID for reference:{" "}
              <span className="font-mono font-semibold text-ink">{session.candidateId}</span>
            </p>
          )}
        </Card>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 text-center">
          <p className="text-xs text-muted">
            You may close this window. Please wait for the administrator to announce results.
          </p>
        </div>


        {/* ── Social Media QR Codes ─────────────────────────────────────────── */}
        <QrCodeCard />
        {/* ─────────────────────────────────────────────────────────────────── */}

      </div>
    </main>
  );
}
