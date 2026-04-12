import { prisma } from "../lib/prisma.js";

export async function generateCandidateId() {
  const year = new Date().getFullYear();
  const prefix = `CAND-${year}-`;
  const count = await prisma.candidateSession.count({
    where: {
      candidateId: {
        startsWith: prefix
      }
    }
  });

  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}
