import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { MECHANISMS, getMechanism } from "./src/mechanisms.js";
import PnCNotesViewer, { PnCNoteCard } from "./src/PnCNotesViewer.jsx";
import ClinicalConditionsViewer from "./src/ClinicalConditionsViewer.jsx";

const DATA_URL = "/physio_viva.json";
const REFLEX_URL = "/physio_reflex_details.json";
const NOTES_URL = "/physio_notes.json";
const CLINICAL_URL = "/physio_clinical.json";

const CAT_COLORS = {
  Laws: "#185FA5", Equations: "#3B6D11", Effects: "#534AB7",
  Reflexes: "#0F6E56", Syndromes: "#993C1D", "Tests & Signs": "#854F0B",
  "Bodies & Cells": "#72243E", Breathing: "#3C3489", Theories: "#5F5E5A",
  Anatomy: "#0F6E56",
};

const FALLBACK_DATA = [
  // LAWS
  { cat: "Laws", name: "Starling / Frank-Starling Law", def: "Force of cardiac contraction is directly proportional to the initial length (end-diastolic volume) of the muscle fiber." },
  { cat: "Laws", name: "Poiseuille's Law", def: "Rate of blood flow ∝ ΔP·r⁴ / (8ηL). Flow increases dramatically with vessel radius." },
  { cat: "Laws", name: "Ohm's Law", def: "Blood flow = ΔPressure / Resistance. Hemodynamic analogue of electrical Ohm's Law." },
  { cat: "Laws", name: "Law of Laplace", def: "Wall tension in a sphere: T = P·r / 2. Explains why small alveoli tend to collapse into large ones." },
  { cat: "Laws", name: "Landsteiner's Law", def: "In ABO system, if an agglutinogen is present on the RBC, the corresponding agglutinin is absent from plasma." },
  { cat: "Laws", name: "Bell-Magendie Law", def: "Dorsal spinal roots are sensory; ventral roots are motor. Established the anatomical basis of reflex arcs." },
  { cat: "Laws", name: "Einthoven's Law", def: "In ECG bipolar limb leads: Lead II = Lead I + Lead III. Defines the Einthoven triangle." },
  { cat: "Laws", name: "Fick's Law of Diffusion", def: "Net gas diffusion rate ∝ (surface area × ΔP) / membrane thickness. Basis of lung diffusion capacity." },
  { cat: "Laws", name: "Boyle's Law", def: "At constant temperature, gas volume is inversely proportional to pressure (PV = constant)." },
  { cat: "Laws", name: "Charles' Law", def: "At constant pressure, gas volume is directly proportional to absolute temperature." },
  { cat: "Laws", name: "Dalton's Law", def: "Total pressure of a gas mixture = sum of partial pressures of each individual gas." },
  { cat: "Laws", name: "Henry's Law", def: "Amount of gas dissolved in liquid ∝ its partial pressure above the liquid." },
  { cat: "Laws", name: "Graham's Law", def: "Rate of gas diffusion ∝ 1/√molecular weight. By this law O₂ (MW 32) diffuses faster than CO₂ (MW 44) in air; however, CO₂ diffuses ~20× faster than O₂ across biological membranes due to its far higher solubility (Fick's Law)." },
  { cat: "Laws", name: "Avogadro's Law", def: "Equal volumes of any gas at same temperature and pressure contain equal numbers of molecules." },
  { cat: "Laws", name: "All-or-None Law", def: "A tissue either responds maximally to a threshold stimulus or does not respond at all. Applies to cardiac muscle and individual nerve fibers." },
  { cat: "Laws", name: "Law of the Intestine", def: "Bolus of food causes contraction orad (behind) and relaxation aborad (ahead) — basis of peristalsis." },
  { cat: "Laws", name: "Weber-Fechner Law", def: "Perceived sensation ∝ log(stimulus intensity). Explains why we hear in decibels." },
  { cat: "Laws", name: "Power Law (Stevens)", def: "Relates actual stimulus strength to perceived signal strength by a power function (ψ = k·φⁿ)." },
  { cat: "Laws", name: "Law of Projection", def: "Stimulation of a sensory pathway at any point causes sensation to be referred to the original receptor location." },
  { cat: "Laws", name: "Marey's Law", def: "Heart rate is inversely proportional to blood pressure (baroreceptor basis)." },
  { cat: "Laws", name: "Monro-Kellie Doctrine", def: "Total volume in the rigid cranium (brain + blood + CSF) is constant; increase in one must be offset by decrease in another." },
  { cat: "Laws", name: "Bernoulli Principle", def: "As fluid velocity increases, its lateral pressure decreases. Explains murmurs, Venturi effect, and airway dynamics." },
  { cat: "Laws", name: "Ideal Gas Law", def: "PV = nRT. Approximates gas behaviour in respiratory physiology under varying pressures and temperatures." },
  { cat: "Laws", name: "Law of Forward Conduction", def: "At a chemical synapse, impulses travel only from presynaptic to postsynaptic neuron — enforces one-directional signalling." },
  // EQUATIONS
  { cat: "Equations", name: "Nernst Equation", def: "Calculates equilibrium potential for a single ion: E = (RT/zF) × ln([X]o/[X]i)." },
  { cat: "Equations", name: "Goldman-Hodgkin-Katz (GHK)", def: "Calculates resting membrane potential when multiple ions (Na⁺, K⁺, Cl⁻) and their permeabilities are considered." },
  { cat: "Equations", name: "Henderson-Hasselbalch", def: "pH = pKa + log([HCO₃⁻] / 0.03×PaCO₂). Used to interpret acid-base status." },
  { cat: "Equations", name: "Bohr's Equation", def: "Estimates physiological dead space: Vd/Vt = (PaCO₂ − PeCO₂) / PaCO₂." },
  { cat: "Equations", name: "Bazett's Formula", def: "Corrects QT interval for heart rate: QTc = QT / √RR. Normal QTc < 440 ms." },
  { cat: "Equations", name: "Radford's Formula", def: "Predicts anatomical dead space (mL) ≈ 2.2 × body weight (lbs)." },
  { cat: "Equations", name: "Dubois Formula", def: "Calculates body surface area (m²) from height and weight; used to derive cardiac index." },
  { cat: "Equations", name: "Fick Principle", def: "Cardiac output = O₂ consumption / (arterial O₂ − venous O₂). Gold-standard method for measuring cardiac output." },
  { cat: "Equations", name: "Poiseuille-Hagen Formula", def: "Resistance = 8ηL / πr⁴. Relates viscosity, tube length, and radius to flow resistance." },
  { cat: "Equations", name: "Erlanger-Gasser Classification", def: "Classifies nerve fibers by diameter and conduction velocity: Aα > Aβ > Aγ > Aδ > B > C." },
  // EFFECTS
  { cat: "Effects", name: "Bohr Effect", def: "↑H⁺ or ↑CO₂ shifts O₂-Hb dissociation curve right → lower O₂ affinity → easier O₂ unloading in tissues." },
  { cat: "Effects", name: "Haldane Effect", def: "Oxygenation of Hb in lungs displaces CO₂, doubling CO₂ release. Complement of the Bohr effect." },
  { cat: "Effects", name: "Hamburger Shift (Chloride Shift)", def: "In tissues, HCO₃⁻ exits RBC in exchange for Cl⁻ to maintain electrical neutrality." },
  { cat: "Effects", name: "Gibbs-Donnan Effect", def: "Asymmetric ion distribution across a membrane caused by the presence of nondiffusible charged proteins on one side." },
  { cat: "Effects", name: "Treppe (Staircase)", def: "Progressive increase in contraction force during rapid, repeated stimulation of a previously resting muscle." },
  { cat: "Effects", name: "Bowditch Phenomenon", def: "Increased heart rate → increased force of contraction (positive force-frequency relationship)." },
  { cat: "Effects", name: "Fenn Effect", def: "Muscle uses extra energy proportional to the external work it performs." },
  { cat: "Effects", name: "Post-Extrasystolic Potentiation", def: "The beat after a compensatory pause (following an ectopic beat) is stronger than normal due to increased Ca²⁺ loading." },
  { cat: "Effects", name: "Post-Tetanic Potentiation", def: "Twitch amplitude is increased immediately after a tetanic contraction ends." },
  { cat: "Effects", name: "Anrep Effect", def: "Acute ↑ afterload → compensatory ↑ myocardial contractility. Intrinsic cardiac autoregulation." },
  { cat: "Effects", name: "Wolff-Chaikoff Effect", def: "Very high iodide dose acutely inhibits thyroid hormone synthesis (organification block)." },
  { cat: "Effects", name: "Jod-Basedow Phenomenon", def: "Excess iodine administration triggers hyperthyroidism in a susceptible thyroid gland." },
  { cat: "Effects", name: "Aldosterone Escape", def: "After 3-5 days of excess aldosterone, kidneys escape Na⁺ retention via ANP and pressure natriuresis." },
  { cat: "Effects", name: "Purkinje Shift", def: "In dim light the eye shifts maximum sensitivity from ~555 nm (photopic) to ~505 nm (scotopic)." },
  { cat: "Effects", name: "Lewis-Hunting Response", def: "Rhythmic vasoconstriction then vasodilation during sustained cold exposure — protects against frostbite." },
  { cat: "Effects", name: "Latch-Bridge Mechanism", def: "Smooth muscle cross-bridges lock in a low-energy state, sustaining tension without continued ATP hydrolysis." },
  { cat: "Effects", name: "Clasp-Knife Phenomenon", def: "Sudden collapse of resistance when a spastic limb is passively stretched (Golgi tendon organ activation)." },
  { cat: "Effects", name: "Windkessel Effect", def: "Large elastic arteries buffer pulsatile flow from the heart into a more continuous peripheral flow." },
  { cat: "Effects", name: "Alpha Block (Arousal Response)", def: "Disappearance of alpha rhythm (8-13 Hz) on EEG upon eye opening or mental effort; replaced by desynchronised beta waves." },
  { cat: "Effects", name: "Déjà Vu", def: "Inappropriate sense of familiarity with a new situation; associated with temporal lobe activity." },
  { cat: "Effects", name: "Dale's Phenomenon", def: "A neuron releases the same neurotransmitter(s) at all of its synaptic terminals. Basis for classifying neurons as 'cholinergic', 'dopaminergic', etc." },
  { cat: "Effects", name: "Renshaw Inhibition", def: "Motor neurons activate Renshaw cells (inhibitory interneurons) that feed back to inhibit the same motor neurons." },
  { cat: "Effects", name: "P Factor (Lewis Factor)", def: "Chemical substance (likely K⁺) that accumulates in ischemic muscle and stimulates nociceptors — responsible for anginal pain." },
  { cat: "Effects", name: "Place Principle", def: "Different frequencies stimulate specific tonotopic locations along the basilar membrane, enabling pitch discrimination." },
  { cat: "Effects", name: "Volley Principle", def: "Groups of auditory nerve fibres fire in volleys to encode high-frequency sound information beyond the limit of a single fibre." },
  { cat: "Effects", name: "Mittelschmerz", def: "Brief lower abdominal pain at mid-cycle ovulation caused by minor peritoneal irritation from follicular fluid release." },
  { cat: "Effects", name: "Dumping Syndrome", def: "Post-gastrectomy rapid gastric emptying → osmotic fluid shift into gut → weakness, sweating, palpitations after meals." },
  { cat: "Effects", name: "Occlusion", def: "When inputs to a neuronal pool overlap, combined response is less than the arithmetic sum of individual responses." },
  { cat: "Effects", name: "Subliminal Fringe (Summation)", def: "Inputs that individually fail to reach threshold can summate to produce a supramaximal combined response." },
  // REFLEXES
  { cat: "Reflexes", name: "Bainbridge Reflex", def: "Atrial wall stretch (↑venous return) → ↑heart rate via vagal inhibition and sympathetic activation." },
  { cat: "Reflexes", name: "Bezold-Jarisch Reflex", def: "Chemical stimulation of ventricular/coronary C-fiber receptors → classic triad of bradycardia, hypotension, and apnea (followed by rapid shallow breathing). Also called coronary chemoreflex." },
  { cat: "Reflexes", name: "Hering-Breuer Reflex", def: "Lung inflation activates pulmonary stretch receptors → inhibits further inspiration (inflation reflex)." },
  { cat: "Reflexes", name: "Head’s Paradoxical Reflex", def: "Strong lung inflation paradoxically stimulates further inspiratory effort (opposite of Hering-Breuer)." },
  { cat: "Reflexes", name: "Cushing's Reflex", def: "↑Intracranial pressure → intense systemic hypertension + bradycardia + irregular respirations (= Cushing's triad). Driven by direct CO₂/ischaemia stimulation of the RVLM." },
  { cat: "Reflexes", name: "J (Juxtacapillary) Reflex", def: "Pulmonary congestion stimulates J receptors → rapid shallow breathing (dyspnea)." },
  { cat: "Reflexes", name: "Axon Reflex", def: "Antidromic conduction in sensory C fibers after skin injury releases substance P → local arteriolar dilation (flare)." },
  { cat: "Reflexes", name: "Enterogastric Reflex", def: "Duodenal distension or fat/acid → inhibits gastric motility and secretion." },
  { cat: "Reflexes", name: "Gastrocolic Reflex", def: "Stomach distension after a meal → ↑colonic motility (explains postprandial urge to defecate)." },
  { cat: "Reflexes", name: "Micturition Reflex", def: "Bladder stretch receptors → parasympathetic detrusor contraction + urethral sphincter relaxation." },
  { cat: "Reflexes", name: "Mass Reflex", def: "After severe spinal cord injury, a minor stimulus below the lesion triggers widespread flexor spasms + bowel/bladder evacuation." },
  { cat: "Reflexes", name: "Vestibulo-Ocular Reflex", def: "Head rotation → compensatory eye movement in the opposite direction to stabilise retinal image." },
  { cat: "Reflexes", name: "Accommodation Reflex", def: "Near vision: lens thickens (ciliary muscle contracts), pupils constrict, eyes converge." },
  { cat: "Reflexes", name: "Pupillary Light Reflex", def: "Light → optic nerve → pretectal nucleus → bilateral Edinger-Westphal → pupil constriction." },
  { cat: "Reflexes", name: "Consensual Light Reflex", def: "Light in one eye → constriction of the OPPOSITE pupil (bilateral efferent limb of light reflex)." },
  { cat: "Reflexes", name: "Tympanic (Acoustic) Reflex", def: "Loud sound → contraction of stapedius and tensor tympani → stiffens ossicular chain, protects cochlea." },
  { cat: "Reflexes", name: "Phillipson's / Crossed Extensor Reflex", def: "Noxious stimulus to one limb → flexion of that limb + extension of the contralateral limb." },
  { cat: "Reflexes", name: "Peristaltic (Myenteric) Reflex", def: "Contraction orad + relaxation aborad to a gut bolus — the basis of normal propulsion." },
  // SYNDROMES
  { cat: "Syndromes", name: "Brown-Séquard Syndrome", def: "Spinal cord hemisection: ipsilateral motor loss + fine touch/proprioception loss; contralateral pain/temperature loss." },
  { cat: "Syndromes", name: "Horner's Syndrome", def: "Sympathetic chain damage: ptosis, miosis, anhidrosis (enophthalmos) on the ipsilateral side." },
  { cat: "Syndromes", name: "Klüver-Bucy Syndrome", def: "Bilateral amygdala damage: hyperorality, hypersexuality, visual agnosia, fearlessness, and placidity." },
  { cat: "Syndromes", name: "WPW Syndrome", def: "Bundle of Kent bypasses AV node → short PR, delta wave, wide QRS, risk of re-entrant tachycardia." },
  { cat: "Syndromes", name: "LGL Syndrome", def: "Pre-excitation via James fibers: short PR interval but NORMAL QRS (unlike WPW)." },
  { cat: "Syndromes", name: "Wenckebach (Mobitz I)", def: "Progressive PR prolongation until a QRS is dropped, then cycle repeats. AV nodal block." },
  { cat: "Syndromes", name: "Stokes-Adams Syndrome", def: "Sudden loss of consciousness due to transient complete heart block → cardiac asystole." },
  { cat: "Syndromes", name: "Sick Sinus Syndrome", def: "SA node dysfunction → inappropriate bradycardia, sinus arrest, tachy-brady syndrome." },
  { cat: "Syndromes", name: "Long QT Syndrome", def: "Delayed ventricular repolarisation (KVLQT1 mutation etc.) → risk of torsades de pointes and sudden death." },
  { cat: "Syndromes", name: "Zollinger-Ellison Syndrome", def: "Gastrinoma (often in pancreas/duodenum) → massive gastrin excess → peptic ulceration + diarrhea." },
  { cat: "Syndromes", name: "Bartter Syndrome", def: "Loss-of-function mutation in thick ascending loop transporters → hypokalemia, metabolic alkalosis, high renin/aldosterone, normotension." },
  { cat: "Syndromes", name: "Gitelman Syndrome", def: "Like Bartter but affects DCT thiazide-sensitive transporter → also hypomagnesemia + hypocalciuria." },
  { cat: "Syndromes", name: "Liddle's Syndrome", def: "Gain-of-function ENaC mutation → looks like hyperaldosteronism but renin and aldosterone are LOW." },
  { cat: "Syndromes", name: "Gordon Syndrome", def: "Pseudohypoaldosteronism Type II: hyperkalemia + hypertension with normal GFR. Opposite of Bartter." },
  { cat: "Syndromes", name: "Fanconi Syndrome", def: "Generalised proximal tubule dysfunction: glucosuria, aminoaciduria, phosphaturia, bicarbonaturia." },
  { cat: "Syndromes", name: "Hartnup Disease", def: "Defective neutral amino acid transporter in intestine and proximal tubule → pellagra-like rash, ataxia." },
  { cat: "Syndromes", name: "Kallmann Syndrome", def: "GnRH neuron migration failure → hypogonadotropic hypogonadism + anosmia (absent olfactory bulbs)." },
  { cat: "Syndromes", name: "Addison's Disease", def: "Primary adrenal insufficiency: fatigue, hyperpigmentation, hypotension, hyponatremia, hyperkalemia." },
  { cat: "Syndromes", name: "Cushing's Syndrome", def: "Chronic cortisol excess: central obesity, moon face, buffalo hump, striae, hypertension." },
  { cat: "Syndromes", name: "Hashimoto's Disease", def: "Autoimmune thyroiditis: anti-TPO antibodies destroy follicles → hypothyroidism. Most common thyroid disease." },
  { cat: "Syndromes", name: "Ménière's Disease", def: "Endolymphatic hydrops: episodic vertigo + fluctuating sensorineural hearing loss + tinnitus + aural fullness." },
  { cat: "Syndromes", name: "Weber Syndrome", def: "Midbrain lesion at CN III nucleus: ipsilateral CN III palsy + contralateral hemiplegia." },
  { cat: "Syndromes", name: "Millard-Gubler Syndrome", def: "Pons lesion: ipsilateral CN VI & VII palsy + contralateral hemiplegia." },
  { cat: "Syndromes", name: "Avellis Syndrome", def: "Paralysis of CN X (vagus) of one side (LMN type) + contralateral hemiplegia (crossed hemiplegia). Lesion in the medulla." },
  { cat: "Syndromes", name: "Adiposogenital (Fröhlich) Syndrome", def: "Hypothalamic damage → hypogonadism + obesity. Distinct from simple obesity." },
  { cat: "Syndromes", name: "Lambert-Eaton Syndrome", def: "Autoimmune attack on presynaptic Ca²⁺ channels at NMJ → proximal weakness that IMPROVES with repetition." },
  { cat: "Syndromes", name: "Guillain-Barré Syndrome", def: "Acute immune demyelination of peripheral nerves → ascending flaccid paralysis, areflexia." },
  { cat: "Syndromes", name: "Metabolic Syndrome (Syndrome X)", def: "Cluster: central obesity + insulin resistance + hypertension + dyslipidaemia + hyperglycaemia." },
  { cat: "Syndromes", name: "Zellweger Syndrome", def: "Peroxisome biogenesis disorder: absent peroxisomes → accumulation of very-long-chain fatty acids. Neonatal." },
  { cat: "Syndromes", name: "Hirschsprung's Disease", def: "Congenital absence of myenteric ganglion cells in colon → failure of relaxation → functional obstruction." },
  { cat: "Syndromes", name: "Pendred Syndrome", def: "Defective thyroid organification of iodine + sensorineural deafness (pendrin mutation)." },
  { cat: "Syndromes", name: "Monge's Disease", def: "Chronic Mountain Sickness: polycythaemia, pulmonary hypertension, cor pulmonale in long-term highlanders." },
  { cat: "Syndromes", name: "Stein-Leventhal (PCOS)", def: "Polycystic ovarian syndrome: hyperandrogenism, chronic anovulation, insulin resistance." },
  { cat: "Syndromes", name: "Chiari-Frommel Syndrome", def: "Persistent galactorrhoea + amenorrhoea + uterine atrophy after childbirth (hyperprolactinaemia)." },
  { cat: "Syndromes", name: "Menetrier Disease", def: "Giant rugal folds + protein-losing gastropathy + increased mucus; premalignant." },
  { cat: "Syndromes", name: "Sjögren's Syndrome", def: "Autoimmune exocrinopathy: xerostomia + xerophthalmia. Anti-Ro (SS-A) and Anti-La (SS-B) antibodies." },
  { cat: "Syndromes", name: "Raynaud's Disease", def: "Episodic digital vasospasm in response to cold/stress → white → blue → red colour changes." },
  { cat: "Syndromes", name: "Buerger's Disease", def: "Thromboangiitis obliterans: inflammatory arterial occlusion in young male smokers → claudication, gangrene." },
  { cat: "Syndromes", name: "Huntington's Disease", def: "CAG repeat expansion in huntingtin gene → progressive chorea, dementia, psychiatric symptoms." },
  { cat: "Syndromes", name: "Tetralogy of Fallot", def: "Four defects: VSD + pulmonary stenosis + overriding aorta + RVH → right-to-left shunt → cyanotic 'blue baby'." },
  { cat: "Syndromes", name: "Barrett's Oesophagus", def: "Intestinal metaplasia of oesophageal squamous epithelium due to chronic GORD; premalignant." },
  { cat: "Syndromes", name: "Ebstein's Anomaly", def: "Apical displacement of tricuspid valve leaflets → atrialized RV → intermittent cyanosis + arrhythmias." },
  { cat: "Syndromes", name: "Duchenne / Becker Muscular Dystrophy", def: "X-linked dystrophin gene mutations → progressive muscle degeneration. Duchenne = absent dystrophin; Becker = reduced." },
  { cat: "Syndromes", name: "Whipple's Disease", def: "Tropheryma whipplei infection → malabsorption, diarrhea, arthralgias, PAS-positive macrophages in lamina propria." },
  { cat: "Syndromes", name: "Refsum Disease", def: "Phytanic acid oxidase deficiency (peroxisomal) → accumulation of phytanic acid → neuropathy, retinitis, ataxia." },
  // TESTS & SIGNS
  { cat: "Tests & Signs", name: "Argyll Robertson Pupil", def: "Accommodation present but light reflex absent. Seen in neurosyphilis. Mnemonic: ARP (Accommodation Reflex Present) / PRA (Pupillary Reflex Absent)." },
  { cat: "Tests & Signs", name: "Adie Tonic Pupil", def: "Ciliary ganglion lesion: dilated pupil with very slow (tonic) response to light and accommodation." },
  { cat: "Tests & Signs", name: "Romberg Sign", def: "Loss of balance when standing with feet together and eyes closed → posterior column/proprioception lesion." },
  { cat: "Tests & Signs", name: "Babinski Sign", def: "Extension (dorsiflexion) of big toe on plantar stimulation → upper motor neuron lesion." },
  { cat: "Tests & Signs", name: "Chvostek's Sign", def: "Tapping facial nerve at parotid → ipsilateral facial muscle twitch; indicates hypocalcaemia." },
  { cat: "Tests & Signs", name: "Trousseau's Sign", def: "Carpal spasm with BP cuff inflated above systolic for 3 minutes; indicates hypocalcaemia." },
  { cat: "Tests & Signs", name: "Corrigan's Pulse", def: "Water-hammer (collapsing) pulse of aortic regurgitation — rapid upstroke and sudden collapse." },
  { cat: "Tests & Signs", name: "Cannon Wave", def: "Giant 'a' wave in JVP when right atrium contracts against closed tricuspid valve (complete heart block)." },
  { cat: "Tests & Signs", name: "Charcot's Triad (cerebellar)", def: "Nystagmus + intention tremor + scanning speech — classic triad of cerebellar disease (e.g., MS)." },
  { cat: "Tests & Signs", name: "Myerson's Sign", def: "Inability to suppress blink to repeated glabellar taps — seen in Parkinson's disease." },
  { cat: "Tests & Signs", name: "Queckenstedt Test", def: "During LP, compress jugular veins → CSF pressure should rise rapidly; failure suggests spinal subarachnoid block." },
  { cat: "Tests & Signs", name: "Schilling Test", def: "Two-stage test: oral radioactive B₁₂ ± intrinsic factor to identify cause of B₁₂ malabsorption." },
  { cat: "Tests & Signs", name: "Hollander (Insulin) Test", def: "Insulin-induced hypoglycaemia stimulates vagus → measures gastric acid output (tests vagotomy completeness)." },
  { cat: "Tests & Signs", name: "Jendrassik's Maneuver", def: "Patient hooks fingers and pulls apart → reinforces patellar/ankle reflexes by reducing cortical inhibition." },
  { cat: "Tests & Signs", name: "Rinne's Test", def: "Tuning fork: AC > BC = normal or sensorineural; BC > AC = conductive deafness." },
  { cat: "Tests & Signs", name: "Weber's Test", def: "Tuning fork on vertex: lateralises to BETTER ear in sensorineural, WORSE ear in conductive deafness." },
  { cat: "Tests & Signs", name: "Ishihara Charts", def: "Pseudoisochromatic plates using coloured dots to screen for red-green colour blindness." },
  { cat: "Tests & Signs", name: "Spinnbarkeit Test", def: "Measures the elasticity/stretchability of cervical mucus — peaks at ovulation due to oestrogen effect." },
  { cat: "Tests & Signs", name: "Van den Bergh Test", def: "Differentiates conjugated (direct) from unconjugated (indirect) bilirubin in serum." },
  { cat: "Tests & Signs", name: "Barany's Chair", def: "Rotating chair used to test semicircular canal function by inducing nystagmus." },
  { cat: "Tests & Signs", name: "Bjerrum Screen", def: "Tangent screen used to map the central visual field and detect scotomas." },
  { cat: "Tests & Signs", name: "Auer Bodies", def: "Abnormal azurophilic primary granules in myeloid blasts — pathognomonic of AML." },
  { cat: "Tests & Signs", name: "Howell-Jolly Bodies", def: "Nuclear remnants in RBCs — seen post-splenectomy, in haemolytic anaemia, megaloblastic anaemia." },
  { cat: "Tests & Signs", name: "Arneth Count", def: "Classification of neutrophils by number of nuclear lobes; left shift (fewer lobes) = immature cells; right shift = hypersegmentation." },
  { cat: "Tests & Signs", name: "Barr Body", def: "Condensed inactive X chromosome visible in female cell nuclei; number = (X chromosomes − 1)." },
  { cat: "Tests & Signs", name: "Snellen's Chart", def: "Standardised chart of letters at distance to measure visual acuity (6/6 or 20/20 is normal)." },
  { cat: "Tests & Signs", name: "Jaeger's Chart", def: "Near-vision chart (J1–J7) used to assess reading vision and presbyopia." },
  { cat: "Tests & Signs", name: "Caloric Test", def: "Ice water irrigation of ear canal → tests oculovestibular reflex; absent response indicates brainstem death." },
  { cat: "Tests & Signs", name: "Doll's Eyes Response", def: "Passive head rotation → eyes should move opposite (brainstem intact); absent = brainstem lesion." },
  // BODIES & CELLS
  { cat: "Bodies & Cells", name: "Herring Bodies", def: "Axonal dilations in the posterior pituitary containing neurosecretory granules (ADH and oxytocin)." },
  { cat: "Bodies & Cells", name: "Kupffer Cells", def: "Resident macrophages lining hepatic sinusoids — phagocytose bacteria and old RBCs." },
  { cat: "Bodies & Cells", name: "Purkinje Fibers", def: "Fastest conducting cells of the cardiac conduction system (2-4 m/s); also large inhibitory neurons in cerebellar cortex." },
  { cat: "Bodies & Cells", name: "Renshaw Cells", def: "Inhibitory glycinergic interneurons in spinal cord ventral horn — provide recurrent inhibition to motor neurons." },
  { cat: "Bodies & Cells", name: "Node of Ranvier", def: "Unmyelinated gap between Schwann cell segments on a myelinated axon — site of saltatory conduction." },
  { cat: "Bodies & Cells", name: "Tamm-Horsfall Protein", def: "Glycoprotein synthesised by thick ascending limb cells; most abundant urinary protein, forms urinary casts." },
  { cat: "Bodies & Cells", name: "C-Peptide", def: "By-product of proinsulin cleavage; equimolar with insulin; marker of endogenous insulin secretion." },
  { cat: "Bodies & Cells", name: "K-Complexes", def: "High-amplitude negative-positive EEG waves in NREM Stage 2 sleep; also triggered by external stimuli." },
  { cat: "Bodies & Cells", name: "Sleep Spindles", def: "Bursts of 12-14 Hz oscillations in NREM Stage 2 generated by thalamic reticular nucleus." },
  { cat: "Bodies & Cells", name: "Spaces of Disse", def: "Perisinusoidal spaces between hepatocytes and sinusoidal endothelium — allow exchange of proteins and lipoproteins." },
  { cat: "Bodies & Cells", name: "Brunner's Glands", def: "Submucosal glands in the duodenum secreting alkaline mucus to neutralise gastric acid entering the duodenum." },
  { cat: "Bodies & Cells", name: "Pre-Bötzinger Complex", def: "Pacemaker neuron cluster in the ventral medulla acting as the central pattern generator for respiratory rhythm." },
  // ANATOMY
  { cat: "Anatomy", name: "Papez Circuit", def: "Neural loop: hippocampus → mammillary bodies → anterior thalamus → cingulate cortex → entorhinal cortex → hippocampus. Critical for memory and emotion." },
  // BREATHING
  { cat: "Breathing", name: "Kussmaul Breathing", def: "Deep, rapid, laboured breathing; compensatory hyperventilation in metabolic acidosis (e.g., DKA)." },
  { cat: "Breathing", name: "Cheyne-Stokes Breathing", def: "Waxing-and-waning tidal volume with periodic apnea; caused by delayed feedback from low cardiac output to central chemoreceptors. Seen in heart failure, bilateral cerebral hemisphere lesions, and high altitude." },
  { cat: "Breathing", name: "Biot's Respiration", def: "Clusters of breaths then unpredictable apnea; caused by dorsal medullary lesions or raised ICP." },
  { cat: "Breathing", name: "Ondine's Curse", def: "Loss of automatic respiratory drive (medullary pacemaker lesion) requiring voluntary control to breathe." },
  { cat: "Breathing", name: "Apneustic Breathing", def: "Prolonged inspiratory gasps with brief expiration; caused by lesion of the pneumotaxic centre in the pons." },
  // THEORIES
  { cat: "Theories", name: "Young-Helmholtz Theory", def: "Trichromatic colour vision based on three cone types: L (red), M (green), S (blue). Colour blindness = missing one cone type." },
  { cat: "Theories", name: "Sliding-Filament Theory", def: "Muscle contraction occurs by thin actin filaments sliding over thick myosin filaments — sarcomere shortens but filaments do not." },
  { cat: "Theories", name: "Walk-Along (Ratchet) Theory", def: "Myosin cross-bridges attach, pull (powerstroke), detach, and reattach further along actin in a cyclical ratchet." },
  { cat: "Theories", name: "Traveling Wave Hypothesis", def: "Sound sets up a wave along the basilar membrane; each frequency peaks at a specific location (tonotopy)." },
  { cat: "Theories", name: "Milieu Intérieur", def: "Claude Bernard's concept: the internal fluid environment must remain constant for cells to function optimally." },
  { cat: "Theories", name: "Hayflick Limit", def: "Normal human somatic cells can divide ~50-70 times before entering senescence due to telomere shortening." },
];

