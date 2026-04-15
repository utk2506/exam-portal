import fs from "node:fs";
import path from "node:path";

import AdmZip from "adm-zip";
import { type McqOption } from "@prisma/client";
import { questionCreateSchema } from "@exam-platform/shared";
import XLSX from "xlsx";

import { env } from "../../env.js";
import { prisma } from "../../lib/prisma.js";
import { emitRealtimeEvent } from "../../lib/realtime.js";
import { AppError } from "../../utils/http.js";
import { sanitizeRichHtml } from "../../utils/sanitize-rich-html.js";
import { finalizeSessionSubmission } from "../results/service.js";

function normalizeExamCode(examCode: string) {
  return examCode.trim().toUpperCase();
}

function sanitizeQuestionPayload(payload: Record<string, unknown>) {
  return {
    ...payload,
    promptHtml: sanitizeRichHtml(String(payload.promptHtml ?? "")),
    optionAHtml: payload.optionAHtml ? sanitizeRichHtml(String(payload.optionAHtml)) : null,
    optionBHtml: payload.optionBHtml ? sanitizeRichHtml(String(payload.optionBHtml)) : null,
    optionCHtml: payload.optionCHtml ? sanitizeRichHtml(String(payload.optionCHtml)) : null,
    optionDHtml: payload.optionDHtml ? sanitizeRichHtml(String(payload.optionDHtml)) : null,
    correctOption: payload.correctOption ? String(payload.correctOption).trim().toUpperCase() : undefined
  };
}

function assetUrl(examId: string, safeName: string) {
  return `/uploads/exams/${examId}/${safeName}`;
}

function extractAssets(examId: string, archiveFile?: Express.Multer.File | null) {
  const extractedFiles = new Set<string>();
  if (!archiveFile) {
    return extractedFiles;
  }

  const examDir = path.resolve(env.UPLOADS_DIR, "exams", examId);
  fs.mkdirSync(examDir, { recursive: true });

  const zip = new AdmZip(archiveFile.buffer);
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) {
      continue;
    }

    const safeName = path.basename(entry.entryName);
    fs.writeFileSync(path.join(examDir, safeName), entry.getData());
    extractedFiles.add(safeName);
  }

  return extractedFiles;
}

function resolveAssetUrl(examId: string, rawFilename: string, extractedFiles: Set<string>) {
  const safeName = path.basename(rawFilename);
  const targetPath = path.resolve(env.UPLOADS_DIR, "exams", examId, safeName);

  if (!extractedFiles.has(safeName) && !fs.existsSync(targetPath)) {
    throw new AppError(`Missing asset file: ${safeName}`, 422);
  }

  return assetUrl(examId, safeName);
}

function parseWorkbook(workbookFile: Express.Multer.File) {
  const workbook = XLSX.read(workbookFile.buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    throw new AppError("Spreadsheet does not contain a readable sheet", 422);
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: ""
  });
}

function parseImportRow(examId: string, row: Record<string, unknown>, extractedFiles: Set<string>) {
  const assetFilename = String(row.assetFilename ?? "").trim();
  const parsed = questionCreateSchema.safeParse(
    sanitizeQuestionPayload({
      type: String(row.type ?? "").trim().toLowerCase(),
      promptHtml: row.promptHtml,
      optionAHtml: row.optionAHtml,
      optionBHtml: row.optionBHtml,
      optionCHtml: row.optionCHtml,
      optionDHtml: row.optionDHtml,
      correctOption: row.correctOption,
      marks: Number(row.marks ?? 0),
      sortOrder: Number(row.sortOrder ?? 0),
      assetUrl: assetFilename ? resolveAssetUrl(examId, assetFilename, extractedFiles) : null
    })
  );

  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Invalid import row", 422);
  }

  return parsed.data;
}

export async function listExams() {
  return prisma.exam.findMany({
    include: {
      questions: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getExam(examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        orderBy: {
          sortOrder: "asc"
        }
      }
    }
  });

  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  return exam;
}

export async function createExam(payload: {
  title: string;
  examCode: string;
  instructionsHtml: string;
  totalMarks: number;
  status?: "draft" | "scheduled" | "live" | "stopped" | "completed";
}) {
  return prisma.exam.create({
    data: {
      title: payload.title,
      examCode: normalizeExamCode(payload.examCode),
      instructionsHtml: sanitizeRichHtml(payload.instructionsHtml),
      durationMinutes: 60,
      totalMarks: payload.totalMarks,
      status: payload.status ?? "draft"
    },
    include: {
      questions: true
    }
  });
}

export async function deleteExam(examId: string) {
  const exam = await getExam(examId);

  if (exam.status === "live") {
    throw new AppError("Cannot delete a live exam. Stop it first.", 409);
  }

  await prisma.exam.delete({ where: { id: examId } });
}



