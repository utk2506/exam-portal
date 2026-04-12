import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __examPlatformPrisma__: PrismaClient | undefined;
}

export const prisma =
  global.__examPlatformPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__examPlatformPrisma__ = prisma;
}
