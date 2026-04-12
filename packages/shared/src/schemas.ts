import { z } from "zod";

export const examStatusSchema = z.enum(["draft", "scheduled", "live", "stopped", "completed"]);
export const questionTypeSchema = z.enum(["mcq", "subjective"]);
export const sessionStatusSchema = z.enum(["registered", "in_progress", "submitted", "expired", "stopped"]);
export const violationSeveritySchema = z.enum(["info", "warning", "critical"]);
export const mcqOptionKeySchema = z.enum(["A", "B", "C", "D"]);

const absoluteUrlSchema = z.string().url();
const uploadAssetPathSchema = z.string().regex(/^\/uploads\/[A-Za-z0-9/_\-.]+$/, {
  message: "Asset URL must be an absolute URL or a /uploads path"
});

const assetUrlSchema = z.string().trim().min(1).refine(
  (value) => absoluteUrlSchema.safeParse(value).success || uploadAssetPathSchema.safeParse(value).success,
  {
    message: "Asset URL must be an absolute URL or a /uploads path"
  }
);

export const adminLoginSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(8).max(128)
});

const examSchemaFields = {
  title: z.string().min(3).max(200),
  examCode: z.string().trim().min(4).max(32),
  instructionsHtml: z.string().min(10),
  totalMarks: z.number().int().min(1),
  status: examStatusSchema.default("draft")
};

export const examCreateSchema = z.object(examSchemaFields);

export const examUpdateSchema = z.object(examSchemaFields).partial();

export const questionBaseSchema = z.object({
  type: questionTypeSchema,
  promptHtml: z.string().min(1),
  marks: z.number().int().min(0),
  sortOrder: z.number().int().min(1),
  assetUrl: assetUrlSchema.nullish().optional()
});

export const mcqQuestionSchema = questionBaseSchema.extend({
  type: z.literal("mcq"),
  optionAHtml: z.string().min(1),
  optionBHtml: z.string().min(1),
  optionCHtml: z.string().min(1),
  optionDHtml: z.string().min(1),
  correctOption: mcqOptionKeySchema
});

export const subjectiveQuestionSchema = questionBaseSchema.extend({
  type: z.literal("subjective"),
  optionAHtml: z.string().nullish().optional(),
  optionBHtml: z.string().nullish().optional(),
  optionCHtml: z.string().nullish().optional(),
  optionDHtml: z.string().nullish().optional(),
  correctOption: mcqOptionKeySchema.nullish().optional()
});

export const questionCreateSchema = z.discriminatedUnion("type", [
  mcqQuestionSchema,
  subjectiveQuestionSchema
]);

export const candidateRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(20),
  examCode: z.string().trim().min(4).max(32)
});

export const saveResponseSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: mcqOptionKeySchema.nullable().optional(),
  subjectiveAnswerHtml: z.string().nullable().optional()
});

export const heartbeatSchema = z.object({
  sessionId: z.string().min(1),
  status: sessionStatusSchema.optional(),
  currentQuestionId: z.string().min(1).nullable().optional()
});

export const violationCreateSchema = z.object({
  sessionId: z.string().min(1),
  type: z.string().min(3).max(100),
  severity: violationSeveritySchema,
  metadata: z.record(z.unknown()).default({})
});

export const subjectiveScoreSchema = z.object({
  awardedMarks: z.number().int().min(0),
  remarks: z.string().max(1000).nullable().optional()
});
