import { prisma } from "../lib/prisma.js";

export async function generateCandidateId() {
  const year = new Date().getFullYear();
  const prefix = `CAND-${year}-`;
  const lastSession = await prisma.candidateSession.findFirst({
    where: {
      candidateId: {
        startsWith: prefix
      }
    },
    orderBy: {
      candidateId: "desc"
    }
  });

  let nextNum = 1;
  if (lastSession) {
    const lastIdStr = lastSession.candidateId.replace(prefix, "");
    const lastNum = parseInt(lastIdStr, 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}
