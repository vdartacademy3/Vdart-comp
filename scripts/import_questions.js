import fs from 'fs';
import path from 'path';

const SOURCE_FILE = 'D:/Aathil/sentiment analysis/VCamp/data/2000_employee_psychology_questions_with_options (1).txt';
const OUTPUT_DB = 'D:/Aathil/sentiment analysis/VCamp/data/questions_db.json';

const CATEGORIES = [
  'Motivation',
  'Workload',
  'Stress and Pressure',
  'Concentration',
  'Communication',
  'Teamwork',
  'Workplace Satisfaction',
  'Confidence',
  'Professional Development',
  'Recognition',
  'Work-Life Balance',
  'Emotional Wellbeing',
  'Personal Goals',
  'Learning and Growth',
  'Workplace Support'
];

const CATEGORY_KEYWORDS = {
  'Motivation': ['motivation', 'energy', 'drive', 'enthusiasm', 'inspiring', 'achievement', 'purpose', 'engagement', 'passion'],
  'Workload': ['workload', 'deadlines', 'busy period', 'task priorities', 'too much work', 'overwhelmed', 'pacing', 'task volume', 'priorities'],
  'Stress and Pressure': ['stress', 'pressure', 'demanding', 'tense', 'anxiety', 'difficult task', 'friction', 'challenging', 'cope'],
  'Concentration': ['distraction', 'distractions', 'focus', 'uninterrupted', 'deep work', 'concentration', 'quiet area', 'attention'],
  'Communication': ['communication method', 'communication style', 'feedback', 'discussion', 'meetings', 'coaching conversation', 'ask questions', 'clarity'],
  'Teamwork': ['colleague', 'teammate', 'collaborate', 'team space', 'mutual support', 'peer', 'team members', 'shared space'],
  'Workplace Satisfaction': ['workplace environment', 'satisfaction', 'fulfillment', 'comfort', 'atmosphere', 'enjoyment', 'workplace factors'],
  'Confidence': ['confidence', 'self-assurance', 'decisive', 'certainty', 'doubt', 'capability', 'self-belief'],
  'Professional Development': ['career journey', 'career growth', 'promotion', 'mentor', 'mentorship', 'future role', 'progression', 'advancement'],
  'Recognition': ['recognition', 'appreciated', 'valued', 'praised', 'acknowledged', 'rewarded', 'credit'],
  'Work-Life Balance': ['work-life', 'hours', 'after work', 'personal time', 'boundaries', 'evening', 'weekend', 'disconnect'],
  'Emotional Wellbeing': ['emotional', 'mood', 'feelings', 'well-being', 'burnout', 'exhausted', 'mental health', 'resilience', 'morale'],
  'Personal Goals': ['personal goals', 'milestones', 'aspirations', 'vision', 'planning', 'objectives', 'targets'],
  'Learning and Growth': ['training', 'learn', 'skill development', 'coaching', 'new knowledge', 'learning', 'upskilling', 'expertise'],
  'Workplace Support': ['support', 'manager has relevant expertise', 'manager approaches challenges', 'guidance', 'assistance', 'resources', 'manager/team leader']
};

