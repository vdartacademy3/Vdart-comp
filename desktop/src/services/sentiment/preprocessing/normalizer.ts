import { DetectedLanguage } from '../types';

export interface PreprocessedText {
  raw: string;
  normalized: string;
  tokens: string[];
  language: DetectedLanguage;
  hasNegation: boolean;
  negatedTerms: string[];
  intensifiers: string[];
  sarcasmLikely: boolean;
  emojis: string[];
}

const TANGLISH_PATTERNS = [
  /\b(epdi|eppadi|irukinga|iruken|irukka|vaanga|ponga|sollunga|solu|pannunga|panna|venum|venam|aama|illa|illai|romba|nalla|theriyum|theriyala|enna|edhu|yaar|enge|engu|kooda|apram|appuram)\b/i,
  /\b(vanakkam|nanri|kudunga|edunga|paaru|kelu|solunga|mudiyala|sodhappal|kovam|kadupu|veruppu|kalaippa|thookam|valikudhu|sandhosham|magizhchi|mass|semma|attagasam|verithanam)\b/i
];

const NEGATION_PATTERNS = [
  /\b(not|no|never|none|neither|nor|barely|hardly|scarcely|cannot|can't|dont|don't|didnt|didn't|wont|won't|isnt|isn't|arent|aren't|wasnt|wasn't|nothing)\b/i,
  /\b(illa|illai|illadha|mudiyadhu|koodadhu|kidayadhu|vendam|venam)\b/i,
  /[\u0B87][\u0BB2][\u0BCD][\u0BB2][\u0BC8]/ // இல்லை
];

const INTENSIFIER_PATTERNS = [
  /\b(very|extremely|super|really|totally|absolutely|insanely|deeply|exceptionally)\b/i,
  /\b(romba|semma|bayangara|marana|vera level|full ah|suthamaga)\b/i,
  /[\u0BB0][\u0BC6][\u0BAE][\u0BCD][\u0BAA]/ // ரொம்ப
];

const SARCASM_PATTERNS = [
  /\b(oh\s+great|just\s+what\s+i\s+needed|brilliant|fantastic|love\s+it\s+when\s+it\s+breaks|good\s+luck\s+with\s+that)\b/i,
  /\b(super\s+da.*(bug|crash|error|fail)|semma.*(sodhappal|problem|issue))\b/i
];

const EMOJI_REGEX = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu;

export function preprocessText(input: string): PreprocessedText {
  const raw = input || '';
  const trimmed = raw.trim();

  // 1. Language Detection
  let language: DetectedLanguage = 'en';
  const hasTamilUnicode = /[\u0B80-\u0BFF]/.test(trimmed);
  if (hasTamilUnicode) {
    language = 'ta';
  } else if (TANGLISH_PATTERNS.some((pat) => pat.test(trimmed))) {
    language = 'tanglish';
  } else if (trimmed.length > 0) {
    language = 'en';
  } else {
    language = 'unknown';
  }

  // 2. Extract Emojis
  const emojis = trimmed.match(EMOJI_REGEX) || [];

  // 3. Lowercase & Normalize
  const normalized = trimmed.toLowerCase();

  // 4. Tokenize
  const tokens = normalized
    .replace(/[^\w\s\u0B80-\u0BFF]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  // 5. Negation analysis
  let hasNegation = false;
  const negatedTerms: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (NEGATION_PATTERNS.some((p) => p.test(tok))) {
      hasNegation = true;
      // Capture the next 1-2 words that are being negated
      if (i + 1 < tokens.length) negatedTerms.push(tokens[i + 1]);
      if (i + 2 < tokens.length) negatedTerms.push(tokens[i + 2]);
    }
  }

  // 6. Intensifiers
  const intensifiers: string[] = [];
  for (const tok of tokens) {
    if (INTENSIFIER_PATTERNS.some((p) => p.test(tok))) {
      intensifiers.push(tok);
    }
  }

  // 7. Sarcasm detection
  const sarcasmLikely = SARCASM_PATTERNS.some((p) => p.test(normalized));

  return {
    raw,
    normalized,
    tokens,
    language,
    hasNegation,
    negatedTerms,
    intensifiers,
    sarcasmLikely,
    emojis,
  };
}

export const normalizeAndTokenize = preprocessText;

