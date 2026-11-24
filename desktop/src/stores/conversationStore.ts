import { create } from 'zustand';
import { SentimentType } from './companionStore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  language?: 'ta' | 'en' | 'tanglish';
  sentiment?: SentimentType;
  sentimentConfidence?: number;
  isStreaming?: boolean;
}

interface ConversationStore {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  messages: [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: 'வணக்கம்! நான் VCamp, உங்கள் 3D AI desktop companion. How can I assist you today?',
      timestamp: Date.now(),
      language: 'ta',
      sentiment: 'happy',
    }
  ],
  isLoading: false,
  error: null,

  addMessage: (msg) => {
    const newMessage: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
      error: null,
    }));
    return newMessage;
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  },

  clearMessages: () => {
    set({
      messages: [
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: 'Conversation cleared. நான் உங்களுக்கு உதவ எப்போதும் தயாராக இருக்கிறேன்! How can I help you?',
          timestamp: Date.now(),
          language: 'ta',
          sentiment: 'neutral',
        }
      ],
      error: null,
    });
  },

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
