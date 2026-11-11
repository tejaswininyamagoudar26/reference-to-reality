/**
 * Rule-based emergency screening. Runs on the server before any AI call so the
 * AI is never the only mechanism that spots urgent warning signs.
 */

export type EmergencyCategory =
  | "cardiac"
  | "breathing"
  | "stroke"
  | "bleeding"
  | "consciousness"
  | "seizure"
  | "allergy"
  | "poisoning"
  | "self-harm"
  | "severe-pain"
  | "infection";

export interface EmergencySign {
  category: EmergencyCategory;
  label: string;
}

const RULES: { category: EmergencyCategory; label: string; patterns: RegExp[] }[] = [
  {
    category: "cardiac",
    label: "Chest pain or pressure",
    patterns: [
      /chest\s+(pain|pressure|tightness|hurts?|discomfort)/i,
      /(pain|pressure|tightness)\s+in\s+(my\s+)?chest/i,
      /heart\s+attack/i,
      /pain\s+(spreading|radiating)\s+(to|into)\s+(my\s+)?(left\s+)?(arm|jaw)/i,
    ],
  },
  {
    category: "breathing",
    label: "Difficulty breathing",
    patterns: [
      /(can'?t|cannot|can\s+not|unable\s+to|hard\s+to|struggling\s+to|trouble|difficulty)\s+breath/i,
      /short(ness)?\s+of\s+breath/i,
      /gasping\s+for\s+(air|breath)/i,
      /(lips|face)\s+(are\s+|is\s+|turning\s+)?(blue|purple)/i,
      /choking/i,
    ],
  },
  {
    category: "stroke",
    label: "Possible stroke signs",
    patterns: [
      /face\s+(is\s+)?droop/i,
      /slurred\s+speech/i,
      /(sudden(ly)?\s+)?(numb(ness)?|weak(ness)?|paralys)\w*\s+(on\s+)?(one|left|right)\s+side/i,
      /\bstroke\b/i,
      /sudden(ly)?\s+(can'?t|cannot|unable\s+to)\s+(speak|talk|see|move)/i,
    ],
  },
  {
    category: "bleeding",
    label: "Severe bleeding or blood loss",
    patterns: [
      /(severe|heavy|uncontrolled|won'?t\s+stop|non[-\s]?stop)\s+bleed/i,
      /bleeding\s+(heavily|a\s+lot|won'?t\s+stop|that\s+won'?t\s+stop)/i,
      /(cough(ing)?|vomit(ing)?|throw(ing)?\s+up)\s+(up\s+)?blood/i,
      /blood\s+in\s+(my\s+)?vomit/i,
    ],
  },
  {
    category: "consciousness",
    label: "Fainting or loss of consciousness",
    patterns: [/unconscious/i, /passed\s+out/i, /\bfaint(ed|ing)\b/i, /(not|isn'?t)\s+(waking|responding|responsive)/i],
  },
  {
    category: "seizure",
    label: "Seizure",
    patterns: [/seizure/i, /convuls/i, /\bfits?\b.*(shaking|jerking)/i],
  },
  {
    category: "allergy",
    label: "Severe allergic reaction",
    patterns: [
      /anaphyla/i,
      /(throat|tongue|lips?|face)\s+(is\s+|are\s+)?(swelling|swollen|closing)/i,
      /swelling\s+(of|in)\s+(my\s+)?(throat|tongue|lips?|face)/i,
    ],
  },
  {
    category: "poisoning",
    label: "Overdose or poisoning",
    patterns: [/overdos/i, /poison/i, /(took|swallowed|ate)\s+(too\s+many|a\s+lot\s+of|the\s+whole)\s+(pills|tablets|bottle)/i],
  },
  {
    category: "self-harm",
    label: "Thoughts of self-harm",
    patterns: [
      /suicid/i,
      /kill\s+my\s*self/i,
      /end\s+my\s+life/i,
      /(hurt|harm)(ing)?\s+my\s*self/i,
      /self[-\s]?harm/i,
      /don'?t\s+want\s+to\s+(live|be\s+alive)/i,
    ],
  },
  {
    category: "severe-pain",
    label: "Sudden severe pain",
    patterns: [
      /worst\s+headache/i,
      /sudden\s+(and\s+)?(severe|intense|excruciating)\s+(headache|pain)/i,
      /(severe|unbearable|excruciating)\s+(abdominal|stomach|belly)\s+pain/i,
    ],
  },
  {
    category: "infection",
    label: "Fever with warning signs",
    patterns: [
      /stiff\s+neck.*fever|fever.*stiff\s+neck/i,
      /(baby|infant|newborn).*(fever|temperature)|(fever|temperature).*(baby|infant|newborn)/i,
      /fever.*(confus|rash\s+that\s+doesn'?t\s+fade)/i,
    ],
  },
];

export function detectEmergencySigns(text: string): EmergencySign[] {
  if (!text) return [];
  const found: EmergencySign[] = [];
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      found.push({ category: rule.category, label: rule.label });
    }
  }
  return found;
}