function categorizeQuestion(text, options) {
  const combined = (text + ' ' + Object.values(options).join(' ')).toLowerCase();
  let bestCategory = 'Workplace Support';
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (combined.includes(kw.toLowerCase())) {
        score += kw.includes(' ') ? 3 : 1; // multi-word matches have higher specificity
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  return bestCategory;
}

function validateQuestion(q) {
  const flags = [];
  const text = q.text;
  const options = q.options;

  // 1. Detect Generic Placeholder Answers
  const placeholderPatterns = [
    /The first option\/area/i,
    /The second option\/area/i,
    /The third option\/area/i,
    /Placeholder/i,
    /^Option [A-E]$/i
  ];

  let hasPlaceholder = false;
  for (const optVal of Object.values(options)) {
    if (placeholderPatterns.some(p => p.test(optVal))) {
      hasPlaceholder = true;
      flags.push('GENERIC_PLACEHOLDER_OPTION');
      break;
    }
  }

  // 2. Detect Grammatical Issues (repeated pronouns / awkward tokens)
  const grammarPatterns = [
    /\bto you (notice|complete|feel|find|prefer|improve)\b/i,
    /\bfor you to you\b/i,
    /\byou feel you have with your\b/i,
    /\bmost likely to you\b/i
  ];

  let hasGrammarIssue = false;
  for (const gp of grammarPatterns) {
    if (gp.test(text)) {
      hasGrammarIssue = true;
      flags.push('GRAMMAR_ISSUE_REPEATED_PRONOUN');
      break;
    }
  }

  // 3. Detect Incomplete Questions or Options
  const optionKeys = Object.keys(options);
  if (optionKeys.length < 3) {
    flags.push('FEWER_THAN_3_OPTIONS');
  }

  if (!text.endsWith('?')) {
    flags.push('MISSING_QUESTION_MARK');
  }

  // Calculate Quality Status
  let status = 'validated';
  let qualityScore = 1.0;

  if (hasPlaceholder) {
    status = 'flagged';
    qualityScore = 0.4;
  } else if (hasGrammarIssue) {
    status = 'needs_review';
    qualityScore = 0.7;
  } else if (flags.length > 0) {
    status = 'needs_review';
    qualityScore = 0.8;
  }

  return {
    flags,
    status, // 'validated' | 'needs_review' | 'flagged'
    qualityScore
  };
}

console.log('📖 Reading source question bank:', SOURCE_FILE);
const fileContent = fs.readFileSync(SOURCE_FILE, 'utf8');
const lines = fileContent.split('\n');

const questions = [];
let currentQ = null;
let currentOptions = {};

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const qMatch = line.match(/^(\d+)\.\s*(.+)$/);
  if (qMatch) {
    // If previous question exists, save it
    if (currentQ) {
      currentQ.options = currentOptions;
      questions.push(currentQ);
    }

    currentQ = {
      id: parseInt(qMatch[1], 10),
      text: qMatch[2].trim(),
      options: {}
    };
    currentOptions = {};
    continue;
  }

  const optMatch = line.match(/^([A-E])\.\s*(.+)$/);
  if (optMatch && currentQ) {
    currentOptions[optMatch[1]] = optMatch[2].trim();
  }
}

// Add final question
if (currentQ) {
  currentQ.options = currentOptions;
  questions.push(currentQ);
}

console.log(`Total questions parsed: ${questions.length}`);

// Categorize and Validate
const categoryCounts = {};
const statusCounts = { validated: 0, needs_review: 0, flagged: 0 };
const flagCounts = {};
const questionMap = new Map();
let duplicateCount = 0;

const processedQuestions = questions.map((q) => {
  const category = categorizeQuestion(q.text, q.options);
  categoryCounts[category] = (categoryCounts[category] || 0) + 1;

  const validation = validateQuestion(q);
  statusCounts[validation.status] = (statusCounts[validation.status] || 0) + 1;

  for (const f of validation.flags) {
    flagCounts[f] = (flagCounts[f] || 0) + 1;
  }

  // Duplicate detection
  const normalizedText = q.text.toLowerCase().replace(/[^\w\s]/g, '').trim();
  if (questionMap.has(normalizedText)) {
    duplicateCount++;
    validation.flags.push('DUPLICATE_QUESTION');
    if (validation.status === 'validated') {
      validation.status = 'needs_review';
    }
  } else {
    questionMap.set(normalizedText, q.id);
  }

  return {
    id: q.id,
    text: q.text,
    options: q.options,
    category,
    qualityScore: validation.qualityScore,
    status: validation.status,
    flags: validation.flags,
    isActive: validation.status === 'validated' // Only validated questions are active for dialogue
  };
});

// Output Database
const dbPayload = {
  version: '1.0.0',
  importedAt: new Date().toISOString(),
  totalQuestions: processedQuestions.length,
  stats: {
    statusCounts,
    categoryCounts,
    duplicateCount,
    flagCounts
  },
  questions: processedQuestions
};

fs.writeFileSync(OUTPUT_DB, JSON.stringify(dbPayload, null, 2), 'utf8');
console.log(`\n💾 Saved Question Bank Database to: ${OUTPUT_DB}`);
console.log(`\n📊 SUMMARY REPORT:`);
console.log(`Total Questions: ${processedQuestions.length}`);
console.log(`- Validated (Active in Conversations): ${statusCounts.validated}`);
console.log(`- Needs Review: ${statusCounts.needs_review}`);
console.log(`- Flagged (Low Quality / Placeholders): ${statusCounts.flagged}`);
console.log(`- Duplicates Detected: ${duplicateCount}`);
console.log(`\nFlags Encountered:`, flagCounts);
console.log(`\nCategory Distribution:`, categoryCounts);
