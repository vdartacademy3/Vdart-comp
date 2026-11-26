import { ChatMessage } from '../stores/conversationStore';
import { detectLanguage } from './groqService';
import { userProfileService } from './userProfileService';

export type AIProviderId = 'groq' | 'openai_compatible' | 'offline';

export interface AIConfig {
  provider: AIProviderId;
  baseUrl: string;
  model: string;
  apiKey: string;
}

export const AI_PROVIDERS: Array<{
  id: AIProviderId;
  name: string;
  defaultBaseUrl: string;
  models: Array<{ id: string; label: string }>;
}> = [
  {
    id: 'groq',
    name: 'Groq Cloud LPU',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (Recommended)' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Low Latency)' },
      { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B (Multilingual Tamil & English)' },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    ],
  },
  {
    id: 'openai_compatible',
    name: 'OpenAI-Compatible Endpoint (Local/Custom)',
    defaultBaseUrl: 'http://127.0.0.1:11434/v1',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { id: 'llama3.2', label: 'Local Llama 3.2 (Ollama)' },
      { id: 'qwen2.5:7b', label: 'Local Qwen 2.5 7B' },
    ],
  },
  {
    id: 'offline',
    name: 'Offline Local Assistant (No API Required)',
    defaultBaseUrl: '',
    models: [{ id: 'vcamp-local-empathetic', label: 'VCamp Local Context Engine' }],
  },
];

const PROVIDER_KEY = 'vcamp_ai_provider';
const BASE_URL_KEY = 'vcamp_ai_base_url';

export function getSavedAIProvider(): AIProviderId {
  try {
    const val = localStorage.getItem(PROVIDER_KEY) as AIProviderId;
    if (val === 'groq' || val === 'openai_compatible' || val === 'offline') return val;
  } catch {}
  return 'groq';
}

export function saveAIProvider(provider: AIProviderId): void {
  try {
    localStorage.setItem(PROVIDER_KEY, provider);
  } catch {}
}

export function getSavedAIBaseUrl(): string {
  try {
    return localStorage.getItem(BASE_URL_KEY) || 'https://api.groq.com/openai/v1';
  } catch {
    return 'https://api.groq.com/openai/v1';
  }
}

export function saveAIBaseUrl(url: string): void {
  try {
    localStorage.setItem(BASE_URL_KEY, url.trim());
  } catch {}
}

function buildOfflineContextualReply(
  userText: string,
  lang: 'ta' | 'en' | 'tanglish',
  sentiment: string
): string {
  const lower = userText.toLowerCase();
  if (/\b(hi|hello|hey|vanakkam|வணக்கம்)\b/i.test(lower)) {
    if (lang === 'ta') return 'வணக்கம்! இன்று உங்கள் பணிகளில் நான் எப்படி உதவ முடியும்?';
    if (lang === 'tanglish') return 'Vanakkam! Innaiku ungalukku naan epdi help panna mudiyum?';
    return 'Hello! How can I assist you with your tasks today?';
  }
  if (sentiment === 'stressed' || sentiment === 'tired' || /\b(workload|deadline|busy|pressure)\b/i.test(lower)) {
    if (lang === 'ta') return 'பணிச்சுமை அதிகமாக இருந்தால், முதலில் முக்கியமான பணிகளை வரிசைப்படுத்தலாம். சிறிய இடைவெளி எடுத்துக்கொள்ளுங்கள்.';
    if (lang === 'tanglish') return 'Work pressure adhigama irundha oru chinna break edunga. Top priorities-a list panni focus pannalam.';
    return 'It sounds like your workload is heavy right now. Would you like to prioritize your next 1-2 tasks together?';
  }
  if (sentiment === 'frustrated' || sentiment === 'angry' || sentiment === 'confused') {
    return 'I am listening carefully. Share the specific blocker or question, and we can work through it step by step.';
  }
  if (sentiment === 'happy' || sentiment === 'excited' || sentiment === 'motivated') {
    return 'Glad to hear things are going well! Let me know what you would like to tackle next.';
  }
  return 'Got it. I am running in Offline Local mode (configure a Groq or OpenAI-compatible key in Settings for full LLM responses).';
}

export async function generateCompanionReply(options: {
  provider: AIProviderId;
  baseUrl?: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  detectedSentiment: string;
}): Promise<{ content: string; language: 'ta' | 'en' | 'tanglish'; providerUsed: string }> {
  const lastMsg = options.messages[options.messages.length - 1]?.content || '';
  const detectedLang = detectLanguage(lastMsg);

  if (options.provider === 'offline' || (options.provider === 'groq' && !options.apiKey.trim())) {
    return {
      content: buildOfflineContextualReply(lastMsg, detectedLang, options.detectedSentiment),
      language: detectedLang,
      providerUsed: 'offline',
    };
  }

  const personalizedContext = userProfileService.generatePersonalizedContext();
  const safeSystemPrompt = `${options.systemPrompt}\n${personalizedContext}\n\nSafety: Do not propose executing unrestricted OS commands. Keep replies clear and concise.`;

  const formattedMessages = [
    { role: 'system', content: safeSystemPrompt },
    ...options.messages.slice(-10).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ];

  const base =
    options.provider === 'groq'
      ? 'https://api.groq.com/openai/v1'
      : (options.baseUrl || 'http://127.0.0.1:11434/v1').replace(/\/+$/, '');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${options.apiKey.trim()}`;
  }

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: options.model.trim() || 'llama-3.3-70b-versatile',
        messages: formattedMessages,
        temperature: 0.65,
        max_tokens: 512,
      }),
    });

    if (!res.ok) {
      let msg = `AI Provider Error (${res.status})`;
      try {
        const err = await res.json();
        msg = err.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || 'No response received.';
    return {
      content,
      language: detectLanguage(content),
      providerUsed: options.provider,
    };
  } catch (err) {
    // Graceful recovery if network/provider fails transiently
    if (options.provider !== 'groq' || !options.apiKey.trim()) {
      return {
        content: buildOfflineContextualReply(lastMsg, detectedLang, options.detectedSentiment),
        language: detectedLang,
        providerUsed: 'offline_recovery',
      };
    }
    throw err;
  }
}
