import { questionBankService, QuestionItem, MOOD_TO_CATEGORIES } from './questionBankService';
import { userProfileService } from './userProfileService';
import { useCompanionStore, SentimentType, RobotEmotion } from '../stores/companionStore';
import { analyzeSentimentLocal } from './sentimentService';
import { sendGroqChatMessage } from './groqService';
import { speechService } from './speechService';
import { moodTimelineService } from './moodTimelineService';

export interface QuestionEngineConfig {
  intervalSeconds: number;       // e.g. 120 (Testing: 2 minutes)
  isAutoEnabled: boolean;         // Master toggle for automatic periodic questions
  isPaused: boolean;              // Pause / Resume toggle
  dailyLimit: number;             // Maximum questions per day (relaxed for testing)
  quietHoursEnabled: boolean;     // Enable quiet hours
  quietHoursStart: string;        // "22:00"
  quietHoursEnd: string;          // "08:00"
  isTestingMode: boolean;         // True: 2-minute testing mode active
}

const CONFIG_KEY = 'vcamp_question_engine_config_v2';
const DAILY_TRACK_KEY = 'vcamp_daily_question_count_v2';

class QuestionEngineService {
  private currentQuestion: QuestionItem | null = null;
  private assistantFollowUp: string | null = null;
  private isThinking: boolean = false;
  private config: QuestionEngineConfig = {
    intervalSeconds: 120, // Default 120 seconds (2 minutes for testing)
    isAutoEnabled: true,
    isPaused: false,
    dailyLimit: 80,
    quietHoursEnabled: false, // Disabled by default in testing mode so questions fire immediately
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    isTestingMode: true,
  };
  private lastAskedTimestamp: number = Date.now();
  private timerId: NodeJS.Timeout | null = null;
  private listeners: ((state: {
    question: QuestionItem | null;
    followUp: string | null;
    isThinking: boolean;
    isPaused: boolean;
    isAutoEnabled: boolean;
    intervalSeconds: number;
    secondsUntilNext: number;
  }) => void)[] = [];

  constructor() {
    this.loadConfig();
    this.lastAskedTimestamp = Date.now();
    this.startScheduler();
  }

