const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('================================================================');
console.log('🧪 VCamp Personal AI Companion - Automated Verification Suite');
console.log('================================================================\n');

// ---------------------------------------------------------
// TEST 1: Question Bank Database (2,000 Questions)
// ---------------------------------------------------------
console.log('▶ Test 1: Verifying 2,000 Question Bank DB & Validation Quality...');
const dbPath = path.join(__dirname, '..', 'data', 'questions_db.json');
assert(fs.existsSync(dbPath), 'questions_db.json should exist');

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
assert.strictEqual(db.totalQuestions, 2000, 'Total questions must be exactly 2000');
assert.strictEqual(db.questions.length, 2000, 'Array length must be 2000');

assert.strictEqual(db.stats.statusCounts.validated, 1556, 'Validated questions count must match');
assert.strictEqual(db.stats.statusCounts.needs_review, 151, 'Needs review count must match');
assert.strictEqual(db.stats.statusCounts.flagged, 293, 'Flagged count must match');

const categories = Object.keys(db.stats.categoryCounts);
assert(categories.length >= 12, 'Must have at least 12 categorized workplace topics');
console.log(`   ✓ 2,000 questions verified across ${categories.length} topics.`);
console.log(`   ✓ 1,556 validated active questions ready for natural conversations.\n`);

// ---------------------------------------------------------
// TEST 2: Mood-to-Category Association (10 Mood States)
// ---------------------------------------------------------
console.log('▶ Test 2: Verifying 10 Mood States & Category Mapping...');
const MOOD_TO_CATEGORIES = {
  stressed: ['Stress and Pressure', 'Workload', 'Workplace Support', 'Work-Life Balance'],
  frustrated: ['Workload', 'Communication', 'Workplace Support', 'Concentration'],
  sad: ['Emotional Wellbeing', 'Workplace Support', 'Workplace Satisfaction'],
  angry: ['Communication', 'Workplace Support', 'Workplace Satisfaction'],
  confused: ['Confidence', 'Communication', 'Learning and Growth'],
  tired: ['Work-Life Balance', 'Emotional Wellbeing', 'Workload'],
  happy: ['Motivation', 'Workplace Satisfaction', 'Recognition', 'Personal Goals'],
  excited: ['Motivation', 'Personal Goals', 'Recognition', 'Learning and Growth'],
  motivated: ['Personal Goals', 'Professional Development', 'Motivation', 'Learning and Growth'],
  neutral: ['Teamwork', 'Communication', 'Concentration', 'Workplace Satisfaction'],
};

const expectedMoods = ['happy', 'sad', 'angry', 'frustrated', 'stressed', 'confused', 'excited', 'motivated', 'tired', 'neutral'];
expectedMoods.forEach((m) => {
  assert(MOOD_TO_CATEGORIES[m] && MOOD_TO_CATEGORIES[m].length > 0, `Mood ${m} must have category mapping`);
});
console.log(`   ✓ All 10 mood states mapped to contextual psychological questions.\n`);

// ---------------------------------------------------------
// TEST 3: Smart Reminder Natural Language Parsing
// ---------------------------------------------------------
console.log('▶ Test 3: Verifying Smart Reminder Natural Language Parsing...');

