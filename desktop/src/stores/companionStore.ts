import { create } from 'zustand';
import {
  DEFAULT_CHARACTER_ID,
  DEFAULT_CHARACTER_SETTINGS,
  getCharacterById,
} from '../characters/characterRegistry';
import { mapLegacyActionToCanonical } from '../characters/animationMapping';
import { AnimationClipDescriptor, CharacterSettings } from '../characters/types';
import { animationController } from '../services/animationController';
import { localDataService } from '../services/localDataService';

export type CompanionAction =
  | 'idle'
  | 'walk'
  | 'run'
  | 'play'
  | 'sleep'
  | 'greet'
  | 'listen'
  | 'think'
  | 'speak'
  | 'dance'
  | 'jump'
  | 'knockdown'
  | 'laugh'
  | 'laugh_hard'
  | 'punch'
  | 'push'
  | 'talk'
  | 'talk_gesture'
  | 'wave';

export type CompanionState = 
  | CompanionAction
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'hover' 
  | 'happy' 
  | 'empathetic' 
  | 'confused';

export type CentralRobotState = 
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'HAPPY'
  | 'SAD'
  | 'EMPATHETIC'
  | 'CURIOUS'
  | 'CONFUSED'
  | 'EXCITED'
  | 'SLEEPING'
  | 'WALKING'
  | 'RUNNING'
  | 'PLAYING'
  | 'REMINDER'
  | 'HIDDEN';

export type RobotSize = 'small' | 'medium' | 'large';

export type SentimentType = 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'frustrated' 
  | 'confused' 
  | 'excited'
  | 'stressed'
  | 'motivated'
  | 'tired'
  | 'anxious'
  | 'calm'
  | 'disappointed'
  | 'curious'
  | 'mixed'
  | 'ambiguous'
  | 'insufficient_evidence';

export type RobotEmotion = 
  // Positive emotions
  | 'happy' 
  | 'excited' 
  | 'cheerful' 
  | 'proud' 
  | 'curious' 
  | 'playful' 
  | 'grateful' 
  | 'encouraging'
  // Supportive emotions
  | 'empathetic' 
  | 'concerned' 
  | 'calm' 
  | 'gentle' 
  | 'reassuring' 
  | 'attentive'
  // Neutral and thinking states
  | 'neutral' 
  | 'thinking' 
  | 'listening' 
  | 'confused' 
  | 'surprised' 
  | 'focused'
  // Low-energy states
  | 'sleepy' 
  | 'tired' 
  | 'resting' 
  | 'relaxed'
  // Negative conversational states
  | 'frustrated' 
  | 'disappointed' 
  | 'sad'
  | 'anxious'
  | 'stressed'
  | 'ambiguous';

export type LanguageCode = 'auto' | 'ta' | 'en' | 'tanglish';

interface CompanionStore {
  state: CompanionState;
  centralState: CentralRobotState;
  robotSize: RobotSize;
  sentiment: SentimentType;
  sentimentConfidence: number;
  currentEmotion: RobotEmotion;
  isChatOpen: boolean;
  isDashboardOpen: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  hasCustomModel: boolean;
  hasModelLoaded: boolean;
  modelError: string | null;
  activeLanguage: LanguageCode;
  groqApiKey: string;
  groqModel: string;
  systemPrompt: string;
  autoSpeak: boolean;
  speechRate: number;
  speechPitch: number;
  speechVoice: string;
  lastPosition: { x: number; y: number };
  currentAction: CompanionAction;
  isSleeping: boolean;
  previousCentralState: CentralRobotState;
  robotZ: number; // 3D depth in Three.js scene (-2.0 to +1.0)
  jumpState: { isJumping: boolean; progress: number };
  movementDirection: number; // 1 = right, -1 = left
  isHovering: boolean;

  // Multi-Character Registry & Studio State
  activeDashboardTab: string;
  selectedCharacterId: string;
  defaultCharacterId: string;
  characterSettings: Record<string, CharacterSettings>;
  characterDescriptors: AnimationClipDescriptor[];
  characterLoadStatus: 'idle' | 'loading' | 'ready' | 'error';
  characterLoadError: string | null;

