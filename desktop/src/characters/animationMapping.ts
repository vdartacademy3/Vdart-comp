import {
  AnimationPlaybackMode,
  CanonicalAnimationState,
  LogicalAnimationState,
} from './types';

export interface CanonicalStateMeta {
  state: CanonicalAnimationState;
  label: string;
  expectedAction: string;
  defaultMode: AnimationPlaybackMode;
  defaultPriority: number;
  /** Number of loops before returning to IDLE when triggered via chat/AI intent (undefined = continuous loop until stopped). */
  interactiveLoops?: number;
  aliases: string[];
}

export const CANONICAL_ANIMATION_STATES: CanonicalStateMeta[] = [
  {
    state: 'IDLE',
    label: 'Idle',
    expectedAction: 'idle',
    defaultMode: 'loop',
    defaultPriority: 10,
    aliases: ['idle', 'idle loop', 'breathing', 'stand', 'rest'],
  },
  {
    state: 'DANCE',
    label: 'Dance (Groove)',
    expectedAction: 'dance_groove',
    defaultMode: 'loop',
    defaultPriority: 40,
    interactiveLoops: 2,
    aliases: ['dance groove', 'dance', 'groove', 'dancing'],
  },
  {
    state: 'JUMP',
    label: 'Jump (Running)',
    expectedAction: 'jump_running',
    defaultMode: 'once',
    defaultPriority: 70,
    aliases: ['jump running', 'running jump', 'jump'],
  },
  {
    state: 'KNOCKDOWN',
    label: 'Knockdown',
    expectedAction: 'knockdown',
    defaultMode: 'once',
    defaultPriority: 95,
    aliases: ['knockdown', 'knock down', 'fall', 'fall down'],
  },
  {
    state: 'LAUGH',
    label: 'Laugh',
    expectedAction: 'laugh',
    defaultMode: 'loop',
    defaultPriority: 45,
    interactiveLoops: 1,
    aliases: ['laugh', 'laugh loop', 'chuckle'],
  },
  {
    state: 'LAUGH_HARD',
    label: 'Laugh Hard',
    expectedAction: 'laugh hard',
    defaultMode: 'loop',
    defaultPriority: 48,
    interactiveLoops: 1,
    aliases: ['laugh hard', 'laugh hard loop', 'laugh_hard', 'hard laugh', 'belly laugh'],
  },
  {
    state: 'PUNCH',
    label: 'Punch',
    expectedAction: 'punch',
    defaultMode: 'once',
    defaultPriority: 80,
    aliases: ['punch', 'jab', 'strike'],
  },
  {
    state: 'PUSH',
    label: 'Push',
    expectedAction: 'push',
    defaultMode: 'once',
    defaultPriority: 75,
    aliases: ['push', 'shove'],
  },
  {
    state: 'RUN',
    label: 'Run',
    expectedAction: 'run',
    defaultMode: 'loop',
    defaultPriority: 25,
    aliases: ['run', 'run loop', 'sprint', 'jog'],
  },
  {
    state: 'TALK',
    label: 'Talk',
    expectedAction: 'talk',
    defaultMode: 'loop',
    defaultPriority: 55,
    aliases: ['talk', 'talk loop', 'speak', 'speaking'],
  },
  {
    state: 'TALK_GESTURE',
    label: 'Talk (Gestures)',
    expectedAction: 'talk_gesture',
    defaultMode: 'loop',
    defaultPriority: 58,
    aliases: [
      'talk gesture',
      'talk gestures',
      'talk with gestures',
      'talk with gestures loop',
      'talk_gestures',
      'expressive talk',
    ],
  },
  {
    state: 'WALK',
    label: 'Walk',
    expectedAction: 'walk',
    defaultMode: 'loop',
    defaultPriority: 20,
    aliases: ['walk', 'walk loop', 'walking', 'wander'],
  },
  {
    state: 'WAVE',
    label: 'Wave',
    expectedAction: 'wave',
    defaultMode: 'loop',
    defaultPriority: 42,
    interactiveLoops: 2,
    aliases: ['wave', 'wave loop', 'greet', 'hello'],
  },
];

export const CANONICAL_STATE_META_MAP: Record<CanonicalAnimationState, CanonicalStateMeta> =
  CANONICAL_ANIMATION_STATES.reduce((acc, item) => {
    acc[item.state] = item;
    return acc;
  }, {} as Record<CanonicalAnimationState, CanonicalStateMeta>);

/**
 * Normalizes a GLB animation clip name or filename action token by stripping
 * loop suffixes, punctuation, parentheses, underscores, and extra whitespace.
 */
