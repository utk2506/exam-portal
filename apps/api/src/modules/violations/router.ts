import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import multer from "multer";
import { violationCreateSchema } from "@exam-platform/shared";

import { env, isAiProctoringEnabled } from "../../env.js";
import { requireCandidateSession } from "../../middleware/require-candidate-session.js";
import type { CandidateRequest } from "../../middleware/require-candidate-session.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError, asyncHandler } from "../../utils/http.js";
import { toViolationDto } from "../../utils/mappers.js";
import { createViolation } from "./service.js";

// Multer instance for video clip uploads (stored in memory, written to disk below)
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 } // 150 MB cap per 1-min clip
});

export const violationsRouter = Router();

violationsRouter.post(
  "/",
  requireCandidateSession,
  validateBody(violationCreateSchema),
  asyncHandler(async (request, response) => {
    const violation = await createViolation({
      sessionId: request.body.sessionId,
      type: request.body.type,
      severity: request.body.severity,
      metadata: request.body.metadata
    });

    response.status(201).json({ violation: toViolationDto(violation) });
  })
);

violationsRouter.post(
  "/ai",
  asyncHandler(async (request, response) => {
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token || token !== env.PROCTOR_API_TOKEN) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const violation = await createViolation({
      sessionId: request.body.sessionId,
      type: request.body.type,
      severity: request.body.severity,
      metadata: request.body.metadata
    });

    response.status(201).json({ violation: toViolationDto(violation) });
  })
);

violationsRouter.post(
  "/proctor-frame",
  requireCandidateSession,
  asyncHandler(async (request, response) => {
    const { sessionId, imageBase64 } = request.body as {
      sessionId: string;
      imageBase64: string;
    };

    if (!isAiProctoringEnabled) {
      response.json({ skipped: true });
      return;
    }

    try {
      const proctorResponse = await fetch(`${env.PROCTOR_SERVICE_URL}/analyze-frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          image_base64: imageBase64,
          posted_at: new Date().toISOString(),
          metadata: {}
        })
      });

      if (!proctorResponse.ok) {
        response.json({ skipped: true });
        return;
      }

      const proctorResult = (await proctorResponse.json()) as {
        violations: Array<{ type: string; severity: string }>;
      };

      const created: string[] = [];
      for (const v of proctorResult.violations ?? []) {
        const sev = (["info", "warning", "critical"].includes(v.severity)
          ? v.severity
          : "warning") as "info" | "warning" | "critical";
        const violation = await createViolation({
          sessionId,
          type: v.type,
          severity: sev,
          metadata: { source: "ai_proctor" }
        });
        created.push(violation.id);
      }

      response.json({ created });
    } catch {
      response.json({ skipped: true });
    }
  })
);

// ── Random video recording clips ──────────────────────────────────────────────
// The frontend (useWebcamProctor) records 2–5 random 1-minute clips during
// the exam and POSTs each WebM blob here.
// Files are stored at:  uploads/recordings/{sessionId}/{timestamp}-clip{N}.webm
violationsRouter.post(
  "/recording",
  requireCandidateSession,
  videoUpload.single("video"),
  asyncHandler(async (request, response) => {
    const req = request as CandidateRequest;
    const sessionId = req.candidateAuth!.sessionId;

    if (!request.file) {
      throw new AppError("Video file is required", 422);
    }

    const dir = path.resolve(env.UPLOADS_DIR, "recordings", sessionId);
    fs.mkdirSync(dir, { recursive: true });

    // Filename: {unix-ms}-clip{N}.webm  — unique, sortable chronologically
    const clipIndex = String(request.body.clipIndex ?? "0").replace(/\W/g, "");
    const filename = `${Date.now()}-clip${clipIndex}.webm`;
    fs.writeFileSync(path.join(dir, filename), request.file.buffer);

    response.status(201).json({
      saved: filename,
      url: `/uploads/recordings/${sessionId}/${filename}`
    });
  })
);