const CATS = ["All", ...Object.keys(CAT_COLORS)];

const FALLBACK_DETAIL_REFLEXES = [
  { name: "Stretch reflex (phasic)", sys: "Spinal", receptor: "Muscle spindle (primary endings)", center: "Spinal cord (monosynaptic)", nucleus: "Alpha motor neurons (anterior horn)", stimulus: "Sudden stretch of muscle", response: "Rapid contraction of the stretched muscle", purpose: "Opposes sudden changes in muscle length; smooths movement" },
  { name: "Stretch reflex (tonic)", sys: "Spinal", receptor: "Muscle spindle (primary & secondary endings)", center: "Spinal cord", nucleus: "Alpha & gamma motor neurons (anterior horn)", stimulus: "Sustained stretch of muscle", response: "Sustained muscle contraction", purpose: "Maintenance of muscle tone and stable posture" },
  { name: "Inverse stretch reflex", sys: "Spinal", receptor: "Golgi tendon organ (GTO)", center: "Spinal cord (disynaptic)", nucleus: "Ib inhibitory interneurons (anterior horn)", stimulus: "Strong stretch or active muscle contraction", response: "Inhibition/relaxation of the agonist muscle", purpose: "Protects muscle and tendon from excessive tension" },
  { name: "Withdrawal (flexor) reflex", sys: "Spinal", receptor: "Nociceptors (pain receptors)", center: "Spinal cord (polysynaptic)", nucleus: "Flexor reflex interneurons (dorsal horn -> anterior horn)", stimulus: "Noxious or painful stimulus", response: "Flexion of the stimulated limb", purpose: "Protective withdrawal from injury-causing stimuli" },
  { name: "Crossed extensor reflex", sys: "Spinal", receptor: "Nociceptors", center: "Spinal cord (polysynaptic)", nucleus: "Commissural interneurons crossing midline (anterior horn)", stimulus: "Strong painful stimulus to a limb", response: "Extension of the opposite limb", purpose: "Supports body weight and pushes body away from stimulus" },
  { name: "Positive supporting reaction", sys: "Spinal", receptor: "Tactile receptors in footpad", center: "Spinal cord", nucleus: "Extensor motor neurons (anterior horn)", stimulus: "Pressure applied to the footpad", response: "Limb extension against the applied pressure", purpose: "Helps stiffen limbs to support body weight against gravity" },
  { name: "Negative supporting reaction", sys: "Spinal", receptor: "Proprioceptors in extensor muscles", center: "Spinal cord", nucleus: "Ib inhibitory interneurons; Renshaw cells", stimulus: "Sustained stretch of extensor muscles", response: "Active relaxation of the extensor muscles", purpose: "Allows for the disengagement of static standing" },
  { name: "Mass reflex", sys: "Spinal", receptor: "Nociceptors or pelvic viscera stretch receptors", center: "Spinal cord", nucleus: "Isolated spinal interneuron pools (below lesion level)", stimulus: "Intense pain or overdistension of bladder/gut", response: "Generalized flexor spasm; bowel/bladder evacuation", purpose: "Mass discharge following severe spinal cord injury" },
  { name: "Coitus reflex", sys: "Spinal", receptor: "Tactile receptors in glans/genitals", center: "Spinal cord", nucleus: "Onuf's nucleus (S2-S4); sacral parasympathetic nucleus", stimulus: "Stimulation of the glans penis or genitals", response: "Penile stiffening and genital skin contraction", purpose: "Essential components for reproductive function" },
  { name: "Magnet Reaction (Magnet Reflex)", sys: "Spinal", receptor: "Tactile receptors (exteroceptors) in the skin of the footpad and potentially proprioceptive afferents.", center: "Integrated within the interneuron pool of the spinal cord.", nucleus: "—", stimulus: "Pressure applied to the sole of the footpad.", response: "The limb extends in the direction of the pressure applied; if the finger providing the pressure is withdrawn, the limb follows it like a magnet.", purpose: "It helps an animal maintain its balance and prevents it from falling toward the side of the pressure by converting the limb into a rigid pillar to support the body against gravity." },
  { name: "Stumble Reflex", sys: "Spinal", receptor: "Likely cutaneous receptors and position sensors on the top of the foot.", center: "Integrated within the matrix of the spinal cord.", nucleus: "—", stimulus: "The top of the foot encounters an obstruction (hits an object) during the forward thrust phase of stepping.", response: "The forward thrust stops temporarily; the foot is lifted higher and then proceeds forward to be placed over the obstruction.", purpose: "It allows for the interruption and adjustment of walking patterns to navigate obstacles, preventing a fall." },
  { name: "Clasp-Knife Reflex (Lengthening Reaction)", sys: "Spinal", receptor: "Golgi tendon organs (GTO).", center: "The spinal cord; signals are transmitted via Ib fibers to inhibitory interneurons that project to alpha motor neurons.", nucleus: "—", stimulus: "A strong, continued stretch of a spastic muscle.", response: "A sudden, instantaneous relaxation of the entire muscle, causing the resistance against movement to collapse abruptly (similar to the closing of a clasp-knife).", purpose: "It serves as a protective mechanism to prevent physical damage, such as tearing of the muscle or the avulsion of the tendon from its attachment to the bone, when tension becomes extreme." },
  { name: "Scratch Reflex", sys: "Spinal", receptor: "Mechanoreceptive free nerve endings (very sensitive and rapidly adapting) in the superficial layers of the skin.", center: "Integrated within the spinal cord.", nucleus: "—", stimulus: "Itch sensations or mild surface stimuli, such as a flea crawling on the skin.", response: "Rhythmical scratching maneuvers by the limbs directed at the site of irritation.", purpose: "To rid the host of the irritant; the pain signals from scratching also serve to suppress the itch signals in the cord through lateral inhibition." },
  { name: "Cord Righting Reflexes", sys: "Spinal", receptor: "Proprioceptive and tactile receptors throughout the body.", center: "Integrated entirely within the spinal cord.", nucleus: "—", stimulus: "A spinal animal is laid on its side.", response: "The animal makes uncoordinated movements in an attempt to raise itself back into an upright, standing position.", purpose: "To restore an upright posture following displacement; while less coordinated than midbrain-integrated righting reflexes, they provide basic postural restoration." },
  { name: "Ejaculation Reflex", sys: "Spinal", receptor: "Sensitive sensory end-organs in the glans penis.", center: "Integrated in the lower lumbar and upper sacral segments of the spinal cord (L5, S1–S3).", nucleus: "—", stimulus: "High-intensity sexual stimulation; specifically, the filling of the internal urethra with semen.", response: "A coordinated sequence involving emission (sympathetic contraction of the vas deferens, prostate, and seminal vesicles) and ejaculation per se (rhythmic contractions of the bulbocavernosus and ischiocavernosus muscles via the pudendal nerve).", purpose: "The forceful expulsion of semen to the exterior, constituting the male orgasm." },
  { name: "Local Skin Temperature Reflexes", sys: "Spinal", receptor: "Thermoreceptors (specifically cold and warmth receptors) located in the skin.", center: "Segmental cord centers within the spinal cord, modulated by the hypothalamic thermostat (central controller).", nucleus: "—", stimulus: "Local exposure of a body part to extreme heat (e.g., a hot lamp) or extreme cold (e.g., cold water).", response: "* To Heat: Local vasodilation and localized sweating.   * To Cold: Local vasoconstriction and immediate cessation of sweating.", purpose: "To prevent excessive heat exchange in localized portions of the body and to assist in maintaining the body's overall thermal homeostasis." },
  { name: "Sudomotor Reflex (Axon Reflex in Sweating)", sys: "Spinal", receptor: "Cutaneous sensory terminals (mechanoreceptors or thermoreceptors) of a primary sensory neuron.", center: "Local axon reflex at a branch point of a cutaneous sensory axon. Does not require a central integration center.", nucleus: "—", stimulus: "Local exposure to extreme heat or the intradermal injection of Acetylcholine (ACh).", response: "Localized sweating in the region surrounding the point of stimulation.", purpose: "To provide immediate, localized evaporative cooling. Used clinically in QSART testing for post-ganglionic sympathetic cholinergic fiber integrity." },
  { name: "Baroreceptor reflex", sys: "Cardiovascular", receptor: "Baroreceptors (carotid sinus & aortic arch)", center: "Medulla & hypothalamus", nucleus: "NTS -> Nucleus ambiguus & DVMN; RVLM", stimulus: "Increased arterial blood pressure", response: "Vasodilation; decreased heart rate and contractility", purpose: "Rapid short-term regulation of blood pressure" },
  { name: "Bainbridge reflex", sys: "Cardiovascular", receptor: "Stretch receptors in the atrial wall", center: "Medulla", nucleus: "NTS -> DVMN; sympathetic premotor neurons", stimulus: "Increased venous return (atrial stretch)", response: "Increased heart rate (tachycardia)", purpose: "Prevents damming of blood in the veins and atria" },
  { name: "Cushing's reflex", sys: "Cardiovascular", receptor: "CNS ischemic sensors", center: "Vasomotor center (medulla)", nucleus: "Rostral ventrolateral medulla (RVLM)", stimulus: "Increased intracranial pressure (brain ischemia)", response: "Intense rise in systemic arterial pressure", purpose: "Protects vital brain centers from ischemia" },
  { name: "Exercise pressor reflex", sys: "Cardiovascular", receptor: "Mechanoreceptors and metaboreceptors in muscle", center: "Brainstem (NTS, RVLM, CVLM)", nucleus: "NTS -> RVLM (excitatory) & CVLM (inhibitory)", stimulus: "Muscle contraction and accumulation of metabolites", response: "Increased heart rate, blood pressure, and resistance", purpose: "Optimizes cardiovascular delivery to active muscles" },
  { name: "Axon reflex", sys: "Cardiovascular", receptor: "Cutaneous sensory endings", center: "Peripheral - no CNS center", nucleus: "None (antidromic conduction along sensory axon collaterals)", stimulus: "Firm stroke or local skin injury", response: "Local arteriolar dilation (flare)", purpose: "Increases local blood flow for protection and healing" },
  { name: "Somatosympathetic reflex", sys: "Cardiovascular", receptor: "Nociceptors or proprioceptors", center: "Vasomotor center (medulla)", nucleus: "RVLM -> intermediolateral cell column (IML, T1-L2)", stimulus: "Intense pain or proprioceptive stimulation", response: "Increased systemic blood pressure", purpose: "Adjusts cardiovascular status in response to somatic stress" },
  { name: "Bezold-Jarisch Reflex (Coronary Chemoreflex)", sys: "Cardiovascular", receptor: "Chemoreceptors, specifically C-fiber endings, located in the coronary arteries and the ventricles.", center: "The Nucleus Tractus Solitarius (NTS) in the medulla oblongata, which relays signals to the cardioinhibitory center (including the nucleus ambiguus and dorsal motor nucleus of the vagus).", nucleus: "—", stimulus: "* Experimental: Injection of chemicals such as capsaicin, veratridine, phenyldiguanide, or serotonin into the left coronary artery.   * Clinical: Release of these same chemical substances from infarcted tissue during an acute myocardial infarction (AMI).", response: "A characteristic triad of hyperventilation, bradycardia, and hypotension.", purpose: "In clinical states like AMI, it acts as a check mechanism, though it is often classified as a nonphysiological reflex triggered by pathological chemical release." },
  { name: "Ventricular and Atrial Stretch Reflexes", sys: "Cardiovascular", receptor: "Low-pressure baroreceptors (cardiopulmonary baroreceptors) located in the ventricular walls.", center: "Medullary cardiovascular centers, specifically the NTS and the vasomotor center (VMC).", nucleus: "—", stimulus: "Increased distension of the ventricle due to excess filling, such as during volume overload.", response: "Results in bradycardia, vasodilation, and hypotension.", purpose: "To limit the rise in blood pressure and help maintain basal vagal tone, which checks the resting heart rate." },
  { name: "Vasovagal and Vagal Reflexes", sys: "Cardiovascular", receptor: "Initiated centrally; there is no specific peripheral receptor mentioned, as the trigger is the cerebral cortex.", center: "Signals travel from the cortex to the vasodilatory center of the anterior hypothalamus, then to the vagal cardioinhibitory centers in the medulla.", nucleus: "—", stimulus: "Intense emotional disturbances or disturbing thoughts.", response: "Simultaneous activation of the muscle vasodilator system and the vagal cardioinhibitory center, causing marked bradycardia and a profound fall in blood pressure.", purpose: "Represents an integrated physiological reaction to extreme emotional stress, often resulting in fainting (syncope) due to reduced cerebral blood flow." },
  { name: "Ureterorenal Reflex", sys: "Cardiovascular", receptor: "Pain nerve fibers (nociceptors) located in the walls of the ureters.", center: "Autonomic centers in the spinal cord.", nucleus: "—", stimulus: "Blockage or intense irritation of the ureter, such as that caused by a ureteral stone.", response: "A sympathetic reflex that causes intense constriction of the renal arterioles.", purpose: "To decrease urine output from the affected kidney, which prevents the buildup of excessive pressure in the renal pelvis behind the obstruction." },
  { name: "Chemoreceptor reflex", sys: "Respiratory", receptor: "Chemoreceptors (carotid & aortic bodies)", center: "Medullary respiratory centers", nucleus: "Pre-Botzinger complex; NTS; DRG/VRG", stimulus: "Hypoxia, hypercapnia, or acidosis", response: "Increased rate and depth of respiration", purpose: "Homeostatic correction of blood gas and pH imbalances" },
  { name: "Hering-Breuer inflation reflex", sys: "Respiratory", receptor: "Slowly adapting stretch receptors (SARs) in airways", center: "Medullary respiratory centers", nucleus: "NTS (pump cells) -> Botzinger complex -> DRG/VRG", stimulus: "Large lung inflation (tidal volume > normal)", response: "Halts inspiration; triggers expiration", purpose: "Prevents lung over-inflation" },
  { name: "Hering-Breuer deflation reflex", sys: "Respiratory", receptor: "Rapidly adapting stretch receptors in lungs", center: "Medulla", nucleus: "NTS -> Pre-Botzinger complex (inspiratory rhythm generator)", stimulus: "Excessive lung deflation", response: "Shortens expiration; triggers inspiration", purpose: "Protective mechanism against excessive lung deflation" },
  { name: "J (juxtacapillary) reflex", sys: "Respiratory", receptor: "J receptors in alveolar walls", center: "Medulla", nucleus: "NTS -> respiratory & cardiovascular control nuclei", stimulus: "Pulmonary congestion or chemical irritants", response: "Rapid shallow breathing; bradycardia; hypotension", purpose: "Protective response during pulmonary edema or congestion" },
  { name: "Cough reflex", sys: "Respiratory", receptor: "Irritant receptors in trachea and bronchi", center: "Medulla", nucleus: "NTS (cough pattern generator) -> Nucleus ambiguus; phrenic nucleus", stimulus: "Irritation of lower respiratory airways", response: "Forced expiration against closed glottis, then sudden opening", purpose: "Expels foreign bodies or excess mucus from airways" },
  { name: "Sneeze reflex", sys: "Respiratory", receptor: "Nasopharyngeal mechanoreceptors", center: "Medulla", nucleus: "NTS; trigeminal sensory nucleus (V) -> VRG; facial nucleus (VII)", stimulus: "Irritation of the nasal mucosa", response: "Same as cough, but glottis remains open", purpose: "Expels irritating substances from the nasal passages" },
  { name: "Hiccup Reflex", sys: "Respiratory", receptor: "Not explicitly identified in the sources, although the reflex is categorized under responses mediated by afferents from the viscera and diaphragm.", center: "Not specifically named in the provided text, but the reflex involves the spasmodic coordination of medullary respiratory centers.", nucleus: "—", stimulus: "While a specific physiological trigger is often not identified, the reflex can be associated with gastric distension or visceral irritation; the sources note it occurs during both fetal and postnatal life.", response: "1. The inspiratory muscles, particularly the diaphragm, contract spasmodically.   2. This results in an instantaneous, sudden inspiration.   3. During this rapid inhalation, the glottis closes abruptly, which produces the typical \"hic\" sound.", purpose: "The physiologic significance of the hiccup is not known." },
  { name: "Respiratory Inhibition during Vomiting", sys: "Respiratory", receptor: "Receptors are located in many parts of the body, including touch receptors in the throat and pharynx, mechanoreceptors sensing distension in the stomach and duodenum, and chemoreceptors in the Area Postrema (Chemoreceptor Trigger Zone/CTZ).", center: "The Vomiting Center, located in the reticular formation of the medulla, which consists of various scattered groups of neurons including the Area Postrema and the Nucleus Tractus Solitarius (NTS).", nucleus: "—", stimulus: "Excessive irritation or overdistension of the upper gastrointestinal tract (especially the duodenum), tickling the back of the throat, painful injuries, motion sickness, or certain drugs and hormones.", response: "1. The respiratory centers are inhibited, causing breathing to be abruptly halted at any point in its cycle.   2. A preliminary deep breath (forced inspiration) is taken against a closed glottis.   3. The vocal cords approximate tightly and the glottis remains closed to seal off the trachea.   4. The soft palate is lifted to close the posterior nares.", purpose: "This reflex prevents the aspiration of vomitus or food particles into the respiratory tract, thereby protecting the lungs from \"choking\" or aspiration pneumonia." },
  { name: "Tracheal Reflex", sys: "Respiratory", receptor: "Pulmonary irritant receptors (naked nerve endings) situated in the epithelial lining of the trachea.", center: "Medullary respiratory centers; sensory signals are carried by the vagus nerve to the Nucleus Tractus Solitarius (NTS).", nucleus: "—", stimulus: "Mechanical or chemical irritation of the tracheal epithelium (e.g., by dust, smoke, or tracheobronchial suctioning).", response: "The cough reflex, which follows a stepwise sequence:   1. A preliminary deep inspiration.   2. Tight closure of the glottis to entrap the air.   3. Forceful contraction of abdominal and expiratory muscles, building high internal pressure.   4. The instantaneous opening of the glottis, allowing air to explode outward at velocities as high as 600 miles per hour.", purpose: "To expel foreign matter and irritants from the lower respiratory tract, protecting the lungs from potential injury or infection." },
  { name: "Respiratory Inhibition during Swallowing (Deglutition Apnea)", sys: "Respiratory", receptor: "Epithelial swallowing receptors located around the pharyngeal opening, with the highest sensitivity on the tonsillar pillars.", center: "The swallowing (deglutition) center, which includes the Nucleus Tractus Solitarius (NTS) and Nucleus Ambiguus in the medulla and lower pons.", nucleus: "—", stimulus: "The presence of a food bolus touching the tactile receptors at the pharyngeal opening as it is pushed back by the tongue.", response: "The swallowing center sends inhibitory signals to the medullary respiratory center, causing respiration to be abruptly halted at any point in its cycle.", purpose: "To prevent the aspiration of food particles, liquid, or saliva into the trachea and lungs." },
  { name: "Head's Paradoxical Reflex", sys: "Respiratory", receptor: "Rapidly adapting receptors (pulmonary irritant receptors) located in the airways.", center: "The medullary respiratory center, specifically the Nucleus Tractus Solitarius (NTS), which receives inputs from pulmonary receptors via the vagus nerve.", nucleus: "—", stimulus: "Inflation of the lungs.", response: "A paradoxical further inflation or an additional inspiratory effort (gasping) rather than the inhibition of inspiration.", purpose: "Associated with deep sighs and the initial inflation of the lungs in a newborn baby, where a powerful inspiratory effort is required to expand collapsed alveoli." },
  { name: "Micturition reflex", sys: "Visceral", receptor: "Stretch receptors in the bladder wall", center: "Spinal cord (sacral S2-S4)", nucleus: "Sacral parasympathetic nucleus; Onuf's nucleus; Pontine micturition centre (Barrington's nucleus)", stimulus: "Filling and stretching of the urinary bladder", response: "Detrusor contraction; internal sphincter relaxation", purpose: "Automatic emptying of the urinary bladder" },
  { name: "Defecation reflex (intrinsic)", sys: "Visceral", receptor: "Myenteric plexus (ENS) in the rectal wall", center: "Local enteric nervous system", nucleus: "Myenteric plexus (Auerbach's plexus)", stimulus: "Distention of the rectal wall by feces", response: "Peristalsis in colon/rectum; internal sphincter relaxation", purpose: "Initial weak signal to facilitate bowel emptying" },
  { name: "Defecation reflex (parasympathetic)", sys: "Visceral", receptor: "Stretch receptors in the rectal wall", center: "Spinal cord (sacral S3)", nucleus: "Sacral parasympathetic nucleus (S3) -> pelvic splanchnic nerves", stimulus: "Distention of the rectal wall", response: "Powerful colonic contractions; internal sphincter relaxation", purpose: "Efficient and powerful expulsion of feces" },
  { name: "Enterogastric reflex", sys: "Visceral", receptor: "Mechanoreceptors/chemoreceptors in duodenum", center: "Prevertebral ganglia & brainstem", nucleus: "Celiac & superior mesenteric ganglia; NTS -> DVMN", stimulus: "Duodenal distension, acid, or high osmolality", response: "Inhibition of gastric motility and secretion", purpose: "Regulates the rate of gastric emptying into the duodenum" },
  { name: "Gastrocolic reflex", sys: "Visceral", receptor: "Mechanoreceptors in the stomach", center: "Prevertebral ganglia & ENS", nucleus: "Inferior mesenteric ganglion; myenteric plexus (Auerbach's)", stimulus: "Accumulation of food/distension in the stomach", response: "Increased colonic motility (mass peristalsis)", purpose: "Facilitates colonic evacuation after a meal" },
  { name: "Gastroileal reflex", sys: "Visceral", receptor: "Mechanoreceptors in stomach", center: "Vagus nerve or prevertebral ganglia", nucleus: "Dorsal motor nucleus of vagus (DVMN); celiac ganglion", stimulus: "Stretching of the stomach wall by food", response: "Enhanced ileal motility; ileocecal sphincter relaxation", purpose: "Facilitates movement of ileal contents into the colon" },
  { name: "Intestino-intestinal reflex", sys: "Visceral", receptor: "Gut wall mechanoreceptors", center: "Local ENS or spinal cord", nucleus: "Myenteric plexus; prevertebral ganglia; spinal interneurons", stimulus: "Over-distension of a segment of intestine", response: "Relaxation of the rest of the intestine", purpose: "Prevents overdistension and potential injury" },
  { name: "Colonocolonic reflex", sys: "Visceral", receptor: "Colonic mechanoreceptors", center: "ENS or prevertebral ganglia", nucleus: "Myenteric plexus; inferior mesenteric ganglion", stimulus: "Distention of one part of the colon", response: "Relaxation of the entire colon", purpose: "Facilitates colonic filling and movement" },
  { name: "Colonoileal reflex", sys: "Visceral", receptor: "Colonic receptors", center: "Prevertebral ganglia", nucleus: "Inferior mesenteric ganglion -> ileal myenteric plexus", stimulus: "Distention of the colon", response: "Inhibition of ileal emptying into the colon", purpose: "Prevents backflow and overfilling of the colon" },
  { name: "Peristaltic (myenteric) reflex", sys: "Visceral", receptor: "Gut wall mechanoreceptors", center: "Myenteric plexus (ENS)", nucleus: "Myenteric plexus (Auerbach's) - ascending excitatory / descending inhibitory interneurons", stimulus: "Distension of a gut segment", response: "Contractile ring orad; receptive relaxation aborad", purpose: "Propels intestinal contents in an anal direction" },
  { name: "Deglutition (swallowing) reflex", sys: "Visceral", receptor: "Receptors around pharyngeal opening", center: "Medulla", nucleus: "NTS -> Nucleus ambiguus; DVMN", stimulus: "Bolus of food touching the pharynx", response: "Sequential automatic pharyngeal and esophageal contractions", purpose: "Safely propels food from mouth to esophagus" },
  { name: "Chewing (mastication) reflex", sys: "Visceral", receptor: "Mechanoreceptors in mouth", center: "Brainstem reticular areas", nucleus: "Trigeminal motor nucleus (V); masticatory pattern generator (reticular formation)", stimulus: "Presence of a food bolus in the mouth", response: "Cyclic rhythmic chewing movements", purpose: "Mechanical breakdown of food for swallowing" },
  { name: "Taste-salivary reflex", sys: "Visceral", receptor: "Taste bud chemoreceptors", center: "Medulla", nucleus: "NTS -> Superior salivatory nucleus (VII) & Inferior salivatory nucleus (IX)", stimulus: "Arrival of tastant molecules at taste buds", response: "Reflexive salivary secretion", purpose: "Facilitates initial digestion and protects mucosa" },
  { name: "Duodenocolic Reflex", sys: "Visceral", receptor: "Stretch receptors (mechanoreceptors) located in the wall of the duodenum (implied by response to distension).", center: "Prevertebral sympathetic ganglia (signals travel from the gut to these ganglia and then back to the colon).", nucleus: "—", stimulus: "Distension of the duodenum by the entry of chyme from the stomach.", response: "Facilitates or initiates mass movements in the colon, which are modified peristaltic contractions that propel fecal material toward the rectum.", purpose: "To promote the evacuation of the colon to make room for incoming material." },
  { name: "Peritoneointestinal Reflex", sys: "Visceral", receptor: "Nociceptors (pain/irritant receptors) in the peritoneum.", center: "Integrated through the extrinsic sympathetic nervous system, which provides inhibitory input to the myenteric plexus in the gut wall.", nucleus: "—", stimulus: "Irritation of the peritoneum, such as that caused by infection or inflammation (e.g., peritonitis).", response: "Strong inhibition of excitatory enteric nerves, leading to the cessation of peristalsis and potentially complete intestinal paralysis (adynamic ileus).", purpose: "To suppress bowel activity in the presence of peritoneal injury or inflammation." },
  { name: "Renointestinal Reflex", sys: "Visceral", receptor: "Nociceptors (pain fibers) in the kidney tissue.", center: "Autonomic centers in the spinal cord.", nucleus: "—", stimulus: "Irritation or inflammation of the kidney, such as that caused by renal calculi (stones).", response: "Inhibition of intestinal motility (intestinal activity is checked).", purpose: "To suppress gastrointestinal activity as a secondary response to renal irritation." },
  { name: "Esophago-esophageal Contractile Reflex (Secondary Peristalsis)", sys: "Visceral", receptor: "Mechanoreceptors (stretch receptors) in the esophageal wall.", center: "Integrated through intrinsic circuits in the myenteric plexus and extrinsic reflexes involving the swallowing center in the medulla and lower pons (specifically the Nucleus Tractus Solitarius and Nucleus Ambiguus).", nucleus: "—", stimulus: "Distension of the esophagus by a retained food bolus that was not moved by primary peristalsis.", response: "Initiation of secondary peristaltic waves (contractile rings) just above the bolus that continue until the esophagus is cleared.", purpose: "To clear any remaining food from the esophagus and push it into the stomach." },
  { name: "Vesicointestinal Reflex", sys: "Visceral", receptor: "Nociceptors (stretch or pain receptors) in the wall of the urinary bladder.", center: "Autonomic centers in the spinal cord.", nucleus: "—", stimulus: "Irritation or excessive distension of the urinary bladder.", response: "Inhibition of intestinal activity.", purpose: "To reduce bowel activity when the urinary bladder is irritated or over-distended." },
  { name: "Gastric Relaxations (Receptive, Adaptive, and Feedback)", sys: "Visceral", receptor: "Tactile receptors in the mouth and pharynx, and mechanoreceptors in the esophagus.", center: "The swallowing (deglutition) center in the medulla and lower pons.", nucleus: "—", stimulus: "The physiological act of chewing and swallowing food.", response: "A wave of relaxation, mediated by non-cholinergic vagal fibers releasing VIP and nitric oxide, causes the fundus and body of the stomach to relax before food even arrives.", purpose: "To prepare the stomach to receive a meal, ensuring intragastric pressure does not rise despite the accumulation of food." },
  { name: "Vagovagal Reflexes", sys: "Visceral", receptor: "Mechanoreceptors and chemoreceptors in the gastrointestinal mucosa and muscularis.", center: "The medulla oblongata, specifically the Nucleus Tractus Solitarius (NTS) and the dorsal motor nucleus of the vagus.", nucleus: "—", stimulus: "Distension of the gut wall (e.g., stomach or duodenum) or the presence of specific chemicals from digestion.", response: "Vagal efferent signals return to the gut to either relax the stomach (receptive/adaptive relaxation) or stimulate secretion (HCL from parietal cells) and motility.", purpose: "To provide a central loop for regulating gastric volume, motility, and secretions in response to the intake of food." },
  { name: "Feeding Reflexes", sys: "Visceral", receptor: "Visual, olfactory, and gustatory receptors; hypothalamic \"glucostats\" sensing blood glucose levels.", center: "Multiple brain regions including the medulla, pons, mesencephalon, and amygdala. Specific patterns are controlled by the mammillary bodies (licking/swallowing), the lateral hypothalamus (feeding center), and the ventromedial hypothalamus (satiety center).", nucleus: "—", stimulus: "The sight, smell, taste, or thought of food, as well as internal hunger signals.", response: "Rhythmic motor acts including licking the lips, the mastication (chewing) reflex, and the deglutition (swallowing) reflex.", purpose: "To recognize, process, and transport food into the alimentary tract for digestion." },
  { name: "Milk ejection reflex", sys: "Endocrine", receptor: "Tactile receptors in/around the nipple", center: "Hypothalamus", nucleus: "Supraoptic nucleus (SON) & Paraventricular nucleus (PVN)", stimulus: "Suckling stimulus from the infant", response: "Oxytocin release; myoepithelial cell contraction", purpose: "Expels milk from breast alveoli into the ducts for feeding" },
  { name: "Parturition Reflex", sys: "Endocrine", receptor: "Stretch receptors in the cervix.", center: "The hypothalamus (specifically the paraventricular and supraoptic nuclei), which projects to the posterior pituitary.", nucleus: "—", stimulus: "Cervical distension caused by the fetal head pressing on the uterine cervix at term.", response: "A neurohumoral response resulting in the release of oxytocin, which causes vigorous uterine contractions and stimulates further prostaglandin production.", purpose: "To produce the intensely strong contractions necessary for labor and the expulsion of the baby from the birth canal." },
  { name: "Pupillary light reflex", sys: "Brainstem", receptor: "Retinal photoreceptors (rods & cones)", center: "Midbrain", nucleus: "Olivary pretectal nucleus -> Edinger-Westphal nucleus (CN III)", stimulus: "Bright light striking the retina", response: "Pupillary constriction (sphincter pupillae)", purpose: "Protects the retina and aids in light adaptation" },
  { name: "Consensual light reflex", sys: "Brainstem", receptor: "Retinal photoreceptors (one eye)", center: "Midbrain", nucleus: "Olivary pretectal nucleus -> bilateral Edinger-Westphal nuclei", stimulus: "Light shone in only one eye", response: "Pupillary constriction in the opposite eye", purpose: "Aids in bilateral light adaptation" },
  { name: "Accommodation reflex", sys: "Brainstem", receptor: "Retinal photoreceptors", center: "Visual cortex & midbrain", nucleus: "Visual cortex -> Edinger-Westphal nucleus; oculomotor nucleus (CN III)", stimulus: "Shifting gaze from far to near object", response: "Lens thickening; pupillary constriction; convergence", purpose: "Maintains clear focus on objects close to the eyes" },
  { name: "Tympanic (acoustic) reflex", sys: "Brainstem", receptor: "Hair cells in the inner ear", center: "Brainstem", nucleus: "Cochlear nucleus -> facial nucleus (VII) & trigeminal motor nucleus (V)", stimulus: "Prolonged loud noise", response: "Contraction of tensor tympani and stapedius muscles", purpose: "Dampens ossicular vibration to protect the inner ear" },
  { name: "Labyrinthine righting reflex", sys: "Brainstem", receptor: "Otolith organs in the vestibular apparatus", center: "Midbrain", nucleus: "Vestibular nuclei (Deiters') -> superior colliculus -> cervical motor neurons", stimulus: "Tilting of the head relative to gravity", response: "Reflexive contraction of neck muscles", purpose: "Restores and maintains head in an upright level position" },
  { name: "Vestibulo-ocular reflex (VOR)", sys: "Brainstem", receptor: "Semicircular canal hair cells", center: "Brainstem", nucleus: "Medial & superior vestibular nuclei -> Abducens nucleus (VI); Oculomotor nucleus (III) via MLF", stimulus: "Rotation of the head", response: "Eyes rotate equal and opposite to head movement", purpose: "Stabilizes the visual image on the retina during movement" },
  { name: "Vestibulocollic reflex", sys: "Brainstem", receptor: "Vestibular apparatus", center: "Brainstem", nucleus: "Medial vestibular nucleus -> medial vestibulospinal tract -> cervical motor neurons", stimulus: "Vestibular stimulation from head movement", response: "Contraction of head and neck muscles", purpose: "Maintains head position stability during movement" },
  { name: "Tonic neck reflex", sys: "Brainstem", receptor: "Proprioceptors in neck muscles", center: "Medulla", nucleus: "Medial vestibular nucleus; cervical dorsal horn interneurons", stimulus: "Change in head position relative to the body", response: "Altered distribution of limb muscle tone", purpose: "Supports posture in response to head orientation changes" },
  { name: "Corneal reflex", sys: "Brainstem", receptor: "Cornea (trigeminal nerve V)", center: "Pons (brainstem)", nucleus: "Trigeminal sensory nucleus (V) -> Facial nucleus (VII) bilaterally", stimulus: "Touching or irritating the cornea", response: "Immediate blinking and eyelid closure", purpose: "Protects the surface of the eye from injury" },
  { name: "Gag (pharyngeal) reflex", sys: "Brainstem", receptor: "Posterior pharynx (glossopharyngeal IX)", center: "Medulla", nucleus: "NTS -> Nucleus ambiguus (IX/X)", stimulus: "Physical stimulation of the posterior pharynx", response: "Contraction of the pharyngeal muscles", purpose: "Protects the airway from entry of foreign materials" },
  { name: "Vomiting reflex", sys: "Brainstem", receptor: "Chemoreceptors (area postrema) or gut receptors", center: "Medulla", nucleus: "Area postrema (CTZ) -> NTS -> Nucleus ambiguus & DVMN; phrenic nucleus", stimulus: "Drugs, hormones, toxins, or pharyngeal irritation", response: "Abdominal/diaphragm contraction; reverse peristalsis", purpose: "Expels harmful or irritating substances from the GIT" },
  { name: "Grasp reflex", sys: "Brainstem", receptor: "Palmar or plantar tactile receptors", center: "Midbrain", nucleus: "Red nucleus; corticospinal motor neurons (suppressed postnatally)", stimulus: "Object touching the palm or sole", response: "Reflexive extension and grasping of the object", purpose: "Primitive reflex aiding in standing and postural support" },
  { name: "Vestibular placing reaction", sys: "Brainstem", receptor: "Vestibular receptors", center: "Midbrain", nucleus: "Lateral vestibular nucleus (Deiters') -> lateral vestibulospinal tract", stimulus: "Rapid downward linear acceleration", response: "Forelimb extension and toe spreading", purpose: "Assists the body in landing steadily on the ground" },
  { name: "Neck righting reflex", sys: "Brainstem", receptor: "Neck muscle spindles", center: "Midbrain", nucleus: "Superior colliculus; vestibular nuclei -> cervical & thoracic motor neurons", stimulus: "Stretching of neck muscles when head is turned", response: "Sequential righting of shoulders, thorax, and pelvis", purpose: "Aligns the rest of the body with the head position" },
  { name: "Body on head righting reflex", sys: "Brainstem", receptor: "Side-of-body exteroceptors", center: "Midbrain", nucleus: "Superior colliculus; interstitial nucleus of Cajal", stimulus: "Pressure on the side of the body", response: "Reflexive righting of the head", purpose: "Restores the head to an upright position" },
  { name: "Body on body righting reflex", sys: "Brainstem", receptor: "Side-of-body exteroceptors", center: "Midbrain", nucleus: "Superior colliculus; interstitial nucleus of Cajal -> spinal motor neurons", stimulus: "Pressure on the side of the body", response: "Righting of the body even if head is tilted", purpose: "Restores body orientation relative to the ground" },
  { name: "Limb righting reflex", sys: "Brainstem", receptor: "Limb muscle spindles", center: "Midbrain", nucleus: "Red nucleus (rubrospinal tract); vestibular nuclei", stimulus: "Stretching of limb muscles", response: "Righting of the entire body", purpose: "Assists in general postural correction" },
  { name: "Optical righting reflex", sys: "Brainstem", receptor: "Visual receptors", center: "Visual cortex & midbrain", nucleus: "Visual cortex -> superior colliculus -> interstitial nucleus of Cajal", stimulus: "Visual perception of a tilted horizon", response: "Righting of the head", purpose: "Uses visual cues to maintain an upright head level" },
  { name: "Hopping and placing reactions", sys: "Brainstem", receptor: "Tactile and proprioceptive receptors", center: "Cerebral cortex", nucleus: "Sensorimotor cortex (areas 1, 2, 3) -> corticospinal tract", stimulus: "Lateral push or displacement", response: "Corrective steps or firm foot placement", purpose: "Maintenance of a stable body position when pushed" },
  { name: "Hopping Reaction", sys: "Brainstem", receptor: "Somatic receptors (proprioceptive and tactile) in the limbs and body.", center: "The motor cortex. This reflex is considered a cortical-level adjustment and is grossly impaired in decorticate subjects.", nucleus: "—", stimulus: "Being pushed laterally (to the side) while in a standing position.", response: "The subject reflexively takes a series of short steps or hops in the direction of the displacement.", purpose: "To realign the subject's base of support with their center of gravity, thereby maintaining postural balance and preventing a fall." },
  { name: "Jaw Reflex", sys: "Brainstem", receptor: "Muscle spindles (proprioceptors) in the jaw-closing muscles (e.g., masseter) and tactile receptors in the oral mucosa.", center: "Motor nuclei of the trigeminal (V) nerve located in the pons of the brainstem.", nucleus: "—", stimulus: "Tapping on the jaw or chin, or the pressure of a food bolus against the oral lining.", response: "* Chewing Cycle: The jaw first drops due to reflex inhibition of the mastication muscles, which then triggers a stretch reflex causing a rebound contraction and closure of the teeth.   * Clinical: A sudden contraction of the jaw-closing muscles.", purpose: "To facilitate the rhythmic grinding and mixing of food during mastication and to serve as a diagnostic marker for brainstem and trigeminal nerve integrity." },
  { name: "Tonic Labyrinthine Reflex", sys: "Brainstem", receptor: "Otolith organs (maculae of the utricle and saccule) within the vestibular apparatus.", center: "The vestibular nuclei in the medulla oblongata.", nucleus: "—", stimulus: "A change in the head or body's position in space, which alters the direction of the gravitational pull on the otolith membrane.", response: "An alteration in the pattern of extensor rigidity in the limbs. Supine: extensor rigidity is maximum. Prone: extensor rigidity is minimum.", purpose: "To assist the individual in maintaining muscle tone and stability in an erect posture." },
];

