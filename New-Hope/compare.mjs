import { readFileSync } from "fs";

const content = readFileSync("physiology_widget.jsx", "utf-8");
const mechContent = readFileSync("src/mechanisms.js", "utf-8");

// Extract DETAIL_REFLEXES names
const detailNames = [];
const nameRegex = /name:\s*"([^"]+)"/g;
let m;
while ((m = nameRegex.exec(content)) !== null) {
  detailNames.push(m[1]);
}

// Extract MECHANISMS names
const mechNames = [];
const mechRegex = /'([^']+)':\s*\[/g;
let n;
while ((n = mechRegex.exec(mechContent)) !== null) {
  mechNames.push(n[1]);
}

console.log("DETAIL_REFLEXES count:", detailNames.length);
console.log("MECHANISMS count:", mechNames.length);

// Find mechanisms not in DETAIL_REFLEXES
const detailLower = detailNames.map((x) => x.toLowerCase());
const missing = [];

for (const mn of mechNames) {
  const ml = mn.toLowerCase();
  let found = false;
  for (const dl of detailLower) {
    if (ml.includes(dl) || dl.includes(ml)) {
      found = true;
      break;
    }
    const mWords = ml.split(/[\s,()/]+/).filter((w) => w.length > 4);
    const dWords = dl.split(/[\s,()/]+/).filter((w) => w.length > 4);
    const overlap = mWords.filter((w) => dWords.includes(w));
    if (overlap.length >= 2) {
      found = true;
      break;
    }
  }
  if (!found) {
    missing.push(mn);
  }
}

console.log("\nMechanisms NOT in DETAIL_REFLEXES (" + missing.length + "):");
for (const mn of missing) {
  console.log("  - " + mn);
}
