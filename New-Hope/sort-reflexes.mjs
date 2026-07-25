import { readFileSync, writeFileSync } from "fs";

let c = readFileSync("physiology_widget.jsx", "utf8");

// Find DETAIL_REFLEXES block
const start = c.indexOf("const DETAIL_REFLEXES");
const blockStart = c.indexOf("[", start);
let depth = 0, pos = blockStart;
for (let i = blockStart; i < c.length; i++) {
  if (c[i] === "[") depth++;
  else if (c[i] === "]") { depth--; if (depth === 0) { pos = i; break; } }
}

const before = c.substring(0, blockStart);
const block = c.substring(blockStart, pos + 1);
const after = c.substring(pos + 1);

// Parse entries
const entries = [];
const entryRegex = /\s*\{ name: "([^"]+)", sys: "([^"]+)",([\s\S]*?)\},/g;
let match;
while ((match = entryRegex.exec(block)) !== null) {
  entries.push({
    name: match[1],
    sys: match[2],
    rest: match[3],
    full: match[0].trim()
  });
}

console.log("Total entries:", entries.length);

// Sort by system order
const sysOrder = { Spinal: 0, Cardiovascular: 1, Respiratory: 2, Visceral: 3, Endocrine: 4, Brainstem: 5 };
entries.sort((a, b) => (sysOrder[a.sys] ?? 99) - (sysOrder[b.sys] ?? 99));

// Rebuild block
const newBlock = "[\n" + entries.map(e => "  " + e.full).join("\n") + "\n]";

c = before + newBlock + after;
writeFileSync("physiology_widget.jsx", c, "utf8");

// Verify
const check = readFileSync("physiology_widget.jsx", "utf8");
const checkBlock = check.substring(check.indexOf("[", check.indexOf("const DETAIL_REFLEXES")));
const checkEntries = [...checkBlock.matchAll(/\{ name: "([^"]+)", sys: "([^"]+)"/g)];
let lastSys = "";
for (const [, name, sys] of checkEntries) {
  if (sys !== lastSys) {
    console.log("\n=== " + sys + " ===");
    lastSys = sys;
  }
  console.log("  " + name);
}