const REFLEX_MECH_MAP = {
  "Stretch reflex (phasic)": "Phasic Stretch Reflex (Dynamic Myotatic Reflex / Tendon Jerks)",
  "Stretch reflex (tonic)": "Tonic Stretch Reflex (Static Myotatic Reflex)",
  "Inverse stretch reflex": "Inverse Stretch Reflex (Golgi Tendon Reflex / Autogenic Inhibition)",
  "Withdrawal (flexor) reflex": "Withdrawal Reflex (Flexor Reflex / Nociceptive Reflex)",
  "Crossed extensor reflex": "Crossed Extensor Reflex (Phillipson’s Reflex)",
  "Positive supporting reaction": "Supporting Reactions (Positive and Negative)",
  "Negative supporting reaction": "Supporting Reactions (Positive and Negative)",
  "Mass reflex": "Mass Reflex",
  "Coitus reflex": "Coitus Reflex / Sexual Reflexes",
  "Baroreceptor reflex": "Baroreceptor Reflex (Baroreflex / Sino-aortic Reflex)",
  "Bainbridge reflex": "Bainbridge Reflex (Atrial Reflex)",
  "Cushing's reflex": "Cushing’s Reflex / CNS Ischemic Response",
  "Exercise pressor reflex": "Somatosympathetic, Muscle-Heart, and Exercise Pressor Reflexes",
  "Axon reflex": "Axon Reflex / Flare Response",
  "Somatosympathetic reflex": "Somatosympathetic, Muscle-Heart, and Exercise Pressor Reflexes",
  "Chemoreceptor reflex": "Chemoreceptor Reflex",
  "Hering-Breuer inflation reflex": "Hering–Breuer Inflation Reflex",
  "Hering-Breuer deflation reflex": "Hering–Breuer Deflation Reflex",
  "Head’s Paradoxical reflex": "Head’s Paradoxical Reflex",
  "J (juxtacapillary) reflex": "J-Receptor Reflex (Juxtacapillary Reflex / Apnea Reflex)",
  "Cough reflex": "Cough Reflex",
  "Sneeze reflex": "Sneeze Reflex",
  "Micturition reflex": "Micturition Reflex",
  "Defecation reflex (intrinsic)": "Defecation Reflexes",
  "Defecation reflex (parasympathetic)": "Defecation Reflexes",
  "Enterogastric reflex": "Enterogastric Reflex",
  "Gastrocolic reflex": "Gastrocolic Reflex",
  "Gastroileal reflex": "Gastroileal Reflex",
  "Intestino-intestinal reflex": "Intestino-intestinal Reflex",
  "Colonocolonic reflex": "Colonocolonic Reflex",
  "Colonoileal reflex": "Colonoileal Reflex",
  "Peristaltic (myenteric) reflex": "Peristaltic Reflex (Myenteric Reflex / Law of the Gut)",
  "Deglutition (swallowing) reflex": "Deglutition Reflex (Swallowing Reflex)",
  "Chewing (mastication) reflex": "Chewing Reflex (Mastication Reflex)",
  "Taste-salivary reflex": "Salivatory Reflexes / Taste-Salivary Reflex",
  "Milk ejection reflex": "Milk Ejection Reflex (Milk Let-down Reflex)",
  "Pupillary light reflex": "Pupillary Light Reflex (Direct and Consensual)",
  "Consensual light reflex": "Pupillary Light Reflex (Direct and Consensual)",
  "Accommodation reflex": "Accommodation Reflex",
  "Tympanic (acoustic) reflex": "Tympanic Reflex (Acoustic / Attenuation Reflex)",
  "Labyrinthine righting reflex": "Labyrinthine Righting Reflex",
  "Vestibulo-ocular reflex (VOR)": "Vestibulo-ocular Reflex (VOR / Doll’s Eyes Reflex)",
  "Vestibulocollic reflex": "Vestibulocollic Reflex",
  "Tonic neck reflex": "Tonic Neck Reflex",
  "Corneal reflex": "Corneal Reflex",
  "Gag (pharyngeal) reflex": "Gag Reflex (Pharyngeal Reflex)",
  "Vomiting reflex": "Vomiting Reflex",
  "Grasp reflex": "Grasp Reflex",
  "Vestibular placing reaction": "Placing Reactions",
  "Neck righting reflex": "Neck Righting Reflex",
  "Body on head righting reflex": "Body-on-Head Righting Reflex",
  "Body on body righting reflex": "Body-on-Body Righting Reflex",
  "Limb righting reflex": "Limb Righting Reflex",
  "Optical righting reflex": "Optical Righting Reflex",
  "Hopping and placing reactions": "Hopping Reaction",
  "Magnet Reaction (Magnet Reflex)": "Magnet Reaction (Magnet Reflex)",
  "Stumble Reflex": "Stumble Reflex",
  "Clasp-Knife Reflex (Lengthening Reaction)": "Clasp-Knife Reflex (Lengthening Reaction)",
  "Scratch Reflex": "Scratch Reflex",
  "Cord Righting Reflexes": "Cord Righting Reflexes",
  "Bezold-Jarisch Reflex (Coronary Chemoreflex)": "Bezold–Jarisch Reflex (Coronary Chemoreflex)",
  "Ventricular and Atrial Stretch Reflexes": "Ventricular and Atrial Stretch Reflexes",
  "Vasovagal and Vagal Reflexes": "Vasovagal and Vagal Reflexes",
  "Ureterorenal Reflex": "Ureterorenal Reflex",
  "Hiccup Reflex": "Hiccup Reflex",
  "Respiratory Inhibition during Vomiting": "Respiratory Inhibition during Vomiting",
  "Duodenocolic Reflex": "Duodenocolic Reflex",
  "Peritoneointestinal Reflex": "Peritoneointestinal Reflex",
  "Renointestinal Reflex": "Renointestinal Reflex",
  "Esophago-esophageal Contractile Reflex (Secondary Peristalsis)": "Esophago-esophageal Contractile Reflex (Secondary Peristalsis)",
  "Vesicointestinal Reflex": "Vesicointestinal Reflex",
  "Gastric Relaxations (Receptive, Adaptive, and Feedback)": "Gastric Relaxations (Receptive, Adaptive, and Feedback)",
  "Vagovagal Reflexes": "Vagovagal Reflexes",
  "Feeding Reflexes": "Feeding Reflexes",
  "Parturition Reflex": "Parturition Reflex",
  "Ejaculation Reflex": "Ejaculation Reflex",
  "Local Skin Temperature Reflexes": "Local Skin Temperature Reflexes",
  "Hopping Reaction": "Hopping Reaction",
  "Jaw Reflex": "Jaw Reflex",
  "Tracheal Reflex": "Tracheal Reflex",
  "Tonic Labyrinthine Reflex": "Tonic Labyrinthine Reflex",
  "Respiratory Inhibition during Swallowing (Deglutition Apnea)": "Respiratory Inhibition during Swallowing (Deglutition Apnea)",
  "Head’s Paradoxical Reflex": "Head’s Paradoxical Reflex",
  "Sudomotor Reflex (Axon Reflex in Sweating)": "Sudomotor Reflex (Axon Reflex in Sweating)",
};

