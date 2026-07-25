const { PNC_DATA } = require('./pnc_data.js');
const { TOPIC_SYSTEM_MAP_FULL } = require('./topic_system_map.js');

function normalizeName(name) {
  return name.replace(/\s*\(.*?\)\s*/g, "").replace(/[–—−]/g, "-").replace(/['']/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
}

const e = PNC_DATA.find(e => e.name.includes('Barrett'));
console.log('PNC name:', JSON.stringify(e.name));
console.log('PNC norm:', normalizeName(e.name));

let matched = false;
for (const key of Object.keys(TOPIC_SYSTEM_MAP_FULL)) {
  if (normalizeName(key) === normalizeName(e.name)) {
    console.log('Matched via normalization to key:', JSON.stringify(key));
    matched = true;
    break;
  }
}
console.log('Match result:', matched);
