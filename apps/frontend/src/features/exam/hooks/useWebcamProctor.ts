import { useCallback, useEffect, useRef } from "react";

import { apiClient } from "../../../api/client";

const CAPTURE_INTERVAL_MS = 15_000;   // snapshot every 15 s
const JPEG_QUALITY        = 0.6;

const EXAM_DURATION_MS    = 60 * 60 * 1000;  // 60-minute exam
const RECORDING_DURATION_MS = 60 * 1000;     // each clip is 1 minute
const MIN_CLIPS = 2;
const MAX_CLIPS = 5;

/** Returns N unique random integers in [lo, hi) */
function randomOffsets(count: number, lo: number, hi: number): number[] {
  const offsets = new Set<number>();
  const range = hi - lo;
  while (offsets.size < count) {
    offsets.add(lo + Math.floor(Math.random() * range));
  }
  return Array.from(offsets).sort((a, b) => a - b);
}

export function useWebcamProctor({
  enabled,
  sessionId
}: {
  enabled: boolean;
  sessionId: string;
}) {
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Explicitly stop all camera tracks — called on exam submit so the
  // camera light turns off immediately rather than waiting for unmount.
  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  // ── Webcam stream ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    let stopped = false;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240 }, audio: false })
      .then((stream) => {
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {/* silent */});
        }
      })
      .catch(() => {/* camera unavailable — silent fail, don't block exam */});

    return () => {
      stopped = true;
      stopStream();
    };
  }, [enabled]);

  // ── Periodic snapshot upload ──────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = video.videoWidth  || 320;
    canvas.height = video.videoHeight || 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageBase64 = canvas.toDataURL("image/jpeg", JPEG_QUALITY).split(",")[1];
    if (!imageBase64) return;

    void apiClient
      .post("/violations/proctor-frame", { sessionId, imageBase64 })
      .catch(() => {/* silent — don't interrupt the exam on proctor error */});
  }, [sessionId]);

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(captureFrame, CAPTURE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [enabled, captureFrame]);

  // ── Random 1-minute video recordings ─────────────────────────────────────
  // Schedules 2–5 random 1-minute recordings spread across the 60-min exam.
  // Each clip is uploaded silently to POST /violations/recording.
  // The candidate sees no indication that recording is happening.
  useEffect(() => {
    if (!enabled) return;
    if (!("MediaRecorder" in window)) return; // browser unsupported — skip silently

    const clipCount = MIN_CLIPS + Math.floor(Math.random() * (MAX_CLIPS - MIN_CLIPS + 1));

    // Leave the last (RECORDING_DURATION_MS) ms clear so clips don't run past exam end
    const offsets = randomOffsets(
      clipCount,
      0,
      EXAM_DURATION_MS - RECORDING_DURATION_MS
    );

    const timers: number[] = [];

    offsets.forEach((startMs, clipIndex) => {
      const t = window.setTimeout(() => {
        const stream = streamRef.current;
        if (!stream) return;

        // Pick the best supported MIME type
        const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
          .find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";

        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 400_000 });
        } catch {
          return; // codec not supported — skip this clip
        }

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          if (blob.size === 0) return;

          const form = new FormData();
          form.append("video", blob, `clip${clipIndex}.webm`);
          form.append("clipIndex", String(clipIndex));

          // Upload silently — ignore errors so exam is never interrupted
          void apiClient
            .postForm<unknown>("/violations/recording", form)
            .catch(() => {/* silent */});
        };

        recorder.start();
        // Stop recording after 1 minute
        window.setTimeout(() => {
          if (recorder.state !== "inactive") recorder.stop();
        }, RECORDING_DURATION_MS);
      }, startMs);

      timers.push(t);
    });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [enabled, sessionId]);

  return { videoRef, canvasRef, stopStream };
}