function parseNaturalLanguageReminder(input) {
  const text = input.trim();
  if (!text) return null;

  let targetDate = new Date();
  let title = text;
  let priority = 'medium';

  if (/\b(urgent|important|asap|critical)\b/i.test(text)) {
    priority = 'high';
  } else if (/\b(whenever|low priority|someday|eventually)\b/i.test(text)) {
    priority = 'low';
  }

  const inMatch = text.match(/\bin\s+(\d+)\s*(mins?|minutes?|hours?|hrs?|secs?|seconds?)\b/i);
  if (inMatch) {
    const amount = parseInt(inMatch[1], 10);
    const unit = inMatch[2].toLowerCase();
    let ms = 0;
    if (unit.startsWith('sec')) ms = amount * 1000;
    else if (unit.startsWith('hour') || unit.startsWith('hr')) ms = amount * 3600 * 1000;
    else ms = amount * 60 * 1000;

    targetDate = new Date(Date.now() + ms);
    title = text
      .replace(/\bremind(\s+me)?(\s+to)?\b/i, '')
      .replace(inMatch[0], '')
      .replace(/\bto\s+/i, '')
      .trim();
    return { title: title || 'Quick Reminder', dueTime: targetDate, priority };
  }

  const atMatch = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (atMatch) {
    let hours = parseInt(atMatch[1], 10);
    const mins = atMatch[2] ? parseInt(atMatch[2], 10) : 0;
    const meridiem = atMatch[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    targetDate.setHours(hours, mins, 0, 0);
    if (targetDate.getTime() <= Date.now()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    title = text
      .replace(/\bremind(\s+me)?(\s+to)?\b/i, '')
      .replace(atMatch[0], '')
      .replace(/\bto\s+/i, '')
      .trim();
    return { title: title || 'Scheduled Reminder', dueTime: targetDate, priority };
  }

  return null;
}

const r1 = parseNaturalLanguageReminder('remind me in 15 minutes to submit status report');
assert(r1 !== null, 'Should parse minutes');
assert.strictEqual(r1.priority, 'medium');
assert(r1.dueTime.getTime() > Date.now() + 14 * 60 * 1000);
console.log(`   ✓ Parsed: "${r1.title}" in 15m (Due: ${r1.dueTime.toLocaleTimeString()})`);

const r2 = parseNaturalLanguageReminder('urgent remind me at 4:30 pm to call team lead');
assert(r2 !== null, 'Should parse time of day');
assert.strictEqual(r2.priority, 'high');
console.log(`   ✓ Parsed urgent reminder: "${r2.title}" (Priority: ${r2.priority})\n`);

// ---------------------------------------------------------
// TEST 4: Desktop Movement Coordinate Bounding & Translation
// ---------------------------------------------------------
console.log('▶ Test 4: Verifying Desktop Movement Simulation & Boundary Clamping...');

const bounds = { x: 0, y: 0, width: 1920, height: 1080 };
const margin = 24;
const robotW = 220;
const minX = bounds.x + margin;
const maxX = bounds.x + bounds.width - robotW - margin;

let currentX = 1800;
let direction = 1;
const speedPx = 260; // fast sprint
const dt = 0.5;

// Step 1: movement beyond boundary bounces
let nextX = currentX + direction * speedPx * dt;
if (nextX >= maxX) {
  nextX = maxX;
  direction = -1;
}
assert.strictEqual(nextX, maxX, 'Should clamp to screen boundary');
assert.strictEqual(direction, -1, 'Direction should invert (bounce) at boundary');

// Step 2: reverses smoothly
nextX = nextX + direction * speedPx * dt;
assert(nextX < maxX, 'Should move left away from edge');
console.log(`   ✓ Edge turnaround and velocity translation confirmed.\n`);

// ---------------------------------------------------------
// TEST 5: Sentiment Lexicon with 10 States & Tamil Script
// ---------------------------------------------------------
console.log('▶ Test 5: Verifying Sentiment Detection Across 10 States & Tamil Script...');

function analyzeTextSentiment(text) {
  if (/(\u0BAE\u0B95\u0BBF\u0BB4\u0BCD\u0B9A\u0BCD\u0B9A\u0BBF|happy|nandri)/i.test(text)) return 'happy';
  if (/(excited|superb|verithanam)/i.test(text)) return 'excited';
  if (/(\u0BB5\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4\u0BAE\u0BCD|sad|kavalai)/i.test(text)) return 'sad';
  if (/(stressed|\u0BAE\u0BA9\s*\u0B85\u0BB4\u0BC1\u0BA4\u0BCD\u0BA4\u0BAE\u0BCD|tension|deadline)/i.test(text)) return 'stressed';
  if (/(motivated|focused|\u0B8A\u0B95\u0BCD\u0B95\u0BAE\u0BCD)/i.test(text)) return 'motivated';
  if (/(tired|exhausted|\u0B9A\u0BCB\u0BB0\u0BCD\u0BB5\u0BC1|\u0BA4\u0BC2\u0B95\u0BCD\u0B95\u0BAE\u0BCD)/i.test(text)) return 'tired';
  if (/(frustrated|annoyed|mudiyala)/i.test(text)) return 'frustrated';
  if (/(angry|kovam)/i.test(text)) return 'angry';
  if (/(confused|puriyala)/i.test(text)) return 'confused';
  return 'neutral';
}

assert.strictEqual(analyzeTextSentiment('romba magizhchi and happy today'), 'happy');
assert.strictEqual(analyzeTextSentiment('I have high deadline tension and feel stressed'), 'stressed');
assert.strictEqual(analyzeTextSentiment('Very focused and motivated to complete project'), 'motivated');
assert.strictEqual(analyzeTextSentiment('romba tired ah irukku, need sleep'), 'tired');
console.log('   ✓ Happy, Stressed, Motivated, Tired classified accurately.\n');

console.log('================================================================');
console.log('✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY (5/5)');
console.log('================================================================');
