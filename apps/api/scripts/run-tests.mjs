import assert from "node:assert/strict";

import { examCreateSchema, questionCreateSchema } from "@exam-platform/shared";
import { McqOption, QuestionType } from "@prisma/client";

import { gradeSubmission } from "../dist/src/utils/grading.js";
import { createOptionOrderMap, shuffleArray } from "../dist/src/utils/randomization.js";

const tests = [
  {
    name: "gradeSubmission scores correct MCQs and keeps subjective grading pending",
    run() {
      const questions = [
        {
          id: "q1",
          examId: "exam-1",
          type: QuestionType.mcq,
          promptHtml: "<p>Question</p>",
          optionAHtml: "<p>A</p>",
          optionBHtml: "<p>B</p>",
          optionCHtml: "<p>C</p>",
          optionDHtml: "<p>D</p>",
          correctOption: McqOption.B,
          marks: 4,
          sortOrder: 1,
          assetUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "q2",
          examId: "exam-1",
          type: QuestionType.subjective,
          promptHtml: "<p>Explain</p>",
          optionAHtml: null,
          optionBHtml: null,
          optionCHtml: null,
          optionDHtml: null,
          correctOption: null,
          marks: 6,
          sortOrder: 2,
          assetUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const responses = [
        {
          id: "r1",
          sessionId: "session-1",
          questionId: "q1",
          selectedOption: McqOption.B,
          subjectiveAnswerHtml: null,
          savedAt: new Date(),
          finalSubmitted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = gradeSubmission({
        questions,
        responses,
        subjectiveScores: []
      });

      assert.equal(result.mcqScore, 4);
      assert.equal(result.subjectiveScore, 0);
      assert.equal(result.totalScore, 4);
      assert.equal(result.subjectivePendingCount, 1);
    }
  },
  {
    name: "shuffleArray keeps all items and createOptionOrderMap returns a full permutation",
    run() {
      const values = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(values);
      const optionMap = createOptionOrderMap();

      assert.equal(shuffled.length, values.length);
      assert.deepEqual([...shuffled].sort(), values);
      assert.deepEqual(Object.keys(optionMap).sort(), ["A", "B", "C", "D"]);
      assert.deepEqual(Object.values(optionMap).sort(), ["A", "B", "C", "D"]);
    }
  },
  {
    name: "shared schemas accept valid exams and reject incomplete payloads",
    run() {
      const questionResult = questionCreateSchema.safeParse({
        type: "subjective",
        promptHtml: "<p>Explain the law of reflection.</p>",
        marks: 5,
        sortOrder: 2,
        assetUrl: "/uploads/exams/exam-1/diagram.png"
      });

      const examResult = examCreateSchema.safeParse({
        title: "Physics Mock Test",
        examCode: "PHY-101",
        instructionsHtml: "<p>Read the instructions carefully before starting.</p>",
        totalMarks: 300,
        status: "draft"
      });

      const invalidExamResult = examCreateSchema.safeParse({
        examCode: "PHY-101",
        totalMarks: 300
      });

      assert.equal(questionResult.success, true);
      assert.equal(examResult.success, true);
      assert.equal(invalidExamResult.success, false);
    }
  }
];

let passed = 0;

for (const test of tests) {
  try {
    test.run();
    passed += 1;
    console.log(`PASS ${test.name}`);
  } catch (error) {
    console.error(`FAIL ${test.name}`);
    throw error;
  }
}

console.log(`${passed} tests passed.`);
