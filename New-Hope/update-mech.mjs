import { readFileSync, writeFileSync } from "fs";

let c = readFileSync("src/mechanisms.js", "utf8");

const oldBlock = `  'Head\u2019s Paradoxical Reflex': [
    'Stimulus: Inflation of the lungs.',
    'Mechanism: Unlike the standard Hering\u2013Breuer reflex which halts inspiration, this reflex utilizes a different set of receptors or pathways to amplify the inspiratory effort.',
    'Response: Inflation induces further inflation.',
    'Significance: It is believed to be important in the first breath of a neonate, helping to achieve the high pressures needed to expand the collapsed fetal lungs, and also plays a role in the mechanism of gasping \\[History\\].',
  ],`;

const newBlock = `  'Head\u2019s Paradoxical Reflex': [
    'Receptor: Rapidly adapting receptors (RARs), also known as pulmonary irritant receptors, located within the airways.',
    'Centre/Nucleus: The medullary respiratory centers, specifically the Dorsal Respiratory Group (DRG) located in the Nucleus Tractus Solitarius (NTS).',
    'Stimulus: Inflation of the lungs, particularly a rapid stretch.',
    'Afferent Pathway: Sensory impulses are carried from the receptors in the lungs to the brainstem via the vagus nerve (CN X).',
    'Step 1: The stimulus (lung inflation) activates the rapidly adapting receptors.',
    'Step 2: Signals are sent via the vagus nerve to the NTS/DRG in the medulla.',
    'Step 3: Unlike the standard Hering\u2013Breuer inflation reflex (which inhibits inspiration), this reflex triggers a paradoxical further inflation or an additional, gasping inspiratory effort.',
    'Purpose: This reflex is responsible for the production of deep sighs, which help to re-expand collapsed areas of the lungs.',
    'Clinical Significance: It is clinically significant for the initial inflation of the lungs in a newborn baby, providing the powerful inspiratory force required to expand the previously collapsed alveoli for the first time.',
  ],`;

if (!c.includes(oldBlock)) {
  console.log("ERROR: oldBlock not found. Checking actual content...");
  const idx = c.indexOf("Head");
  if (idx >= 0) {
    console.log("Context:", JSON.stringify(c.substring(idx, idx + 200)));
  }
} else {
  c = c.replace(oldBlock, newBlock);
  writeFileSync("src/mechanisms.js", c, "utf8");
  console.log("Updated Head's Paradoxical Reflex mechanism.");
}
