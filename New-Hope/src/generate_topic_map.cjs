const fs = require("fs");
const path = require("path");

const content = fs.readFileSync(
  path.resolve(__dirname, "../../Master_Topics.md"),
  "utf-8"
);

const SYSTEM_TAG_META = {
  GENERAL: "General Physiology",
  NEURO: "Neurophysiology",
  SENSES: "Special Senses",
  CVS: "Cardiovascular",
  RESP: "Respiratory",
  RENAL: "Renal",
  GI: "Gastrointestinal",
  ENDO: "Endocrine",
  REPRO: "Reproductive",
  HEME: "Haematology & Immunity",
  MSK: "Musculoskeletal",
  ANS: "Autonomic Nervous System",
  BIOCHEM: "Biochemistry & Cell Biology",
  PATH: "Pathophysiology",
  ENVIRON: "Environmental & Exercise",
};

const knownTags = new Set(Object.keys(SYSTEM_TAG_META));

const lines = content.split("\n");
const nameToTags = {};

for (const line of lines) {
  const boldMatch = line.match(/\*\*(.+?)\*\*/);
  if (!boldMatch) continue;
  const name = boldMatch[1].trim();
  const tags = [];
  const tagMatches = line.matchAll(/\[([A-Z]+)\]/g);
  for (const m of tagMatches) {
    if (knownTags.has(m[1])) tags.push(m[1]);
  }
  if (tags.length > 0) nameToTags[name] = tags;
}

let output =
  "// Auto-generated from Master_Topics.md — " +
  new Date().toISOString() +
  "\n";
output += "// Maps topic name -> system tag abbreviations\n\n";

output +=
  "export const TOPIC_SYSTEM_MAP = " +
  JSON.stringify(nameToTags, null, 2) +
  ";\n\n";
output +=
  "export const SYSTEM_TAG_META = " +
  JSON.stringify(SYSTEM_TAG_META, null, 2) +
  ";\n";

const outPath = path.resolve(__dirname, "topic_system_map.js");
fs.writeFileSync(outPath, output);
console.log(
  `Generated topic_system_map.js with ${Object.keys(nameToTags).length} entries`
);
