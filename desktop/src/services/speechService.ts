import { detectLanguage } from './groqService';
import { useCompanionStore } from '../stores/companionStore';

export type VoiceCategory = 'indian-english' | 'tamil' | 'hindi' | 'english-other' | 'other';

export interface TTSVoiceOption {
  id: string;
  name: string;
  lang: string;
  category: VoiceCategory;
  gender: 'female' | 'male' | 'neutral';
  isIndian: boolean;
  isTamil: boolean;
  isHindi: boolean;
  isDefault: boolean;
  isNeural: boolean;
}

export class TextToSpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;
    this.cachedVoices = this.synth.getVoices();
  }

  public getVoices(): TTSVoiceOption[] {
    if (!this.synth) return [];
    if (this.cachedVoices.length === 0) {
      this.loadVoices();
    }

    return this.cachedVoices.map((v) => {
      const nameLower = v.name.toLowerCase();
      const langLower = v.lang.toLowerCase();

      const isNeural = nameLower.includes('natural') || nameLower.includes('online');
      const isTamil = langLower.startsWith('ta') || nameLower.includes('tamil') || nameLower.includes('valluvar');
      const isHindi = langLower.startsWith('hi') || nameLower.includes('hindi') || nameLower.includes('swara') || nameLower.includes('madhur');
      const isIndianEnglish = (langLower.startsWith('en-in') || langLower === 'en_in') || 
                              nameLower.includes('india') || 
                              nameLower.includes('neerja') || 
                              nameLower.includes('prabhat') ||
                              nameLower.includes('heera');

      let category: VoiceCategory = 'other';
      if (isIndianEnglish) category = 'indian-english';
      else if (isTamil) category = 'tamil';
      else if (isHindi) category = 'hindi';
      else if (langLower.startsWith('en')) category = 'english-other';

      let gender: 'female' | 'male' | 'neutral' = 'neutral';
      if (nameLower.includes('neerja') || nameLower.includes('swara') || nameLower.includes('zira') || nameLower.includes('female') || nameLower.includes('heera')) {
        gender = 'female';
      } else if (nameLower.includes('prabhat') || nameLower.includes('madhur') || nameLower.includes('valluvar') || nameLower.includes('david') || nameLower.includes('male')) {
        gender = 'male';
      }

      return {
        id: v.name,
        name: v.name,
        lang: v.lang,
        category,
        gender,
        isIndian: isIndianEnglish || isTamil || isHindi,
        isTamil,
        isHindi,
        isDefault: v.default,
        isNeural,
      };
    });
  }

  public getIndianVoices(): TTSVoiceOption[] {
    return this.getVoices().filter((v) => v.isIndian);
  }

  public playNotificationChime(): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      // Melodic Two-Tone Chime: 587.33 Hz (D5) -> 880.00 Hz (A5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.09, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.12);
      gain2.gain.setValueAtTime(0.12, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.48);
    } catch {
      // AudioContext fallback
    }
  }

  public previewVoice(voiceName: string, customText?: string): void {
    const voices = this.getVoices();
    const voiceMeta = voices.find((v) => v.name === voiceName);

    let text = customText;
    if (!text) {
      if (voiceMeta?.isTamil) {
        text = 'வணக்கம்! நான் VCamp, உங்கள் AI பணியிட உதவியாளர்.';
      } else if (voiceMeta?.isHindi) {
        text = 'नमस्ते! मैं VCamp हूँ, आपका AI डेस्कटॉप साथी।';
      } else {
        text = 'Hello! I am VCamp, your intelligent AI desktop companion.';
      }
    }

    this.speak(text, { voiceName, rate: 1.0 });
  }

  public speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      voiceName?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    } = {}
  ): void {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this environment.');
      options.onEnd?.();
      return;
    }

    // Stop any ongoing speech and interrupt cleanly
    this.stop();

    if (!text || text.trim() === '') {
      options.onEnd?.();
      return;
    }

    const language = detectLanguage(text);
    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Apply voice rate & pitch (calibrated for human conversational pace)
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    // Choose appropriate voice
    if (this.cachedVoices.length === 0) {
      this.loadVoices();
    }

    let selectedVoice: SpeechSynthesisVoice | undefined;

    // 1. Explicitly selected voice from options or store
    const requestedVoiceName = options.voiceName || useCompanionStore.getState().speechVoice;
    if (requestedVoiceName) {
      selectedVoice = this.cachedVoices.find((v) => v.name === requestedVoiceName);
    }

    // 2. Language-based intelligent routing
    if (!selectedVoice) {
      const isHindi = /[\u0900-\u097F]/.test(text);

      if (language === 'ta') {
        // Look for Tamil voice if installed (e.g. Microsoft Valluvar Online (Natural))
        selectedVoice = this.cachedVoices.find(
          (v) => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil') || v.name.toLowerCase().includes('valluvar')
        );
        utterance.lang = selectedVoice ? 'ta-IN' : 'en-IN';
      } else if (isHindi) {
        // Look for Hindi voice
        selectedVoice = this.cachedVoices.find(
          (v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('madhur')
        );
        utterance.lang = selectedVoice ? 'hi-IN' : 'en-IN';
      } else {
        // English / Tanglish: Prioritize Natural Indian English voices first!
        selectedVoice = 
          // 1. Microsoft Neerja Online (Natural) - English (India)
          this.cachedVoices.find((v) => v.name.includes('Neerja') && v.name.includes('Natural')) ||
          // 2. Microsoft Prabhat Online (Natural) - English (India)
          this.cachedVoices.find((v) => v.name.includes('Prabhat') && v.name.includes('Natural')) ||
          // 3. Any Natural Indian English
          this.cachedVoices.find((v) => (v.lang.startsWith('en-IN') || v.lang === 'en_IN') && (v.name.includes('Natural') || v.name.includes('Online'))) ||
          // 4. Any Indian English
          this.cachedVoices.find((v) => v.lang.startsWith('en-IN') || v.name.toLowerCase().includes('india')) ||
          // 5. High-quality Microsoft Natural English
          this.cachedVoices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Online'))) ||
          // 6. Installed Windows desktop voices (Zira / David)
          this.cachedVoices.find((v) => v.name.includes('Zira') || v.name.includes('David')) ||
          // 7. Any English voice
          this.cachedVoices.find((v) => v.lang.startsWith('en'));

        utterance.lang = selectedVoice?.lang || 'en-IN';
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      useCompanionStore.getState().setIsSpeaking(true);
      options.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      useCompanionStore.getState().setIsSpeaking(false);
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      this.currentUtterance = null;
      useCompanionStore.getState().setIsSpeaking(false);
      options.onError?.(e);
      options.onEnd?.();
    };

    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      useCompanionStore.getState().setIsSpeaking(false);
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

export const speechService = new TextToSpeechService();
