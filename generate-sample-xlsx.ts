import XLSX from "xlsx";

const rows = [
  {
    type: "mcq",
    promptHtml: "<p>What is the SI unit of electric current?</p>",
    optionAHtml: "<p>Volt</p>",
    optionBHtml: "<p>Ampere</p>",
    optionCHtml: "<p>Ohm</p>",
    optionDHtml: "<p>Watt</p>",
    correctOption: "B",
    marks: 4,
    sortOrder: 1,
    assetFilename: ""
  },
  {
    type: "mcq",
    promptHtml: "<p>Which planet is known as the Red Planet?</p>",
    optionAHtml: "<p>Jupiter</p>",
    optionBHtml: "<p>Venus</p>",
    optionCHtml: "<p>Mars</p>",
    optionDHtml: "<p>Saturn</p>",
    correctOption: "C",
    marks: 4,
    sortOrder: 2,
    assetFilename: ""
  },
  {
    type: "mcq",
    promptHtml: "<p>What is the chemical formula of water?</p>",
    optionAHtml: "<p>CO2</p>",
    optionBHtml: "<p>H2O2</p>",
    optionCHtml: "<p>H2O</p>",
    optionDHtml: "<p>NaCl</p>",
    correctOption: "C",
    marks: 4,
    sortOrder: 3,
    assetFilename: ""
  },
  {
    type: "mcq",
    promptHtml: "<p>Who invented the telephone?</p>",
    optionAHtml: "<p>Thomas Edison</p>",
    optionBHtml: "<p>Alexander Graham Bell</p>",
    optionCHtml: "<p>Nikola Tesla</p>",
    optionDHtml: "<p>James Watt</p>",
    correctOption: "B",
    marks: 4,
    sortOrder: 4,
    assetFilename: ""
  },
  {
    type: "mcq",
    promptHtml: "<p>What is the speed of light in vacuum (approx)?</p>",
    optionAHtml: "<p>3 x 10^6 m/s</p>",
    optionBHtml: "<p>3 x 10^8 m/s</p>",
    optionCHtml: "<p>3 x 10^10 m/s</p>",
    optionDHtml: "<p>3 x 10^4 m/s</p>",
    correctOption: "B",
    marks: 4,
    sortOrder: 5,
    assetFilename: ""
  },
  {
    type: "mcq",
    promptHtml: "<p>What is the powerhouse of the cell?</p>",
    optionAHtml: "<p>Nucleus</p>",
    optionBHtml: "<p>Ribosome</p>",
    optionCHtml: "<p>Mitochondria</p>",
    optionDHtml: "<p>Vacuole</p>",
    correctOption: "C",
    marks: 4,
    sortOrder: 6,
    assetFilename: ""
  },
  {
    type: "mcq",
    promptHtml: "<p>In which year did World War II end?</p>",
    optionAHtml: "<p>1943</p>",
    optionBHtml: "<p>1944</p>",
    optionCHtml: "<p>1945</p>",
    optionDHtml: "<p>1946</p>",
    correctOption: "C",
    marks: 4,
    sortOrder: 7,
    assetFilename: ""
  },
  {
    type: "mcq",
    promptHtml: "<p>What is the boiling point of water at sea level?</p>",
    optionAHtml: "<p>90°C</p>",
    optionBHtml: "<p>95°C</p>",
    optionCHtml: "<p>100°C</p>",
    optionDHtml: "<p>110°C</p>",
    correctOption: "C",
    marks: 4,
    sortOrder: 8,
    assetFilename: ""
  },
  {
    type: "subjective",
    promptHtml: "<p>Explain the concept of Newton's Law of Gravitation. How does it apply to planetary motion?</p>",
    optionAHtml: "",
    optionBHtml: "",
    optionCHtml: "",
    optionDHtml: "",
    correctOption: "",
    marks: 10,
    sortOrder: 9,
    assetFilename: ""
  },
  {
    type: "subjective",
    promptHtml: "<p>Describe the differences between renewable and non-renewable energy sources. Give two examples of each.</p>",
    optionAHtml: "",
    optionBHtml: "",
    optionCHtml: "",
    optionDHtml: "",
    correctOption: "",
    marks: 10,
    sortOrder: 10,
    assetFilename: ""
  }
];

const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Questions");
XLSX.writeFile(wb, "sample_questions_upload.xlsx");

console.log("✅ Created: sample_questions_upload.xlsx");
console.log("📋 Contains 8 MCQ + 2 Subjective questions");
console.log("📁 Upload this file via Admin → select exam → Import Questions (xlsx sheet upload)");
