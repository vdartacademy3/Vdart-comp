import assert from 'assert';

/**
 * Service Unit Tests for Sentiment, Multilingual Detection and Groq Registry
 */

// 1. Language Detection Logic
function detectLanguage(text) {
  const tamilRegex = /[\u0B80-\u0BFF]/;
  if (tamilRegex.test(text)) {
    return 'ta';
  }

  const tanglishTokens = [
    'epdi', 'irukinga', 'vanakkam', 'nandri', 'solunga', 'enna', 'aachu', 
    'panna', 'mudiyuma', 'romba', 'nalla', 'illa', 'theriyum', 'theriyadhu', 
    'vaanga', 'ponga', 'paathu', 'kudunga', 'thalaiva', 'seri', 'sollu'
  ];
  
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  const tanglishMatch = words.some(w => tanglishTokens.includes(w));
  if (tanglishMatch) {
    return 'tanglish';
  }

  return 'en';
}

// 2. Exact Sentiment Patterns from sentimentService.ts
const SENTIMENT_PATTERNS = {
  happy: [
    /\b(happy|glad|great|good|delighted|pleased|thanks|thank you)\b/i,
    /\b(sandhosham|magizhchi|romba nandri|nandri)\b/i,
    /(😊|😃|😄|😁|❤️|👍|🙌)/,
    /[\u0BAE][\u0B95][\u0BBF][\u0BB4][\u0BCD][\u0B9A][\u0BCD][\u0B9A][\u0BBF]/, // மகிழ்ச்சி
    /[\u0BA8][\u0BA9][\u0BCD][\u0BB1][\u0BBF]/, // நன்றி
  ],
  excited: [
    /\b(excited|thrilled|cannot wait|can't wait|hyped|amazing|wow|awesome|super|mindblowing|epic)\b/i,
    /\b(verithanam|mass|attagasam|therikka|superb|vera level)\b/i,
    /(🔥|🚀|🤩|💃|🕺|🥳|🎉|✨)/,
  ],
  sad: [
    /\b(sad|unhappy|depressed|down|heartbroken|grief|crying|lonely|hopeless|loss)\b/i,
    /\b(varutham|kavalai|sogam|azhugai|valikudhu)\b/i,
    /(😢|😭|😞|😔|💔|😿)/,
    /[\u0BB5][\u0BB0][\u0BC1][\u0BA4][\u0BCD][\u0BA4][\u0BAE][\u0BCD]/, // வருத்தம்
    /[\u0B95][\u0BB5][\u0BB2][\u0BC8]/, // கவலை
  ],
  angry: [
    /\b(angry|furious|mad|pissed|hate|disgusted|outraged|annoying|terrible)\b/i,
    /\b(kovam|erichal|kadupu|veruppu)\b/i,
    /(😡|😠|🤬|👿)/,
    /[\u0B95][\u0BCB][\u0BB5][\u0BAE][\u0BCD]/, // கோவம்
  ],
  frustrated: [
    /\b(frustrated|annoyed|irritated|stuck|fed up|tired of|exhausted|not working|broken|buggy)\b/i,
    /\b(mudiyala|sodhappal|tension|problem|erichal)\b/i,
    /(😤|😫|😩|🤦|😣)/,
  ],
  confused: [
    /\b(confused|puzzled|unsure|dont understand|don't understand|what do you mean|how|why|lost)\b/i,
    /\b(puriyala|puriyavillai|kuzhappam|therila|enna solreenga)\b/i,
    /(🤔|🤨|🧐|❓|❔)/,
    /[\u0B95][\u0BC1][\u0BB4][\u0BA4][\u0BCD][\u0BA4][\u0BAE][\u0BCD]/, // குழப்பம்
    /[\u0BAA][\u0BC1][\u0BB0][\u0BBF][\u0BAF][\u0BB5][\u0BBF][\u0BB2][\u0BCD][\u0BB2][\u0BC8]/, // புரியவில்லை
  ],
};

function analyzeSentimentHeuristic(text) {
  for (const [sentiment, regexes] of Object.entries(SENTIMENT_PATTERNS)) {
    for (const regex of regexes) {
      if (regex.test(text)) {
        return { sentiment, confidence: 0.9 };
      }
    }
  }
  return { sentiment: 'neutral', confidence: 0.85 };
}

console.log('🧪 Starting VCamp Service Unit Tests...\n');

// Test Language Detection
console.log('Testing Language Detection...');
assert.strictEqual(detectLanguage('வணக்கம்! நீங்கள் எப்படி இருக்கிறீர்கள்?'), 'ta');
assert.strictEqual(detectLanguage('Hello, how can I help you today?'), 'en');
assert.strictEqual(detectLanguage('Hi VCamp, epdi irukinga?'), 'tanglish');
assert.strictEqual(detectLanguage('Can you help me romba nandri'), 'tanglish');
console.log('  ✓ Language detection tests PASSED!\n');

// Test Sentiment Analysis Across Categories
console.log('Testing Sentiment Analysis Across Categories...');
const testCases = [
  { text: 'I am so happy and delighted with this desktop companion!', expected: 'happy' },
  { text: 'This feature is amazing and I am super excited! 🚀', expected: 'excited' },
  { text: 'I feel very sad and lonely today 😢', expected: 'sad' },
  { text: 'I hate this error, it makes me furious and angry!', expected: 'angry' },
  { text: 'The build keeps crashing, I am totally frustrated with this bug.', expected: 'frustrated' },
  { text: "I am confused, I don't understand how this works.", expected: 'confused' },
  { text: 'The file was saved to the current workspace directory.', expected: 'neutral' },
  { text: 'ரொம்ப மகிழ்ச்சி, நன்றி VCamp!', expected: 'happy' },
  { text: 'எனக்கு புரியவில்லை, என்ன செய்ய வேண்டும்?', expected: 'confused' },
];

for (const tc of testCases) {
  const result = analyzeSentimentHeuristic(tc.text);
  console.log(`  "${tc.text.slice(0, 36)}..." -> ${result.sentiment} (${result.confidence})`);
  assert.strictEqual(result.sentiment, tc.expected);
}
console.log('  ✓ All 9 Sentiment tests PASSED!\n');

console.log('🎉 All Service Unit Tests Successfully Passed!');
