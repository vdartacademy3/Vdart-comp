import { ChatMessage } from '../stores/conversationStore';
import { userProfileService } from './userProfileService';

export const GROQ_MODELS = [
  { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B (Recommended - Multilingual Tamil & English)' },
  { id: 'openai/gpt-oss-120b', name: 'OpenAI GPT-OSS 120B (High Reasoning)' },
  { id: 'openai/gpt-oss-20b', name: 'OpenAI GPT-OSS 20B (Fast Reasoning)' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
];

export interface GroqChatOptions {
  apiKey: string;
  model?: string;
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export function detectLanguage(text: string): 'ta' | 'en' | 'tanglish' {
  // Check if Tamil Unicode characters are present
  const tamilRegex = /[\u0B80-\u0BFF]/;
  if (tamilRegex.test(text)) {
    return 'ta';
  }

  // Check common Tanglish phonetics and words
  const tanglishPatterns = [
    /\b(epdi|eppadi|irukinga|irukka|vaanga|ponga|sollunga|solu|pannunga|panna|venum|venam|aama|illa|romba|nalla|theriyum|theriyala|enna|edhu|yaar|enge|engu|kooda|apram|appuram)\b/i,
    /\b(vanakkam|nanri|kudunga|edunga|paaru|kelu|solunga|theriyum)\b/i
  ];

  const hasTanglishWord = tanglishPatterns.some(pattern => pattern.test(text));
  if (hasTanglishWord) {
    return 'tanglish';
  }

  return 'en';
}

export async function sendGroqChatMessage(options: GroqChatOptions): Promise<{
  content: string;
  language: 'ta' | 'en' | 'tanglish';
}> {
  const { apiKey, model = 'qwen/qwen3.8-27b', systemPrompt, messages, temperature = 0.7, maxTokens = 1024 } = options;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Groq API Key is not configured. Please open Settings or click the Key icon to enter your Groq API Key.');
  }

  // Enrich system prompt with active user profile & personal memory
  const personalizedContext = userProfileService.generatePersonalizedContext();
  const fullSystemPrompt = personalizedContext ? `${systemPrompt}\n${personalizedContext}` : systemPrompt;

  // Format messages for Groq API
  const formattedMessages = [
    { role: 'system', content: fullSystemPrompt },
    ...messages.slice(-10).map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }))
  ];

  const callGroq = async (targetModel: string) => {
    return await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: targetModel.trim(),
        messages: formattedMessages,
        temperature,
        max_tokens: maxTokens,
      }),
    });
  };

  try {
    let response = await callGroq(model);

    // If model not found or forbidden, automatically fallback to qwen/qwen3.8-27b
    if (!response.ok && response.status === 404 && model !== 'qwen/qwen3.8-27b') {
      console.warn(`[GroqService] Model ${model} unavailable, falling back to qwen/qwen3.8-27b`);
      response = await callGroq('qwen/qwen3.8-27b');
    }

    if (!response.ok) {
      let errorMessage = `Groq API Error (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // failed to parse json error
      }

      if (response.status === 401) {
        throw new Error('Invalid Groq API Key. Please verify your API key in Settings.');
      } else if (response.status === 429) {
        throw new Error('Groq rate limit exceeded. Please wait a moment before trying again.');
      } else {
        throw new Error(errorMessage);
      }
    }

    const data = await response.json();
    const assistantReply = data.choices?.[0]?.message?.content || 'No response received from Groq.';
    const replyLanguage = detectLanguage(assistantReply);

    return {
      content: assistantReply,
      language: replyLanguage,
    };
  } catch (err: any) {
    console.error('Groq chat error:', err);
    throw err;
  }
}