  setActiveDashboardTab: (tab: string) => void;
  openCharacterStudio: () => void;

  setState: (state: CompanionState) => void;
  setCentralState: (state: CentralRobotState) => void;
  setRobotSize: (size: RobotSize) => void;
  triggerAction: (action: CompanionAction, durationMs?: number) => void;
  setEmotion: (emotion: RobotEmotion, durationMs?: number) => void;
  setIsSleeping: (sleeping: boolean) => void;
  setSentiment: (sentiment: SentimentType, confidence?: number) => void;
  setRobotZ: (z: number) => void;
  setJumpState: (jump: { isJumping: boolean; progress: number }) => void;
  setMovementDirection: (dir: number) => void;
  setIsHovering: (hover: boolean) => void;
  setIsChatOpen: (isOpen: boolean) => void;
  setIsDashboardOpen: (isOpen: boolean) => void;
  setIsRecording: (isRecording: boolean) => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
  setHasCustomModel: (hasCustom: boolean) => void;
  setHasModelLoaded: (loaded: boolean) => void;
  setModelError: (err: string | null) => void;
  setActiveLanguage: (lang: LanguageCode) => void;
  setGroqApiKey: (key: string) => void;
  setGroqModel: (model: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setAutoSpeak: (auto: boolean) => void;
  setSpeechRate: (rate: number) => void;
  setSpeechPitch: (pitch: number) => void;
  setSpeechVoice: (voice: string) => void;
  setLastPosition: (pos: { x: number; y: number }) => void;
  setSelectedCharacterId: (id: string) => void;
  setDefaultCharacterId: (id: string) => void;
  updateCharacterSettings: (id: string, patch: Partial<CharacterSettings>) => void;
  resetCharacterSettings: (id: string) => void;
  setCharacterDescriptors: (descriptors: AnimationClipDescriptor[]) => void;
  setCharacterLoadStatus: (status: 'idle' | 'loading' | 'ready' | 'error', error?: string | null) => void;
  hydrateDesktopPersistence: () => Promise<void>;
}

const DEFAULT_SYSTEM_PROMPT = `You are VCamp, a friendly, ultra-intelligent 3D personal AI desktop companion for Windows.
You have a gender-neutral robotic body with glossy white & dark metallic armor, a glowing cyan V logo on your forehead, and an expressive digital face.

Language Guidelines:
1. You natively understand and communicate fluently in Tamil (தமிழ்), English, and Tanglish (Tamil written in Latin script).
2. Always detect the user's language automatically:
   - If the user writes in Tamil script, reply warmly in natural, polite Tamil script.
   - If the user writes in English, reply in clean, concise, helpful English.
   - If the user writes in Tanglish (e.g., "epdi irukinga", "oru help venum"), reply in natural friendly Tanglish or Tamil as appropriate.
   - If the user mixes Tamil and English, respond in the same comfortable mixed style.
3. Keep responses conversational, concise, and helpful for a desktop companion.
4. Your tone is supportive, intelligent, polite, and energetic.`;

const DEFAULT_GROQ_API_KEY = ((import.meta as any).env?.VITE_GROQ_API_KEY as string) || '';
const DEFAULT_GROQ_MODEL = ((import.meta as any).env?.VITE_GROQ_MODEL as string) || 'qwen/qwen3.8-27b';

const CHAR_SELECTED_KEY = 'vcamp_selected_character';
const CHAR_DEFAULT_KEY = 'vcamp_default_character';
const CHAR_SETTINGS_KEY = 'vcamp_character_settings';

function loadSavedCharacterId(key: string, fallback: string): string {
  try {
    const val = localStorage.getItem(key);
    if (val) return getCharacterById(val).id;
  } catch {}
  return fallback;
}

function loadSavedCharacterSettings(): Record<string, CharacterSettings> {
  try {
    const raw = localStorage.getItem(CHAR_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

const initialDefaultCharId = loadSavedCharacterId(CHAR_DEFAULT_KEY, DEFAULT_CHARACTER_ID);
const initialSelectedCharId = loadSavedCharacterId(CHAR_SELECTED_KEY, initialDefaultCharId);
const initialCharSettings = loadSavedCharacterSettings();

if (initialCharSettings[initialSelectedCharId]?.animationSpeed) {
  animationController.setPlaybackSpeed(initialCharSettings[initialSelectedCharId].animationSpeed);
}

export const useCompanionStore = create<CompanionStore>((set, get) => ({
  state: 'idle',
  centralState: 'IDLE',
  previousCentralState: 'IDLE',
  robotSize: (localStorage.getItem('vcamp_robot_size') as RobotSize) || 'medium',
  sentiment: 'neutral',
  sentimentConfidence: 0.9,
  currentEmotion: 'neutral',
  isChatOpen: false,
  isDashboardOpen: false,
  isRecording: false,
  isSpeaking: false,
  hasCustomModel: initialSelectedCharId !== 'vcamp_robot',
  hasModelLoaded: initialSelectedCharId === 'vcamp_robot',
  modelError: null,
  activeLanguage: 'auto',
  groqApiKey: localStorage.getItem('vcamp_groq_api_key') || DEFAULT_GROQ_API_KEY,
  groqModel: localStorage.getItem('vcamp_groq_model') || DEFAULT_GROQ_MODEL,
  systemPrompt: localStorage.getItem('vcamp_system_prompt') || DEFAULT_SYSTEM_PROMPT,
  autoSpeak: localStorage.getItem('vcamp_auto_speak') !== 'false',
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVoice: localStorage.getItem('vcamp_speech_voice') || '',
  lastPosition: { x: 50, y: 50 },
  currentAction: 'idle',
  isSleeping: false,
  robotZ: parseFloat(localStorage.getItem('vcamp_robot_z') || '0.0'),
  jumpState: { isJumping: false, progress: 0 },
  movementDirection: 1,
  isHovering: false,
  activeDashboardTab: 'overview',
  selectedCharacterId: initialSelectedCharId,
  defaultCharacterId: initialDefaultCharId,
  characterSettings: initialCharSettings,
  characterDescriptors: [],
  characterLoadStatus: initialSelectedCharId === 'vcamp_robot' ? 'ready' : 'idle',
  characterLoadError: null,

  setState: (state) => {
    set({ state });
    if (state === 'idle') {
      animationController.onAIProcessingEnd();
    } else if (state === 'thinking') {
      animationController.onAIProcessingStart();
    } else if (state === 'listening') {
      animationController.onMicStart();
    }
  },
  setRobotZ: (z) => {
    const clamped = Math.max(-2.0, Math.min(1.0, z));
    try {
      localStorage.setItem('vcamp_robot_z', clamped.toString());
    } catch {}
    set({ robotZ: clamped });
  },
  setJumpState: (jump) => set({ jumpState: jump }),
  setMovementDirection: (dir) => set({ movementDirection: dir >= 0 ? 1 : -1 }),
  setIsHovering: (hover) => set({ isHovering: hover }),

  setCentralState: (newState) => {
    const prev = get().centralState;
    set({ 
      centralState: newState,
      previousCentralState: prev !== newState ? prev : get().previousCentralState
    });

    // Map central state to companion state/action/emotion
    switch (newState) {
      case 'IDLE':
        set({ state: 'idle', currentAction: 'idle', isSleeping: false });
        break;
      case 'LISTENING':
        set({ state: 'listening', isRecording: true, currentEmotion: 'listening' });
        break;
      case 'THINKING':
        set({ state: 'thinking', currentAction: 'think', currentEmotion: 'thinking' });
        break;
      case 'SPEAKING':
        set({ state: 'speaking', currentAction: 'speak', isSpeaking: true });
        break;
      case 'HAPPY':
      case 'EXCITED':
        set({ currentEmotion: 'happy' });
        break;
      case 'SAD':
        set({ currentEmotion: 'sad' });
        break;
      case 'EMPATHETIC':
        set({ currentEmotion: 'empathetic' });
        break;
      case 'CURIOUS':
        set({ currentEmotion: 'curious' });
        break;
      case 'CONFUSED':
        set({ currentEmotion: 'confused' });
        break;
      case 'SLEEPING':
        set({ isSleeping: true, state: 'sleep', currentAction: 'sleep', currentEmotion: 'sleepy' });
        break;
      case 'WALKING':
        set({ state: 'walk', currentAction: 'walk' });
        break;
      case 'RUNNING':
        set({ state: 'run', currentAction: 'run' });
        break;
      case 'PLAYING':
        set({ state: 'play', currentAction: 'play' });
        break;
      case 'REMINDER':
        set({ currentEmotion: 'attentive' });
        break;
      case 'HIDDEN':
        break;
    }
  },

  setRobotSize: (size) => {
    localStorage.setItem('vcamp_robot_size', size);
    set({ robotSize: size });
  },

  triggerAction: (action, durationMs) => {
    if (action === 'sleep') {
      animationController.returnToIdle('system');
      set({ 
        currentAction: 'sleep', 
        state: 'sleep', 
        isSleeping: true, 
        currentEmotion: 'sleepy',
        centralState: 'SLEEPING'
      });
      return;
    }
    const mapped = mapLegacyActionToCanonical(action);
    animationController.trigger(mapped, { source: 'system' });
    set({ currentAction: action, state: action as CompanionState, isSleeping: false });
    if (durationMs && durationMs > 0) {
      setTimeout(() => {
        const stateNow = useCompanionStore.getState().currentAction;
        if (stateNow === action) {
          animationController.returnToIdle('system');
          set({ currentAction: 'idle', state: 'idle', centralState: 'IDLE' });
        }
      }, durationMs);
    }
  },

  setEmotion: (emotion, durationMs) => {
    set({ currentEmotion: emotion });
    if (durationMs && durationMs > 0) {
      setTimeout(() => {
        const now = useCompanionStore.getState().currentEmotion;
        if (now === emotion) {
          set({ currentEmotion: 'neutral' });
        }
      }, durationMs);
    }
  },

  setIsSleeping: (isSleeping) => set({ 
    isSleeping, 
    currentAction: isSleeping ? 'sleep' : 'idle',
    state: isSleeping ? 'sleep' : 'idle',
    centralState: isSleeping ? 'SLEEPING' : 'IDLE',
    currentEmotion: isSleeping ? 'sleepy' : 'neutral'
  }),

  setSentiment: (sentiment, confidence = 0.85) => {
    const sentimentEmotionMap: Record<SentimentType, RobotEmotion> = {
      happy: 'happy',
      excited: 'excited',
      motivated: 'proud',
      stressed: 'concerned',
      confused: 'confused',
      tired: 'tired',
      sad: 'gentle',
      frustrated: 'reassuring',
      angry: 'calm',
      anxious: 'empathetic',
      calm: 'calm',
      disappointed: 'disappointed',
      curious: 'curious',
      mixed: 'neutral',
      ambiguous: 'neutral',
      insufficient_evidence: 'neutral',
      neutral: 'neutral',
    };
    const mappedEmotion = sentimentEmotionMap[sentiment] || 'neutral';
    set({ sentiment, sentimentConfidence: confidence, currentEmotion: mappedEmotion });
  },

  setIsChatOpen: (isChatOpen) => set({ isChatOpen }),
  setIsDashboardOpen: (isDashboardOpen) => set({ isDashboardOpen }),
  setIsRecording: (isRecording) => {
    if (isRecording) {
      animationController.onMicStart();
    } else {
      animationController.onMicStop();
    }
    set({ 
      isRecording,
      centralState: isRecording ? 'LISTENING' : (get().centralState === 'LISTENING' ? 'IDLE' : get().centralState),
      currentEmotion: isRecording ? 'listening' : 'neutral'
    });
  },
  setIsSpeaking: (isSpeaking) => {
    const prev = get().isSpeaking;
    if (isSpeaking && !prev) {
      animationController.onTTSStart();
    } else if (!isSpeaking && prev) {
      animationController.onTTSEnd();
    }
    set({ 
      isSpeaking,
      centralState: isSpeaking ? 'SPEAKING' : (get().centralState === 'SPEAKING' ? 'IDLE' : get().centralState),
      currentAction: isSpeaking ? 'speak' : (get().currentAction === 'speak' ? 'idle' : get().currentAction)
    });
  },
  setHasCustomModel: (hasCustomModel) => set({ hasCustomModel }),
  setHasModelLoaded: (hasModelLoaded) => set({ hasModelLoaded }),
  setModelError: (modelError) => set({ modelError }),
  setActiveLanguage: (activeLanguage) => set({ activeLanguage }),
  setGroqApiKey: (groqApiKey) => {
    localStorage.setItem('vcamp_groq_api_key', groqApiKey);
    void localDataService.saveItem('vcamp_ai_config', {
      groqApiKey,
      groqModel: get().groqModel,
      systemPrompt: get().systemPrompt,
      autoSpeak: get().autoSpeak,
      speechVoice: get().speechVoice,
    });
    set({ groqApiKey });
  },
  setGroqModel: (groqModel) => {
    localStorage.setItem('vcamp_groq_model', groqModel);
    void localDataService.saveItem('vcamp_ai_config', {
      groqApiKey: get().groqApiKey,
      groqModel,
      systemPrompt: get().systemPrompt,
      autoSpeak: get().autoSpeak,
      speechVoice: get().speechVoice,
    });
    set({ groqModel });
  },
  setSystemPrompt: (systemPrompt) => {
    localStorage.setItem('vcamp_system_prompt', systemPrompt);
    void localDataService.saveItem('vcamp_ai_config', {
      groqApiKey: get().groqApiKey,
      groqModel: get().groqModel,
      systemPrompt,
      autoSpeak: get().autoSpeak,
      speechVoice: get().speechVoice,
    });
    set({ systemPrompt });
  },
  setAutoSpeak: (autoSpeak) => {
    localStorage.setItem('vcamp_auto_speak', String(autoSpeak));
    void localDataService.saveItem('vcamp_ai_config', {
      groqApiKey: get().groqApiKey,
      groqModel: get().groqModel,
      systemPrompt: get().systemPrompt,
      autoSpeak,
      speechVoice: get().speechVoice,
    });
    set({ autoSpeak });
  },
  setSpeechRate: (speechRate) => set({ speechRate }),
  setSpeechPitch: (speechPitch) => set({ speechPitch }),
  setSpeechVoice: (speechVoice) => {
    localStorage.setItem('vcamp_speech_voice', speechVoice);
    void localDataService.saveItem('vcamp_ai_config', {
      groqApiKey: get().groqApiKey,
      groqModel: get().groqModel,
      systemPrompt: get().systemPrompt,
      autoSpeak: get().autoSpeak,
      speechVoice,
    });
    set({ speechVoice });
  },
  setLastPosition: (lastPosition) => set({ lastPosition }),
  setActiveDashboardTab: (activeDashboardTab) => set({ activeDashboardTab }),
  openCharacterStudio: () => set({ isDashboardOpen: true, activeDashboardTab: 'character_studio' }),
  setSelectedCharacterId: (id) => {
    const resolved = getCharacterById(id).id;
    try {
      localStorage.setItem(CHAR_SELECTED_KEY, resolved);
    } catch {}
    void localDataService.saveItem('vcamp_character_prefs', {
      selectedCharacterId: resolved,
      defaultCharacterId: get().defaultCharacterId,
      characterSettings: get().characterSettings,
    });
    const charSpeed = get().characterSettings[resolved]?.animationSpeed ?? DEFAULT_CHARACTER_SETTINGS.animationSpeed;
    animationController.reset('system');
    animationController.setPlaybackSpeed(charSpeed);
    set({
      selectedCharacterId: resolved,
      hasCustomModel: resolved !== 'vcamp_robot',
      hasModelLoaded: resolved === 'vcamp_robot',
      modelError: null,
      characterLoadStatus: resolved === 'vcamp_robot' ? 'ready' : 'loading',
      characterLoadError: null,
    });
  },
  setDefaultCharacterId: (id) => {
    const resolved = getCharacterById(id).id;
    try {
      localStorage.setItem(CHAR_DEFAULT_KEY, resolved);
    } catch {}
    void localDataService.saveItem('vcamp_character_prefs', {
      selectedCharacterId: get().selectedCharacterId,
      defaultCharacterId: resolved,
      characterSettings: get().characterSettings,
    });
    set({ defaultCharacterId: resolved });
  },
  updateCharacterSettings: (id, patch) => {
    const current = get().characterSettings[id] || { ...DEFAULT_CHARACTER_SETTINGS };
    const updated: CharacterSettings = { ...current, ...patch };
    const nextMap = { ...get().characterSettings, [id]: updated };
    try {
      localStorage.setItem(CHAR_SETTINGS_KEY, JSON.stringify(nextMap));
    } catch {}
    void localDataService.saveItem('vcamp_character_prefs', {
      selectedCharacterId: get().selectedCharacterId,
      defaultCharacterId: get().defaultCharacterId,
      characterSettings: nextMap,
    });
    if (id === get().selectedCharacterId && typeof patch.animationSpeed === 'number') {
      animationController.setPlaybackSpeed(patch.animationSpeed);
    }
    set({ characterSettings: nextMap });
  },
  resetCharacterSettings: (id) => {
    const nextMap = { ...get().characterSettings, [id]: { ...DEFAULT_CHARACTER_SETTINGS } };
    try {
      localStorage.setItem(CHAR_SETTINGS_KEY, JSON.stringify(nextMap));
    } catch {}
    void localDataService.saveItem('vcamp_character_prefs', {
      selectedCharacterId: get().selectedCharacterId,
      defaultCharacterId: get().defaultCharacterId,
      characterSettings: nextMap,
    });
    if (id === get().selectedCharacterId) {
      animationController.reset('studio');
    }
    set({ characterSettings: nextMap });
  },
  setCharacterDescriptors: (characterDescriptors) => {
    animationController.setDescriptors(characterDescriptors);
    set({ characterDescriptors });
  },
  setCharacterLoadStatus: (characterLoadStatus, characterLoadError = null) =>
    set({
      characterLoadStatus,
      characterLoadError,
      hasModelLoaded: characterLoadStatus === 'ready',
      modelError: characterLoadError,
    }),
  hydrateDesktopPersistence: async () => {
    const aiCfg = await localDataService.loadItem<{
      groqApiKey?: string;
      groqModel?: string;
      systemPrompt?: string;
      autoSpeak?: boolean;
      speechVoice?: string;
    } | null>('vcamp_ai_config', null);
    if (aiCfg) {
      set({
        groqApiKey: aiCfg.groqApiKey ?? get().groqApiKey,
        groqModel: aiCfg.groqModel ?? get().groqModel,
        systemPrompt: aiCfg.systemPrompt ?? get().systemPrompt,
        autoSpeak: typeof aiCfg.autoSpeak === 'boolean' ? aiCfg.autoSpeak : get().autoSpeak,
        speechVoice: aiCfg.speechVoice ?? get().speechVoice,
      });
    }
    const charPrefs = await localDataService.loadItem<{
      selectedCharacterId?: string;
      defaultCharacterId?: string;
      characterSettings?: Record<string, CharacterSettings>;
    } | null>('vcamp_character_prefs', null);
    if (charPrefs) {
      const resolvedSelected = charPrefs.selectedCharacterId
        ? getCharacterById(charPrefs.selectedCharacterId).id
        : get().selectedCharacterId;
      const resolvedDefault = charPrefs.defaultCharacterId
        ? getCharacterById(charPrefs.defaultCharacterId).id
        : get().defaultCharacterId;
      const mergedSettings = charPrefs.characterSettings || get().characterSettings;
      if (mergedSettings[resolvedSelected]?.animationSpeed) {
        animationController.setPlaybackSpeed(mergedSettings[resolvedSelected].animationSpeed);
      }
      set({
        selectedCharacterId: resolvedSelected,
        defaultCharacterId: resolvedDefault,
        characterSettings: mergedSettings,
        hasCustomModel: resolvedSelected !== 'vcamp_robot',
        hasModelLoaded: resolvedSelected === 'vcamp_robot',
      });
    }
  },
}));