function getReflexMechanism(name) {
  const key = REFLEX_MECH_MAP[name];
  if (key) return MECHANISMS[key] || null;
  for (const [mk, mv] of Object.entries(MECHANISMS)) {
    if (mk.toLowerCase().includes(name.toLowerCase())) return mv;
  }
  return null;
}

function normReflex(n) {
  return n.toLowerCase().replace(/['\u2019\u2018]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function getReflexDetail(name, reflexes) {
  const nn = normReflex(name);
  for (const r of reflexes) {
    const rn = normReflex(r.name);
    if (rn === nn) return r;
  }
  for (const r of reflexes) {
    const rn = normReflex(r.name);
    if (rn.includes(nn) || nn.includes(rn)) return r;
  }
  return null;
}

const DETAIL_SYS_ORDER = ["Spinal", "Cardiovascular", "Respiratory", "Visceral", "Endocrine", "Brainstem"];

const DETAIL_SYS_COLORS = {
  Spinal: { bg: "#E1F5EE", color: "#085041" },
  Cardiovascular: { bg: "#FCEBEB", color: "#791F1F" },
  Respiratory: { bg: "#E6F1FB", color: "#0C447C" },
  Visceral: { bg: "#FAEEDA", color: "#633806" },
  Endocrine: { bg: "#FBEAF0", color: "#72243E" },
  Brainstem: { bg: "#EEEDFE", color: "#3C3489" },
};

function highlightMatch(text, q) {
  if (!q) return text;
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase()
      ? <mark key={i} style={{ background: "rgba(255,200,0,.4)", borderRadius: 2, padding: 0 }}>{part}</mark>
      : part
  );
}

function MechanismFlowchart({ name }) {
  const steps = getReflexMechanism(name);
  if (!steps) return null;
  return (
    <div style={{ marginTop: 12, borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Mechanism Flowchart</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 24, flexShrink: 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#185FA5", color: "#fff", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {i + 1}
              </div>
              {i < steps.length - 1 && <div style={{ width: 1.5, flex: 1, background: "var(--color-border-secondary)", minHeight: 16 }} />}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5, paddingBottom: i < steps.length - 1 ? 14 : 0 }}>
              {step}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailReflexCard({ reflex, query }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const col = DETAIL_SYS_COLORS[reflex.sys];

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "0.875rem 1.125rem",
        cursor: "pointer",
        transition: "border-color 0.15s",
        borderColor: hovered ? "var(--color-border-secondary)" : "var(--color-border-tertiary)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--color-text-primary)" }}>
          {highlightMatch(reflex.name, query)}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: col.bg, color: col.color, fontWeight: 500, whiteSpace: "nowrap" }}>
            {reflex.sys}
          </span>
          <span style={{ fontSize: 13, color: "var(--color-text-tertiary)", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 10, borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "8px 16px" }}>
            {[
              ["Receptor", reflex.receptor],
              ["Center", reflex.center],
              ["Stimulus", reflex.stimulus],
              ["Response", reflex.response],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{highlightMatch(val, query)}</div>
                {label === "Center" && (
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontStyle: "italic", marginTop: 2, lineHeight: 1.4 }}>
                    {highlightMatch(reflex.nucleus, query)}
                  </div>
                )}
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 2 }}>Purpose</div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", fontStyle: "italic", lineHeight: 1.5 }}>
                {highlightMatch(reflex.purpose, query)}
              </div>
            </div>
          </div>
          <MechanismFlowchart name={reflex.name} />
        </div>
      )}
    </div>
  );
}