export async function updateExam(examId: string, payload: Record<string, unknown>) {
  await getExam(examId);

  const data: Record<string, unknown> = {
    ...payload
  };

  if (payload.instructionsHtml) {
    data.instructionsHtml = sanitizeRichHtml(String(payload.instructionsHtml));
  }
  if (payload.examCode) {
    data.examCode = normalizeExamCode(String(payload.examCode));
  }

  return prisma.exam.update({
    where: { id: examId },
    data,
    include: {
      questions: true
    }
  });
}

export async function addQuestion(examId: string, payload: Record<string, unknown>) {
  await getExam(examId);
  const parsed = questionCreateSchema.parse(sanitizeQuestionPayload(payload));

  return prisma.question.create({
    data: {
      examId,
      type: parsed.type,
      promptHtml: parsed.promptHtml,
      optionAHtml: parsed.optionAHtml ?? null,
      optionBHtml: parsed.optionBHtml ?? null,
      optionCHtml: parsed.optionCHtml ?? null,
      optionDHtml: parsed.optionDHtml ?? null,
      correctOption: (parsed.correctOption as McqOption | undefined) ?? null,
      marks: parsed.marks,
      sortOrder: parsed.sortOrder,
      assetUrl: parsed.assetUrl ?? null
    }
  });
}

export async function updateQuestion(questionId: string, payload: Record<string, unknown>) {
  const existing = await prisma.question.findUnique({
    where: { id: questionId }
  });

  if (!existing) {
    throw new AppError("Question not found", 404);
  }

  const parsed = questionCreateSchema.parse(sanitizeQuestionPayload(payload));
  return prisma.question.update({
    where: { id: questionId },
    data: {
      type: parsed.type,
      promptHtml: parsed.promptHtml,
      optionAHtml: parsed.optionAHtml ?? null,
      optionBHtml: parsed.optionBHtml ?? null,
      optionCHtml: parsed.optionCHtml ?? null,
      optionDHtml: parsed.optionDHtml ?? null,
      correctOption: (parsed.correctOption as McqOption | undefined) ?? null,
      marks: parsed.marks,
      sortOrder: parsed.sortOrder,
      assetUrl: parsed.assetUrl ?? null
    }
  });
}

export async function deleteQuestion(questionId: string) {
  // Get the question to find its exam
  const question = await prisma.question.findUnique({
    where: { id: questionId }
  });

  if (!question) {
    throw new AppError("Question not found", 404);
  }

  // Delete and renumber in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete the question
    await tx.question.delete({
      where: { id: questionId }
    });

    // Get all remaining questions ordered by sortOrder
    const remainingQuestions = await tx.question.findMany({
      where: { examId: question.examId },
      orderBy: { sortOrder: "asc" }
    });

    // Renumber them sequentially
    for (let i = 0; i < remainingQuestions.length; i++) {
      await tx.question.update({
        where: { id: remainingQuestions[i].id },
        data: { sortOrder: i + 1 }
      });
    }
  });
}

export async function startExam(examId: string) {
  const exam = await prisma.exam.update({
    where: { id: examId },
    data: {
      status: "live"
    }
  });

  emitRealtimeEvent("exam.started", { examId });
  return exam;
}

export async function stopExam(examId: string) {
  const activeSessions = await prisma.candidateSession.findMany({
    where: {
      examId,
      status: {
        in: ["registered", "in_progress"]
      }
    },
    select: {
      id: true
    }
  });

  for (const session of activeSessions) {
    await finalizeSessionSubmission(session.id, "stopped");
  }

  const exam = await prisma.exam.update({
    where: { id: examId },
    data: {
      status: "stopped"
    }
  });

  emitRealtimeEvent("exam.stopped", { examId });
  return exam;
}

export async function importQuestions({
  examId,
  workbookFile,
  assetsArchiveFile
}: {
  examId: string;
  workbookFile: Express.Multer.File;
  assetsArchiveFile?: Express.Multer.File | null;
}) {
  await getExam(examId);

  const extractedFiles = extractAssets(examId, assetsArchiveFile);
  const parsedRows = parseWorkbook(workbookFile).map((row) => parseImportRow(examId, row, extractedFiles));

  await prisma.$transaction([
    prisma.response.deleteMany({
      where: {
        question: {
          examId
        }
      }
    }),
    prisma.question.deleteMany({
      where: {
        examId
      }
    }),
    ...parsedRows.map((row) =>
      prisma.question.create({
        data: {
          examId,
          type: row.type,
          promptHtml: row.promptHtml,
          optionAHtml: row.optionAHtml ?? null,
          optionBHtml: row.optionBHtml ?? null,
          optionCHtml: row.optionCHtml ?? null,
          optionDHtml: row.optionDHtml ?? null,
          correctOption: (row.correctOption as McqOption | undefined) ?? null,
          marks: row.marks,
          sortOrder: row.sortOrder,
          assetUrl: row.assetUrl ?? null
        }
      })
    )
  ]);

  return parsedRows.length;
}
