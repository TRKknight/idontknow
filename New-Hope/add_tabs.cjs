const fs = require('fs');
const path = 'D:\\Tanmay\\MBBS\\Projects\\Website\\idontknow-main\\New-Hope\\src\\clinical_data.js';
let content = fs.readFileSync(path, 'utf8');

const TAB_MAP = {
  'Iron Deficiency Anemia (IDA)': 'I. Hematology and Immunology',
  'Megaloblastic Anemia': 'I. Hematology and Immunology',
  'Aplastic Anemia': 'I. Hematology and Immunology',
  'Sickle Cell Anemia and Thalassemia': 'I. Hematology and Immunology',
  'Polycythemia Vera (Erythremia)': 'I. Hematology and Immunology',
  'Jaundice': 'I. Hematology and Immunology',
  'Rh Incompatibility': 'I. Hematology and Immunology',
  'Kernicterus': 'I. Hematology and Immunology',
  'Leukemia': 'I. Hematology and Immunology',
  'Acquired Immunodeficiency Syndrome (AIDS/HIV)': 'I. Hematology and Immunology',
  'Idiopathic Thrombocytopenic Purpura (ITP)': 'I. Hematology and Immunology',
  'Hemophilia (A and B)': 'I. Hematology and Immunology',
  'von Willebrand Disease (vWD)': 'I. Hematology and Immunology',
  'Disseminated Intravascular Coagulation (DIC)': 'I. Hematology and Immunology',
  'Transfusion Reactions / Hazards': 'I. Hematology and Immunology',
  'Jaundice (Icterus)': 'I. Hematology and Immunology',

  'Acute Myocardial Infarction (AMI)': 'II. Cardiovascular System (CVS)',
  'Angina Pectoris': 'II. Cardiovascular System (CVS)',
  'Sinus Tachycardia and Bradycardia': 'II. Cardiovascular System (CVS)',
  'Atrial Fibrillation and Flutter': 'II. Cardiovascular System (CVS)',
  'Ventricular Fibrillation': 'II. Cardiovascular System (CVS)',
  'Heart Blocks': 'II. Cardiovascular System (CVS)',
  'Stokes-Adams Syndrome': 'II. Cardiovascular System (CVS)',
  'Hypertension': 'II. Cardiovascular System (CVS)',
  'Circulatory Shock': 'II. Cardiovascular System (CVS)',
  'Heart Failure': 'II. Cardiovascular System (CVS)',
  'Valvular Heart Disease': 'II. Cardiovascular System (CVS)',
  'Congenital Heart Defects': 'II. Cardiovascular System (CVS)',
  'Postural (Orthostatic) Hypotension': 'II. Cardiovascular System (CVS)',
  'Peripheral and Pulmonary Edema': 'II. Cardiovascular System (CVS)',
  'Cardiac Tamponade': 'II. Cardiovascular System (CVS)',
  'Edema': 'II. Cardiovascular System (CVS)',
  'Shock': 'II. Cardiovascular System (CVS)',
  'Cardiogenic Shock': 'II. Cardiovascular System (CVS)',
  'Hypovolemic Shock': 'II. Cardiovascular System (CVS)',
  'Septic Shock': 'II. Cardiovascular System (CVS)',
  'Anaphylactic Shock': 'II. Cardiovascular System (CVS)',
  'Neurogenic Shock': 'II. Cardiovascular System (CVS)',

  'Hypoxia': 'III. Respiratory System',
  'Cyanosis': 'III. Respiratory System',
  'Asphyxia': 'III. Respiratory System',
  'Drowning': 'III. Respiratory System',
  'Periodic Breathing': 'III. Respiratory System',
  "Kussmaul's Respiration": 'III. Respiratory System',
  'Dyspnea': 'III. Respiratory System',
  'Sleep Apnea Syndrome': 'III. Respiratory System',
  'Bronchial Asthma': 'III. Respiratory System',
  'Emphysema and Chronic Bronchitis (COPD)': 'III. Respiratory System',
  'Pneumonia': 'III. Respiratory System',
  'Atelectasis': 'III. Respiratory System',
  'Mountain Sickness': 'III. Respiratory System',
  'Decompression Sickness (Dysbarism / Caisson Disease)': 'III. Respiratory System',

  'Peptic Ulcer Disease': 'IV. Gastrointestinal and Metabolic',
  'Gastro-esophageal Reflux Disease (GERD)': 'IV. Gastrointestinal and Metabolic',
  'Achalasia Cardia': 'IV. Gastrointestinal and Metabolic',
  'Gastritis': 'IV. Gastrointestinal and Metabolic',
  'Pancreatitis': 'IV. Gastrointestinal and Metabolic',
  'Cystic Fibrosis': 'IV. Gastrointestinal and Metabolic',
  'Malabsorption Syndrome': 'IV. Gastrointestinal and Metabolic',
  'Hirschsprung Disease (Congenital Megacolon)': 'IV. Gastrointestinal and Metabolic',
  'Paralytic (Adynamic) Ileus': 'IV. Gastrointestinal and Metabolic',
  'Dumping Syndrome': 'IV. Gastrointestinal and Metabolic',
  'Lactose Intolerance': 'IV. Gastrointestinal and Metabolic',
  'Cirrhosis': 'IV. Gastrointestinal and Metabolic',
  'Portal Hypertension': 'IV. Gastrointestinal and Metabolic',
  'Hepatic Encephalopathy': 'IV. Gastrointestinal and Metabolic',
  'Ascites': 'IV. Gastrointestinal and Metabolic',

  'Acute Kidney Injury (AKI)': 'V. Renal and Acid-Base',
  'Chronic Kidney Disease (CKD)': 'V. Renal and Acid-Base',
  'End-Stage Renal Disease (ESRD)': 'V. Renal and Acid-Base',
  'Nephrotic Syndrome': 'V. Renal and Acid-Base',
  'Glomerulonephritis': 'V. Renal and Acid-Base',
  'Diabetes Insipidus': 'V. Renal and Acid-Base',
  'SIADH (Syndrome of Inappropriate Antidiuretic Hormone)': 'V. Renal and Acid-Base',
  'Hyponatremia': 'V. Renal and Acid-Base',
  'Hypernatremia': 'V. Renal and Acid-Base',
  'Hypokalemia': 'V. Renal and Acid-Base',
  'Hyperkalemia': 'V. Renal and Acid-Base',
  'Hypocalcemia': 'V. Renal and Acid-Base',
  'Hypercalcemia': 'V. Renal and Acid-Base',
  'Dehydration': 'V. Renal and Acid-Base',
  'Acid-Base Balance': 'V. Renal and Acid-Base',
  'Buffer Systems': 'V. Renal and Acid-Base',
  'Respiratory Acidosis': 'V. Renal and Acid-Base',
  'Respiratory Alkalosis': 'V. Renal and Acid-Base',
  'Metabolic Acidosis': 'V. Renal and Acid-Base',
  'Metabolic Alkalosis': 'V. Renal and Acid-Base',

  "Addison's Disease (Adrenal Insufficiency)": 'VI. Endocrine and Reproductive',
  "Cushing's Syndrome": 'VI. Endocrine and Reproductive',
  "Conn's Syndrome (Primary Hyperaldosteronism)": 'VI. Endocrine and Reproductive',
  'Diabetes Mellitus (Type 1)': 'VI. Endocrine and Reproductive',
  'Diabetes Mellitus (Type 2)': 'VI. Endocrine and Reproductive',
  'Diabetic Ketoacidosis (DKA)': 'VI. Endocrine and Reproductive',
  'Hyperosmolar Nonketotic Coma (HONK)': 'VI. Endocrine and Reproductive',
  'Hyperparathyroidism': 'VI. Endocrine and Reproductive',
  'Hypoparathyroidism': 'VI. Endocrine and Reproductive',
  'Hypothyroidism': 'VI. Endocrine and Reproductive',
  'Hyperthyroidism (Thyrotoxicosis)': 'VI. Endocrine and Reproductive',
  "Graves' Disease": 'VI. Endocrine and Reproductive',
  'Goiter': 'VI. Endocrine and Reproductive',
  "Hashimoto's Thyroiditis": 'VI. Endocrine and Reproductive',

  'Fever (Pyrexia)': 'VIII. Integrative Physiology'
};

let result = content.replace(
  /({\s*\n\s*"name":\s*"([^"]+)")/g,
  (match, prefix, name) => {
    const tab = TAB_MAP[name];
    if (!tab) {
      console.log('UNMAPPED: ' + name);
      return match;
    }
    return prefix + ',\n    "tab": "' + tab + '"';
  }
);

fs.writeFileSync(path, result, 'utf8');
console.log('Done. Added tabs to all mapped conditions.');
