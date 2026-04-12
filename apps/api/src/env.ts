import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(8080),
  APP_ORIGIN: z.string().default("http://192.168.1.10"),
  FRONTEND_PORT: z.coerce.number().default(4173),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET should be at least 16 characters"),
  PROCTOR_API_TOKEN: z.string().min(8).default("change-me-proctor"),
  ADMIN_USERNAME: z.string().default("admin"),
  ADMIN_PASSWORD: z.string().default("ChangeMe123!"),
  UPLOADS_DIR: z.string().default("./apps/api/uploads"),
  PROCTOR_SERVICE_URL: z.string().default("http://localhost:8090"),
  ENABLE_AI_PROCTORING: z.string().default("false")
});

export const env = envSchema.parse(process.env);

export const isAiProctoringEnabled = env.ENABLE_AI_PROCTORING === "true";
