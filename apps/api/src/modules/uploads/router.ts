import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import multer from "multer";

import { env } from "../../env.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import { AppError, asyncHandler } from "../../utils/http.js";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadsRouter = Router();

uploadsRouter.use(requireAdmin);

uploadsRouter.post(
  "/asset",
  upload.single("asset"),
  asyncHandler(async (request, response) => {
    const examId = String(request.body.examId ?? "").trim();
    if (!examId) {
      throw new AppError("examId is required", 422);
    }

    if (!request.file) {
      throw new AppError("Asset file is required", 422);
    }

    const uploadsDir = path.resolve(env.UPLOADS_DIR, "exams", examId);
    fs.mkdirSync(uploadsDir, { recursive: true });

    const safeFilename = `${Date.now()}-${request.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    fs.writeFileSync(path.join(uploadsDir, safeFilename), request.file.buffer);

    response.status(201).json({
      assetUrl: `/uploads/exams/${examId}/${safeFilename}`,
      filename: safeFilename
    });
  })
);
