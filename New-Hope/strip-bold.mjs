import { readFileSync, writeFileSync } from "fs";

let c = readFileSync("physiology_widget.jsx", "utf8");

// Find DETAIL_REFLEXES block
const start = c.indexOf("const DETAIL_REFLEXES");
const blockStart = c.indexOf("[", start);

// Find end of block
let depth = 0, pos = blockStart;
for (let i = blockStart; i < c.length; i++) {
  if (c[i] === "[") depth++;
  else if (c[i] === "]") { depth--; if (depth === 0) { pos = i; break; } }
}

const before = c.substring(0, blockStart);
const block = c.substring(blockStart, pos + 1);
const after = c.substring(pos + 1);

// Strip ** markers only within the DETAIL_REFLEXES array
const cleaned = block.replace(/\*\*([^*]+)\*\*/g, "$1");

c = before + cleaned + after;
writeFileSync("physiology_widget.jsx", c, "utf8");

// Verify a few entries
const lines = c.split("\n");
for (const line of lines) {
  if (line.includes("Magnet Reaction") || line.includes("Tracheal Reflex") || line.includes("Clasp-Knife")) {
    if (line.includes("**")) {
      console.log("STILL HAS **:", line.substring(0, 120));
    } else {
      console.log("CLEAN:", line.substring(0, 120));
    }
  }
}
console.log("\nDone.");