  private loadConfig() {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.config = { ...this.config, ...parsed };
      }
    } catch {}
  }

  public saveConfig(updates: Partial<QuestionEngineConfig>) {
    this.config = { ...this.config, ...updates };
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch {}
    this.notify();
  }

  public getConfig(): QuestionEngineConfig {
    return { ...this.config };
  }

  public getSecondsUntilNext(): number {
    if (!this.config.isAutoEnabled || this.config.isPaused) return -1;
    const elapsed = Math.floor((Date.now() - this.lastAskedTimestamp) / 1000);
    return Math.max(0, this.config.intervalSeconds - elapsed);
  }

  public subscribe(cb: (state: {
    question: QuestionItem | null;
    followUp: string | null;
    isThinking: boolean;
    isPaused: boolean;
    isAutoEnabled: boolean;
    intervalSeconds: number;
    secondsUntilNext: number;
  }) => void): () => void {
    this.listeners.push(cb);
    cb({
      question: this.currentQuestion,
      followUp: this.assistantFollowUp,
      isThinking: this.isThinking,
      isPaused: this.config.isPaused,
      isAutoEnabled: this.config.isAutoEnabled,
      intervalSeconds: this.config.intervalSeconds,
      secondsUntilNext: this.getSecondsUntilNext(),
    });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const s = {
      question: this.currentQuestion,
      followUp: this.assistantFollowUp,
      isThinking: this.isThinking,
      isPaused: this.config.isPaused,
      isAutoEnabled: this.config.isAutoEnabled,
      intervalSeconds: this.config.intervalSeconds,
      secondsUntilNext: this.getSecondsUntilNext(),
    };
    this.listeners.forEach((cb) => cb(s));
  }

  public getActiveQuestion(): QuestionItem | null {
    return this.currentQuestion;
  }

  public getFollowUp(): string | null {
    return this.assistantFollowUp;
  }

  public isBusyThinking(): boolean {
    return this.isThinking;
  }

  private isQuietHours(): boolean {
    if (!this.config.quietHoursEnabled) return false;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = this.config.quietHoursStart.split(':').map((v) => parseInt(v, 10));
    const [endH, endM] = this.config.quietHoursEnd.split(':').map((v) => parseInt(v, 10));

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal <= endTotal) {
      return currentMins >= startTotal && currentMins < endTotal;
    } else {
      return currentMins >= startTotal || currentMins < endTotal;
    }
  }

  private getTodayQuestionCount(): number {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const raw = localStorage.getItem(DAILY_TRACK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === todayStr) {
          return parsed.count || 0;
        }
      }
    } catch {}
    return 0;
  }

  private incrementDailyCount() {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const count = this.getTodayQuestionCount() + 1;
      localStorage.setItem(DAILY_TRACK_KEY, JSON.stringify({ date: todayStr, count }));
    } catch {}
  }

  /**
   * Intelligently selects a validated, unasked question matching user mood and context.
   */
  public selectBestQuestion(): QuestionItem | null {
    const activeProfile = userProfileService.getActiveProfile();
    const askedIds = new Set(activeProfile.questionHistory.map((h) => h.questionId));
    const currentMood = useCompanionStore.getState().sentiment || 'neutral';

    const preferredCats = MOOD_TO_CATEGORIES[currentMood] || [];
    const allValidated = questionBankService.getAllQuestions().filter((q) => q.isActive && !askedIds.has(q.id));

    if (allValidated.length === 0) {
      // If user has answered all questions, fallback to any active question
      const fallback = questionBankService.getAllQuestions().filter((q) => q.isActive);
      return fallback[Math.floor(Math.random() * fallback.length)] || null;
    }

    // Try finding questions in preferred categories for mood
    const moodMatched = allValidated.filter((q) => preferredCats.includes(q.category));
    if (moodMatched.length > 0) {
      return moodMatched[Math.floor(Math.random() * moodMatched.length)];
    }

    // Otherwise random from unasked validated questions
    return allValidated[Math.floor(Math.random() * allValidated.length)];
  }

  /**
   * Triggers a question check-in directly beside the desktop robot.
   */
  public triggerQuestion(force: boolean = false): boolean {
    // Prevent overlapping question popups if one is already open or thinking
    if (this.currentQuestion !== null || this.isThinking) {
      return false;
    }

    if (!force) {
      if (!this.config.isAutoEnabled) return false;
      if (this.config.isPaused) return false;
      if (this.isQuietHours()) return false;
      if (this.getTodayQuestionCount() >= this.config.dailyLimit) return false;

      // Check if user is currently chatting or speaking
      const companionState = useCompanionStore.getState();
      if (companionState.isChatOpen || companionState.isRecording || companionState.isSpeaking) {
        // Postpone next trigger by 30 seconds
        this.lastAskedTimestamp = Date.now() - (this.config.intervalSeconds * 1000) + 30000;
        return false;
      }
    }

    const q = this.selectBestQuestion();
    if (!q) return false;

    this.currentQuestion = q;
    this.assistantFollowUp = null;
    this.isThinking = false;
    this.lastAskedTimestamp = Date.now();
    this.incrementDailyCount();

    // 1. Robot attention / greeting animation before asking
    const store = useCompanionStore.getState();
    if (store.isSleeping) {
      store.setIsSleeping(false);
    }
    store.setEmotion('curious', 3500);
    store.triggerAction('greet', 2500);

    // 2. Announce question via TTS if enabled and not forced silent
    if (store.autoSpeak && !this.isQuietHours()) {
      speechService.speak(q.text, {
        rate: store.speechRate,
        pitch: store.speechPitch,
        voiceName: store.speechVoice,
      });
    }

    this.notify();
    return true;
  }

  /**
   * Submits the user's answer (option selection or freeform text).
   * Generates a dynamic Groq response and saves everything in backend storage silently.
   */
  public async submitAnswer(answerText: string, optionKey?: string) {
    if (!this.currentQuestion) return;

    const qId = this.currentQuestion.id;
    const qCategory = this.currentQuestion.category;
    const qText = this.currentQuestion.text;

    this.isThinking = true;
    useCompanionStore.getState().setEmotion('thinking');
    this.notify();

    // 1. Silently record question answer in UserProfile backend
    userProfileService.recordQuestionAction(qId, 'answered', optionKey, answerText);

    // 2. Analyze sentiment of user response
    const sentimentRes = analyzeSentimentLocal(answerText);
    moodTimelineService.recordMood(sentimentRes.sentiment, sentimentRes.confidence, `Question Check-in: ${answerText}`);
    useCompanionStore.getState().setSentiment(sentimentRes.sentiment, sentimentRes.confidence);

    // 3. Procedural robot reaction to user answer
    const store = useCompanionStore.getState();
    const emotionMap: Record<SentimentType, RobotEmotion> = {
      happy: 'happy',
      excited: 'excited',
      motivated: 'proud',
      stressed: 'empathetic',
      confused: 'curious',
      tired: 'gentle',
      sad: 'empathetic',
      frustrated: 'calm',
      angry: 'calm',
      neutral: 'attentive',
      anxious: 'concerned',
      calm: 'calm',
      disappointed: 'gentle',
      curious: 'curious',
      mixed: 'attentive',
      ambiguous: 'attentive',
      insufficient_evidence: 'neutral',
    };
    store.setEmotion(emotionMap[sentimentRes.sentiment] || 'attentive', 4000);

    if (sentimentRes.sentiment === 'happy' || sentimentRes.sentiment === 'excited') {
      store.triggerAction('play', 3500);
    } else if (sentimentRes.sentiment === 'motivated') {
      store.triggerAction('greet', 2500);
    } else if (sentimentRes.sentiment === 'tired' || sentimentRes.sentiment === 'sad') {
      store.triggerAction('listen', 3000);
    } else {
      store.triggerAction('speak', 3000);
    }

    // 4. Generate empathetic, conversational follow-up via Groq AI
    try {
      const apiKey = store.groqApiKey;
      const model = store.groqModel || 'qwen/qwen3.8-27b';
      const userLang = userProfileService.getActiveProfile().preferredLanguage;

      const followUpPrompt = `You are VCamp, a warm, supportive, intelligent AI desktop companion.
The user just answered a workplace check-in question.
Question: "${qText}" (Category: ${qCategory})
User's Answer: "${answerText}"
Preferred Language: ${userLang} (Respond naturally in Tamil, English, or Tanglish matching user tone).

Provide a brief, genuine, conversational 1-2 sentence empathetic reply acknowledging their response. If appropriate, offer a short encouraging note or thoughtful reflection. Do not repeat the question word for word.`;

      let reply = '';
      if (apiKey) {
        const groqRes = await sendGroqChatMessage({
          apiKey,
          model,
          systemPrompt: followUpPrompt,
          messages: [{ id: 'ans_1', role: 'user', content: answerText, timestamp: Date.now() }],
        });
        reply = groqRes.content;
      } else {
        reply = `Thank you for sharing! I've noted that for your daily wellbeing pacing. Take care!`;
      }

      this.assistantFollowUp = reply;
      this.isThinking = false;
      this.notify();

      // Speak follow-up aloud if auto-speak is enabled
      if (store.autoSpeak && !this.isQuietHours()) {
        speechService.speak(reply, {
          rate: store.speechRate,
          pitch: store.speechPitch,
          voiceName: store.speechVoice,
        });
      }

      // Automatically dismiss speech bubble after 7 seconds
      setTimeout(() => {
        this.dismiss();
      }, 7000);
    } catch (err) {
      console.error('[QuestionEngine] Groq follow-up error:', err);
      this.assistantFollowUp = `Thank you for sharing your thoughts! I'm here to support your workday.`;
      this.isThinking = false;
      this.notify();
      setTimeout(() => this.dismiss(), 5000);
    }
  }

  public skip() {
    if (this.currentQuestion) {
      userProfileService.recordQuestionAction(this.currentQuestion.id, 'skipped');
    }
    this.dismiss();
  }

  public snooze(minutes: number = 2) {
    if (this.currentQuestion) {
      userProfileService.recordQuestionAction(this.currentQuestion.id, 'postponed');
    }
    this.dismiss();
    // Postpone next trigger by specified minutes (default 2m during testing)
    this.lastAskedTimestamp = Date.now() - (this.config.intervalSeconds * 1000) + (minutes * 60 * 1000);
    this.notify();
  }

  public dismiss() {
    this.currentQuestion = null;
    this.assistantFollowUp = null;
    this.isThinking = false;
    useCompanionStore.getState().setEmotion('neutral');
    this.notify();
  }

  public togglePause(): boolean {
    this.config.isPaused = !this.config.isPaused;
    this.saveConfig({ isPaused: this.config.isPaused });
    return this.config.isPaused;
  }

  public toggleAutoEnabled(): boolean {
    this.config.isAutoEnabled = !this.config.isAutoEnabled;
    this.saveConfig({ isAutoEnabled: this.config.isAutoEnabled });
    return this.config.isAutoEnabled;
  }

  public setIntervalSeconds(seconds: number) {
    this.saveConfig({ intervalSeconds: seconds });
  }

  private startScheduler() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    // Single master background scheduler loop checking every 2 seconds
    this.timerId = setInterval(() => {
      if (!this.config.isAutoEnabled || this.config.isPaused) return;

      // Do not overlap if a question popup or follow-up is already active
      if (this.currentQuestion !== null || this.isThinking || this.assistantFollowUp !== null) {
        return;
      }

      // Check elapsed time against intervalSeconds (120 seconds default for testing)
      const elapsedSeconds = (Date.now() - this.lastAskedTimestamp) / 1000;
      if (elapsedSeconds >= this.config.intervalSeconds) {
        this.triggerQuestion(false);
      }
    }, 2000);
  }
}

export const questionEngineService = new QuestionEngineService();
