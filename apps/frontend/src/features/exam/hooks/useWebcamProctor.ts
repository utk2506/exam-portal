import { useCallback, useEffect, useRef } from "react";

import { apiClient } from "../../../api/client";

const CAPTURE_INTERVAL_MS = 15_000; // snapshot every 15 seconds
const JPEG_QUALITY = 0.6;

export function useWebcamProctor({
  enabled,
  sessionId
}: {
  enabled: boolean;
  sessionId: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start the webcam stream
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
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [enabled]);

  // Capture and send frames on interval
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 320;
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

  return { videoRef, canvasRef };
}
