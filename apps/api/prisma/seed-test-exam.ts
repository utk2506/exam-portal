import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let exam = await prisma.exam.findFirst({ where: { examCode: "PHY-LIVE" } });

  if (exam) {
    exam = await prisma.exam.update({
      where: { id: exam.id },
      data: {
        status: "live"
      }
    });
    console.log("Updated exam:", exam.id, "→", exam.status);
  } else {
    exam = await prisma.exam.create({
      data: {
        title: "Physics Live Test",
        examCode: "PHY-LIVE",
        totalMarks: 30,
        instructionsHtml: "<p>Read each question carefully. Stay in fullscreen. Do not switch tabs.</p>",
        status: "live"
      }
    });
    console.log("Created exam:", exam.id);
  }

  await prisma.question.deleteMany({ where: { examId: exam.id } });

  await prisma.question.createMany({
    data: [
      {
        examId: exam.id,
        type: "mcq",
        promptHtml: "<p>What is the SI unit of force?</p>",
        optionAHtml: "<p>Joule</p>",
        optionBHtml: "<p>Newton</p>",
        optionCHtml: "<p>Watt</p>",
        optionDHtml: "<p>Pascal</p>",
        correctOption: "B",
        marks: 4,
        sortOrder: 1
      },
      {
        examId: exam.id,
        type: "mcq",
        promptHtml: "<p>What is the formula for kinetic energy?</p>",
        optionAHtml: "<p>mgh</p>",
        optionBHtml: "<p>Fs</p>",
        optionCHtml: "<p>half mv squared</p>",
        optionDHtml: "<p>ma</p>",
        correctOption: "C",
        marks: 4,
        sortOrder: 2
      },
      {
        examId: exam.id,
        type: "subjective",
        promptHtml: "<p>Explain Newton's Third Law of Motion with two real-world examples.</p>",
        marks: 10,
        sortOrder: 3
      }
    ]
  });

  console.log("✅ 3 questions seeded. Exam PHY-LIVE is LIVE (60 min duration).");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