export function normalizeClipKey(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .replace(/\.glb$|\.gltf$/i, '')
    .replace(/^[^@]+@/, '')
    .replace(/[-_\s]*loop$/i, '')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Dynamically maps an embedded GLTF animation clip name (and optional hint)
 * to a canonical VCamp animation state without assuming filename == clipName.
 */
export function resolveClipToCanonicalState(
  clipName: string,
  hintState?: CanonicalAnimationState
): CanonicalAnimationState | null {
  const normalized = normalizeClipKey(clipName);
  if (!normalized) {
    return hintState || null;
  }

  // Pass 1: exact normalized match against aliases or state name
  for (const meta of CANONICAL_ANIMATION_STATES) {
    if (
      normalizeClipKey(meta.state) === normalized ||
      normalizeClipKey(meta.expectedAction) === normalized ||
      meta.aliases.some((alias) => normalizeClipKey(alias) === normalized)
    ) {
      return meta.state;
    }
  }

  // Pass 2: token containment (preferring longer/more specific aliases first, e.g. "laugh hard" before "laugh")
  const orderedBySpecificity = [...CANONICAL_ANIMATION_STATES].sort(
    (a, b) => b.expectedAction.length - a.expectedAction.length
  );
  for (const meta of orderedBySpecificity) {
    if (meta.aliases.some((alias) => normalized.includes(normalizeClipKey(alias)))) {
      return meta.state;
    }
  }

  return hintState || null;
}

export interface BehaviorResolution {
  targetState: CanonicalAnimationState;
  isFallback: boolean;
  reason: string;
}

/**
 * Resolves logical companion states (including LISTEN / THINK) to verified available clips.
 * Never fabricates missing animations: LISTEN and THINK safely fall back to IDLE.
 */
export function resolveBehaviorToState(
  logicalState: LogicalAnimationState,
  availableStates?: Set<CanonicalAnimationState>
): BehaviorResolution {
  if (logicalState === 'LISTEN') {
    return {
      targetState: 'IDLE',
      isFallback: true,
      reason: 'No dedicated LISTEN animation clip; using IDLE fallback',
    };
  }
  if (logicalState === 'THINK') {
    return {
      targetState: 'IDLE',
      isFallback: true,
      reason: 'No dedicated THINK animation clip; using IDLE fallback',
    };
  }

  if (!availableStates || availableStates.has(logicalState)) {
    return {
      targetState: logicalState,
      isFallback: false,
      reason: 'Exact canonical animation available',
    };
  }

  // Graceful fallback chain if a specific clip failed to load or is missing
  if (logicalState === 'TALK_GESTURE' && availableStates.has('TALK')) {
    return { targetState: 'TALK', isFallback: true, reason: 'Fallback from TALK_GESTURE to TALK' };
  }
  if (logicalState === 'LAUGH_HARD' && availableStates.has('LAUGH')) {
    return { targetState: 'LAUGH', isFallback: true, reason: 'Fallback from LAUGH_HARD to LAUGH' };
  }

  return {
    targetState: 'IDLE',
    isFallback: true,
    reason: `Fallback from ${logicalState} to IDLE`,
  };
}

/**
 * Detects explicit user conversational requests/intents that map to character actions.
 */
export function detectChatAnimationIntent(text: string): CanonicalAnimationState | null {
  const lower = (text || '').toLowerCase().trim();
  if (!lower) return null;

  if (/\b(knock\s*down|knockdown|fall down)\b/i.test(lower)) return 'KNOCKDOWN';
  if (/\b(punch|throw a punch|shadow\s*box)\b/i.test(lower)) return 'PUNCH';
  if (/\b(push|shove)\b/i.test(lower)) return 'PUSH';
  if (/\b(jump|leap|hop)\b/i.test(lower)) return 'JUMP';
  if (/\b(laugh hard|hard laugh|lmao|rofl|hilarious|crack up)\b/i.test(lower)) return 'LAUGH_HARD';
  if (/\b(laugh|haha|hehe|lol|funny|giggle)\b/i.test(lower)) return 'LAUGH';
  if (/\b(dance|groove|boogie|party)\b/i.test(lower)) return 'DANCE';
  if (/\b(sprint|run)\b/i.test(lower)) return 'RUN';
  if (/\b(walk|stroll)\b/i.test(lower)) return 'WALK';
  if (/\b(wave|hi|hello|hey|vanakkam|வணக்கம்|good morning|good evening)\b/i.test(lower)) return 'WAVE';

  return null;
}

/**
 * Maps legacy CompanionAction values used by procedural robot / desktopMovementService
 * into canonical VCamp animation states.
 */
export function mapLegacyActionToCanonical(action: string): LogicalAnimationState {
  switch (action) {
    case 'walk':
    case 'wander':
    case 'follow_cursor':
    case 'circle':
      return 'WALK';
    case 'run':
      return 'RUN';
    case 'play':
    case 'jump':
      return 'JUMP';
    case 'greet':
    case 'wave':
      return 'WAVE';
    case 'speak':
    case 'talk':
      return 'TALK';
    case 'talk_gesture':
      return 'TALK_GESTURE';
    case 'listen':
    case 'listening':
      return 'LISTEN';
    case 'think':
    case 'thinking':
      return 'THINK';
    case 'dance':
      return 'DANCE';
    case 'laugh':
      return 'LAUGH';
    case 'laugh_hard':
      return 'LAUGH_HARD';
    case 'punch':
      return 'PUNCH';
    case 'push':
      return 'PUSH';
    case 'knockdown':
      return 'KNOCKDOWN';
    default:
      return 'IDLE';
  }
}