function ReflexDetailsExplorer({ reflexes }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reflexes.filter(r => {
      const matchSys = activeFilter === "All" || r.sys === activeFilter;
      const matchQ = !q || [r.name, r.receptor, r.center, r.nucleus, r.stimulus, r.response, r.purpose]
        .some(f => f.toLowerCase().includes(q));
      return matchSys && matchQ;
    });
  }, [query, activeFilter]);

  const filters = ["All", ...DETAIL_SYS_ORDER];

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search reflexes, receptors, nuclei..."
        style={{
          boxSizing: "border-box", width: "100%", padding: "8px 12px",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)", fontSize: 14, outline: "none",
          marginBottom: "1rem",
          background: "var(--color-background-primary)", color: "var(--color-text-primary)",
        }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1.25rem" }}>
        {filters.map(f => {
          const active = f === activeFilter;
          const col = DETAIL_SYS_COLORS[f];
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                cursor: "pointer",
                border: active ? `1.5px solid ${col ? col.color : "var(--color-text-primary)"}` : "0.5px solid var(--color-border-tertiary)",
                background: active ? (col ? col.bg : "var(--color-background-secondary)") : "var(--color-background-primary)",
                color: active ? (col ? col.color : "var(--color-text-primary)") : "var(--color-text-secondary)",
                fontWeight: active ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: "0.75rem" }}>
        {filtered.length} of {reflexes.length} reflexes
      </p>

      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14, padding: "2rem 0" }}>
          No reflexes match your search.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map(r => (
            <DetailReflexCard key={r.name} reflex={r} query={query.trim().toLowerCase()} />
          ))}
        </div>
      )}
    </div>
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [mode, setMode] = useState("home");
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [hoveredMode, setHoveredMode] = useState(null);
  const [vivaData, setVivaData] = useState(FALLBACK_DATA);
  const [reflexDetailData, setReflexDetailData] = useState(FALLBACK_DETAIL_REFLEXES);
  const [notesData, setNotesData] = useState([]);
  const [clinicalData, setClinicalData] = useState([]);
  useEffect(() => {
    fetch(DATA_URL).then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d) && d.length) setVivaData(d); }).catch(() => {});
    fetch(REFLEX_URL).then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d) && d.length) setReflexDetailData(d); }).catch(() => {});
    fetch(NOTES_URL).then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d) && d.length) setNotesData(d); }).catch(() => {});
    fetch(CLINICAL_URL).then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d) && d.length) setClinicalData(d); }).catch(() => {});
  }, []);
  const notesLookup = useMemo(() => {
    const m = {};
    notesData.forEach((e, i) => { m[e.name] = i; });
    return m;
  }, [notesData]);
  // quiz state
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const [physioVisibility, setPhysioVisibility] = useState({ viva: true, reflexExplorer: true, notes: true, clinical: true });
  // postMessage nav sync with parent (skip initial mount — parent already knows from hash)
  const mounted = useRef(false);
  const navDebounce = useRef(null);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    clearTimeout(navDebounce.current);
    navDebounce.current = setTimeout(() => {
      try { window.parent.postMessage({ type: 'physio-nav', mode, cat: activeCat, search }, '*'); } catch(e) {}
    }, 400);
    return () => clearTimeout(navDebounce.current);
  }, [mode, activeCat, search]);
  useEffect(() => {
    function handler(e) {
      if (e.data && e.data.type === 'physio-nav-set') {
        if (e.data.cat) setActiveCat(e.data.cat);
        if (e.data.search !== undefined) setSearch(e.data.search);
        if (e.data.mode) { handleModeChange(e.data.mode); }
      }
      if (e.data && e.data.type === 'physio-visibility') {
        setPhysioVisibility({ viva: e.data.viva !== false, reflexExplorer: e.data.reflexExplorer !== false, notes: e.data.notes !== false, clinical: e.data.clinical !== false });
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);
  useEffect(() => {
    if ((mode === 'browse' || mode === 'quiz') && !physioVisibility.viva) { handleModeChange('home'); }
    if (mode === 'reflexDetails' && !physioVisibility.reflexExplorer) { handleModeChange('home'); }
    if (mode === 'notes' && !physioVisibility.notes) { handleModeChange('home'); }
    if (mode === 'clinical' && !physioVisibility.clinical) { handleModeChange('home'); }
  }, [mode, physioVisibility]);

  const filtered = useMemo(() => vivaData.filter(d => {
    const catOk = activeCat === "All" || d.cat === activeCat;
    const q = search.toLowerCase();
    const searchOk = !q || d.name.toLowerCase().includes(q) || d.def.toLowerCase().includes(q);
    return catOk && searchOk;
  }), [activeCat, search]);

  function startQuiz() {
    const d = shuffle(filtered);
    setDeck(d); setIdx(0); setFlipped(false); setCorrect(0); setWrong(0); setDone(false);
  }

  function handleModeChange(m) {
    setMode(m);
    if (m === "quiz") {
      const d = shuffle(filtered);
      setDeck(d); setIdx(0); setFlipped(false); setCorrect(0); setWrong(0); setDone(false);
    }
  }

  function flip() { if (!flipped) setFlipped(true); }

  function mark(wasCorrect) {
    if (wasCorrect) setCorrect(c => c + 1); else setWrong(w => w + 1);
    const next = idx + 1;
    if (next >= deck.length) { setDone(true); } else { setIdx(next); setFlipped(false); }
  }

  function skip() {
    const next = idx + 1;
    if (next >= deck.length) { setDone(true); } else { setIdx(next); setFlipped(false); }
  }

  const card = deck[idx];
  const pct = deck.length ? Math.round((idx / deck.length) * 100) : 0;
  const scorePct = (correct + wrong) ? Math.round((correct / (correct + wrong)) * 100) : 0;

  const s = {
    wrap: { fontFamily: "var(--font-sans)", padding: "1rem 0" },
    searchRow: { display: "flex", gap: 8, marginBottom: 12 },
    input: { flex: 1, padding: "8px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 14, outline: "none" },
    modeBtns: { display: "flex", flexWrap: "wrap", gap: 6 },
    modeBtn: (active) => ({ padding: "7px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: active ? "var(--color-background-tertiary)" : "var(--color-background-primary)", color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: active ? 500 : 400, fontSize: 13, cursor: "pointer" }),
    cats: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" },
    catBtn: (active) => ({ padding: "5px 11px", border: `0.5px solid ${active ? "var(--color-border-primary)" : "var(--color-border-tertiary)"}`, borderRadius: 20, background: active ? "var(--color-background-secondary)" : "var(--color-background-primary)", color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: active ? 500 : 400, fontSize: 12, cursor: "pointer" }),
    count: { fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 12 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(195px,1fr))", gap: 10 },
    card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: 14, cursor: "pointer" },
    cardCat: { fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-tertiary)", marginBottom: 6 },
    cardName: { fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 6, lineHeight: 1.3 },
    cardDef: { fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" },
    dot: (cat) => ({ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: CAT_COLORS[cat] || "#888", marginRight: 5, verticalAlign: "middle" }),
    // quiz
    quizWrap: { maxWidth: 520, margin: "0 auto", textAlign: "center" },
    quizMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", fontSize: 13, color: "var(--color-text-secondary)" },
    progressWrap: { height: 3, background: "var(--color-background-secondary)", borderRadius: 2, marginBottom: "1.5rem" },
    progressBar: (w) => ({ height: "100%", borderRadius: 2, background: "#1D9E75", width: w + "%", transition: "width 0.3s" }),
    flashcard: { minHeight: 220, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-xl)", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", marginBottom: "1rem" },
    fcSide: { fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-tertiary)", position: "absolute", top: 14, left: 14 },
    fcCat: (cat) => ({ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: CAT_COLORS[cat] || "#888", position: "absolute", top: 14, right: 14 }),
    fcTerm: { fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.3 },
    fcDef: { fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 },
    fcHint: { fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 12 },
    quizBtns: { display: "flex", gap: 10, justifyContent: "center", marginBottom: "1rem" },
    gotIt: { padding: "9px 20px", border: "0.5px solid #0F6E56", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: "pointer", background: "var(--color-background-primary)", color: "#0F6E56" },
    missed: { padding: "9px 20px", border: "0.5px solid #993C1D", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: "pointer", background: "var(--color-background-primary)", color: "#993C1D" },
    skipBtn: { padding: "7px 16px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", fontSize: 12, cursor: "pointer", background: "none", color: "var(--color-text-tertiary)" },
    doneBox: { padding: "2rem", textAlign: "center" },
    restartBtn: { padding: "9px 20px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: "pointer", background: "var(--color-background-primary)", color: "var(--color-text-primary)" },
    // modal
    overlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" },
    modalBox: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-xl)", padding: "1.5rem", maxWidth: 480, width: "92%", maxHeight: "85vh", overflowY: "auto", position: "relative" },
    modalClose: { position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", fontSize: 18 },
    modalCat: { fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-tertiary)", marginBottom: 6 },
    modalName: { fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 12, lineHeight: 1.3 },
    modalDef: { fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.7, borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 12 },
  };

  return (
    <div style={s.wrap}>
      {/* top controls */}
      {mode !== "home" && (
        <div style={s.searchRow}>
          {mode === "reflexDetails" ? (
            <div style={{ ...s.input, cursor: "default", color: "var(--color-text-secondary)" }}>Reflex explorer</div>
          ) : mode === "notes" ? (
            <div style={{ ...s.input, cursor: "default", color: "var(--color-text-secondary)" }}>Physiology notes</div>
          ) : mode === "clinical" ? (
            <div style={{ ...s.input, cursor: "default", color: "var(--color-text-secondary)" }}>Clinical conditions</div>
          ) : (
            <input style={s.input} placeholder="Search names, definitions…" value={search} onChange={e => setSearch(e.target.value)} />
          )}
          <div style={s.modeBtns}>
            <button style={s.modeBtn(false)} onClick={() => handleModeChange("home")}>Home</button>
            {physioVisibility.viva && <button style={s.modeBtn(mode === "browse")} onClick={() => handleModeChange("browse")}>Viva</button>}
            {physioVisibility.viva && mode !== "reflexDetails" && mode !== "notes" && (
              <button style={s.modeBtn(mode === "quiz")} onClick={() => handleModeChange("quiz")}>Quiz</button>
            )}
            {physioVisibility.reflexExplorer && <button style={s.modeBtn(mode === "reflexDetails")} onClick={() => handleModeChange("reflexDetails")}>Reflex</button>}
            {physioVisibility.notes && <button style={s.modeBtn(mode === "notes")} onClick={() => handleModeChange("notes")}>Notes</button>}
            {physioVisibility.clinical && <button style={s.modeBtn(mode === "clinical")} onClick={() => handleModeChange("clinical")}>ClinCond</button>}
          </div>
        </div>
      )}
      {mode !== "reflexDetails" && mode !== "notes" && mode !== "clinical" && mode !== "home" && (
        <div style={s.cats}>
          {CATS.filter(c => c === "All" || vivaData.some(d => d.cat === c)).map(c => (
            <button key={c} style={s.catBtn(c === activeCat)} onClick={() => setActiveCat(c)}>
              {c === "All" ? `All (${vivaData.length})` : c}
            </button>
          ))}
        </div>
      )}

      {/* HOME */}
      {mode === "home" && (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
            New Hope
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: "0 0 2rem", lineHeight: 1.5 }}>
            Interactive physiology reference — laws, effects, reflexes, syndromes, and more
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", maxWidth: 500, margin: "0 auto" }}>
            {physioVisibility.viva && <button onClick={() => handleModeChange("browse")}
              onMouseEnter={() => setHoveredMode("browse")}
              onMouseLeave={() => setHoveredMode(null)}
              style={{ flex: "1 1 200px", padding: "1.5rem", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-xl)", cursor: "pointer", textAlign: "center", transition: "border-color 0.15s, transform 0.15s", borderColor: hoveredMode === "browse" ? "var(--color-border-primary)" : "var(--color-border-secondary)", transform: hoveredMode === "browse" ? "translateY(-2px)" : "translateY(0)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📖</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>Viva Savior</div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{vivaData.length} laws, effects, syndromes & more</div>
            </button>}
            {physioVisibility.reflexExplorer && <button onClick={() => handleModeChange("reflexDetails")}
              onMouseEnter={() => setHoveredMode("reflexDetails")}
              onMouseLeave={() => setHoveredMode(null)}
              style={{ flex: "1 1 200px", padding: "1.5rem", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-xl)", cursor: "pointer", textAlign: "center", transition: "border-color 0.15s, transform 0.15s", borderColor: hoveredMode === "reflexDetails" ? "var(--color-border-primary)" : "var(--color-border-secondary)", transform: hoveredMode === "reflexDetails" ? "translateY(-2px)" : "translateY(0)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>Reflex Explorer</div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{reflexDetailData.length} detailed reflex breakdowns</div>
            </button>}
            {physioVisibility.notes && <button onClick={() => handleModeChange("notes")}
              onMouseEnter={() => setHoveredMode("notes")}
              onMouseLeave={() => setHoveredMode(null)}
              style={{ flex: "1 1 200px", padding: "1.5rem", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-xl)", cursor: "pointer", textAlign: "center", transition: "border-color 0.15s, transform 0.15s", borderColor: hoveredMode === "notes" ? "var(--color-border-primary)" : "var(--color-border-secondary)", transform: hoveredMode === "notes" ? "translateY(-2px)" : "translateY(0)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📓</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>Physiology Notes</div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{notesData.length} structured reference entries</div>
            </button>}
            {physioVisibility.clinical && <button onClick={() => handleModeChange("clinical")}
              onMouseEnter={() => setHoveredMode("clinical")}
              onMouseLeave={() => setHoveredMode(null)}
              style={{ flex: "1 1 200px", padding: "1.5rem", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-xl)", cursor: "pointer", textAlign: "center", transition: "border-color 0.15s, transform 0.15s", borderColor: hoveredMode === "clinical" ? "var(--color-border-primary)" : "var(--color-border-secondary)", transform: hoveredMode === "clinical" ? "translateY(-2px)" : "translateY(0)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏥</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>Clinical Conditions</div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{clinicalData.length} conditions with pathophysiology</div>
            </button>}
          </div>
        </div>
      )}

      {/* BROWSE */}
      {mode === "browse" && (
        <>
          <div style={s.count}>{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</div>
          <div style={s.grid}>
            {filtered.map((d, i) => (
              <div key={i} style={s.card} onClick={() => setModal(d)}>
                <div style={s.cardCat}><span style={s.dot(d.cat)} />{d.cat}</div>
                <div style={s.cardName}>{d.name}</div>
                <div style={s.cardDef}>{d.def}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* QUIZ */}
      {mode === "quiz" && (
        <div style={s.quizWrap}>
          {!done && card ? (
            <>
              <div style={s.quizMeta}>
                <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>{idx + 1} / {deck.length}</span>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontWeight: 500, color: "#0F6E56" }}>{correct} ✓</span>
                  <span style={{ fontWeight: 500, color: "#993C1D" }}>{wrong} ✗</span>
                </div>
              </div>
              <div style={s.progressWrap}><div style={s.progressBar(pct)} /></div>
              <div style={s.flashcard} onClick={flip}>
                <span style={s.fcSide}>{flipped ? "Definition" : "Term"}</span>
                <span style={s.fcCat(card.cat)}>{card.cat}</span>
                {!flipped ? (
                  <>
                    <div style={s.fcTerm}>{card.name}</div>
                    <div style={s.fcHint}>Tap to reveal definition</div>
                  </>
                ) : (
                  <div style={s.fcDef}>{card.def}</div>
                )}
              </div>
              {flipped && (
                <div style={s.quizBtns}>
                  <button style={s.gotIt} onClick={() => mark(true)}>✓ Got it</button>
                  <button style={s.missed} onClick={() => mark(false)}>✗ Missed</button>
                </div>
              )}
              <button style={s.skipBtn} onClick={skip}>Skip →</button>
            </>
          ) : done ? (
            <div style={s.doneBox}>
              <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
                {scorePct >= 80 ? "Excellent work!" : scorePct >= 50 ? "Good effort!" : "Keep practising!"}
              </div>
              <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
                {correct} correct, {wrong} missed ({scorePct}%)
              </div>
              <button style={s.restartBtn} onClick={startQuiz}>Restart quiz ↺</button>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)", paddingTop: "2rem" }}>No entries match your current filter.</div>
          )}
        </div>
      )}

      {mode === "reflexDetails" && <ReflexDetailsExplorer reflexes={reflexDetailData} />}
      {mode === "notes" && <PnCNotesViewer data={notesData} />}
      {mode === "clinical" && <ClinicalConditionsViewer data={clinicalData} />}

      {/* MODAL — enriched with PnC data when available */}
      {modal && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={s.modalBox}>
            <button style={s.modalClose} onClick={() => setModal(null)}>✕</button>
            <div style={s.modalCat}><span style={s.dot(modal.cat)} />{modal.cat}</div>
            <div style={s.modalName}>{modal.name}</div>
            <div style={s.modalDef}>{modal.def}</div>
            {notesLookup[modal.name] !== undefined && (
              <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: 12, paddingTop: 12 }}>
                <div style={{
                  fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                  color: "var(--color-text-tertiary)", marginBottom: 8,
                }}>
                  Notes Reference
                </div>
                <PnCNoteCard entry={notesData[notesLookup[modal.name]]} query="" />
              </div>
            )}
            {modal.cat === "Reflexes" && getReflexDetail(modal.name, reflexDetailData) && (
              (() => {
                const ref = getReflexDetail(modal.name, reflexDetailData);
                return (
                  <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: 12, paddingTop: 12 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                      color: "var(--color-text-tertiary)", marginBottom: 8,
                    }}>
                      Reflex Details
                    </div>
                    <DetailReflexCard reflex={ref} query="" />
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}