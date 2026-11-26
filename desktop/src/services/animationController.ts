import {
  CANONICAL_ANIMATION_STATES,
  CANONICAL_STATE_META_MAP,
  resolveBehaviorToState,
} from '../characters/animationMapping';
import {
  AnimationClipDescriptor,
  CanonicalAnimationState,
  LogicalAnimationState,
} from '../characters/types';

export type AnimationTriggerSource =
  | 'system'
  | 'studio'
  | 'tts'
  | 'mic'
  | 'ai'
  | 'movement'
  | 'intent'
  | 'reminder';

export interface AnimationControllerState {
  activeState: CanonicalAnimationState;
  requestedLogicalState: LogicalAnimationState;
  isPlaying: boolean;
  isStudioPreview: boolean;
  source: AnimationTriggerSource;
  priority: number;
  playbackSpeed: number;
  fadeDuration: number;
  loopOverride: 'auto' | 'loop' | 'once';
  nonce: number;
  lastFallbackReason: string | null;
}

export type AnimationEventType =
  | 'state_changed'
  | 'stopped'
  | 'reset'
  | 'completed'
  | 'descriptors_updated';

export interface AnimationEvent {
  type: AnimationEventType;
  state: CanonicalAnimationState;
  source: AnimationTriggerSource;
  timestamp: number;
}

class AnimationController {
  private priorities: Record<CanonicalAnimationState, number>;
  private availableStates = new Set<CanonicalAnimationState>();
  private descriptors: AnimationClipDescriptor[] = [];
  private listeners = new Set<(state: AnimationControllerState) => void>();
  private eventListeners = new Set<(event: AnimationEvent) => void>();
  private state: AnimationControllerState;
  private isMicActive = false;
  private isAIProcessing = false;
  private isTTSActive = false;

  constructor() {
    this.priorities = CANONICAL_ANIMATION_STATES.reduce((acc, meta) => {
      acc[meta.state] = meta.defaultPriority;
      return acc;
    }, {} as Record<CanonicalAnimationState, number>);

    this.state = {
      activeState: 'IDLE',
      requestedLogicalState: 'IDLE',
      isPlaying: true,
      isStudioPreview: false,
      source: 'system',
      priority: this.priorities.IDLE,
      playbackSpeed: 1.0,
      fadeDuration: 0.24,
      loopOverride: 'auto',
      nonce: 0,
      lastFallbackReason: null,
    };
  }

  public getState(): AnimationControllerState {
    return { ...this.state };
  }

  public getPriorities(): Record<CanonicalAnimationState, number> {
    return { ...this.priorities };
  }

  public setPriority(animState: CanonicalAnimationState, priority: number): void {
    this.priorities[animState] = Math.max(0, Math.min(100, priority));
  }

  public setFadeDuration(seconds: number): void {
    this.state = { ...this.state, fadeDuration: Math.max(0.05, Math.min(1.0, seconds)) };
    this.notify();
  }

  public setPlaybackSpeed(speed: number): void {
    const clamped = Math.max(0.25, Math.min(2.5, speed));
    if (clamped === this.state.playbackSpeed) return;
    this.state = { ...this.state, playbackSpeed: clamped };
    this.notify();
  }

  public setDescriptors(descriptors: AnimationClipDescriptor[]): void {
    this.descriptors = descriptors;
    this.availableStates = new Set(
      descriptors.filter((d) => d.status === 'valid').map((d) => d.state)
    );
    this.emitEvent('descriptors_updated', this.state.activeState, 'system');
    this.notify();
  }

  public getDescriptors(): AnimationClipDescriptor[] {
    return this.descriptors;
  }

  public getAvailableStates(): Set<CanonicalAnimationState> {
    return new Set(this.availableStates);
  }

  public subscribe(cb: (state: AnimationControllerState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => {
      this.listeners.delete(cb);
    };
  }

  public onEvent(cb: (event: AnimationEvent) => void): () => void {
    this.eventListeners.add(cb);
    return () => {
      this.eventListeners.delete(cb);
    };
  }

  private notify(): void {
    const snapshot = this.getState();
    this.listeners.forEach((cb) => cb(snapshot));
  }

  private emitEvent(
    type: AnimationEventType,
    state: CanonicalAnimationState,
    source: AnimationTriggerSource
  ): void {
    const evt: AnimationEvent = { type, state, source, timestamp: Date.now() };
    this.eventListeners.forEach((cb) => cb(evt));
  }

  /**
   * Triggers a logical or canonical animation state respecting configured priorities,
   * studio preview locks, and verified clip availability.
   */
  public trigger(
    logicalState: LogicalAnimationState,
    options: {
      source?: AnimationTriggerSource;
      force?: boolean;
      loopOverride?: 'auto' | 'loop' | 'once';
      studioPreview?: boolean;
    } = {}
  ): CanonicalAnimationState {
    const source = options.source || 'system';
    const available = this.availableStates.size > 0 ? this.availableStates : undefined;
    const resolution = resolveBehaviorToState(logicalState, available);
    const targetState = resolution.targetState;
    const targetPriority = this.priorities[targetState] ?? CANONICAL_STATE_META_MAP[targetState].defaultPriority;

    // Do not allow lower-priority background updates to interrupt active studio preview or higher-priority action
    if (!options.force) {
      if (this.state.isStudioPreview && source !== 'studio') {
        return this.state.activeState;
      }
      if (
        this.state.isPlaying &&
        this.state.activeState !== 'IDLE' &&
        targetState !== 'IDLE' &&
        targetPriority < this.state.priority
      ) {
        return this.state.activeState;
      }
    }

    this.state = {
      ...this.state,
      activeState: targetState,
      requestedLogicalState: logicalState,
      isPlaying: true,
      isStudioPreview: options.studioPreview ?? (source === 'studio'),
      source,
      priority: targetPriority,
      loopOverride: options.loopOverride || 'auto',
      nonce: this.state.nonce + 1,
      lastFallbackReason: resolution.isFallback ? resolution.reason : null,
    };

    this.emitEvent('state_changed', targetState, source);
    this.notify();
    return targetState;
  }

  /**
   * Called by the 3D AnimationMixer when a one-shot or finite interactive animation finishes.
   */
  public notifyClipFinished(finishedState: CanonicalAnimationState): void {
    if (this.state.activeState !== finishedState) return;
    this.emitEvent('completed', finishedState, this.state.source);

    // If TTS is actively speaking when an action finishes, resume TALK; otherwise return to IDLE
    if (this.isTTSActive) {
      this.trigger('TALK', { source: 'tts', force: true });
    } else {
      this.returnToIdle('system');
    }
  }

  public returnToIdle(source: AnimationTriggerSource = 'system'): void {
    this.state = {
      ...this.state,
      activeState: 'IDLE',
      requestedLogicalState: 'IDLE',
      isPlaying: true,
      isStudioPreview: false,
      source,
      priority: this.priorities.IDLE,
      loopOverride: 'auto',
      nonce: this.state.nonce + 1,
      lastFallbackReason: null,
    };
    this.emitEvent('state_changed', 'IDLE', source);
    this.notify();
  }

  /**
   * Stops manual / active animation playback and returns cleanly to IDLE.
   */
  public stop(source: AnimationTriggerSource = 'studio'): void {
    this.isTTSActive = false;
    this.state = {
      ...this.state,
      activeState: 'IDLE',
      requestedLogicalState: 'IDLE',
      isPlaying: true,
      isStudioPreview: false,
      source,
      priority: this.priorities.IDLE,
      loopOverride: 'auto',
      nonce: this.state.nonce + 1,
      lastFallbackReason: null,
    };
    this.emitEvent('stopped', 'IDLE', source);
    this.notify();
  }

  public reset(source: AnimationTriggerSource = 'studio'): void {
    this.isMicActive = false;
    this.isAIProcessing = false;
    this.isTTSActive = false;
    this.state = {
      ...this.state,
      activeState: 'IDLE',
      requestedLogicalState: 'IDLE',
      isPlaying: true,
      isStudioPreview: false,
      source,
      priority: this.priorities.IDLE,
      playbackSpeed: 1.0,
      loopOverride: 'auto',
      nonce: this.state.nonce + 1,
      lastFallbackReason: null,
    };
    this.emitEvent('reset', 'IDLE', source);
    this.notify();
  }

  // ==============================================================
  // AI CONVERSATION & AUDIO LIFECYCLE HOOKS (PHASE 6)
  // ==============================================================

  public onMicStart(): void {
    this.isMicActive = true;
    this.isTTSActive = false;
    this.trigger('LISTEN', { source: 'mic', force: true });
  }

  public onMicStop(): void {
    this.isMicActive = false;
    if (!this.isAIProcessing && !this.isTTSActive && !this.state.isStudioPreview) {
      this.returnToIdle('mic');
    }
  }

  public onAIProcessingStart(): void {
    this.isAIProcessing = true;
    this.trigger('THINK', { source: 'ai', force: false });
  }

  public onAIProcessingEnd(): void {
    this.isAIProcessing = false;
    if (!this.isTTSActive && !this.isMicActive && !this.state.isStudioPreview) {
      if (this.state.requestedLogicalState === 'THINK') {
        this.returnToIdle('ai');
      }
    }
  }

  /**
   * Must ONLY be called when actual TTS audio playback begins (utterance.onstart),
   * never merely when text arrives.
   */
  public onTTSStart(options: { expressive?: boolean } = {}): void {
    this.isTTSActive = true;
    const state: CanonicalAnimationState = options.expressive ? 'TALK_GESTURE' : 'TALK';
    this.trigger(state, { source: 'tts', force: true });
  }

  /**
   * Must be called when actual TTS audio playback ends, errors, or is stopped.
   */
  public onTTSEnd(): void {
    this.isTTSActive = false;
    if (!this.state.isStudioPreview && (this.state.source === 'tts' || this.state.activeState === 'TALK' || this.state.activeState === 'TALK_GESTURE')) {
      this.returnToIdle('tts');
    }
  }

  public getLifecycleFlags() {
    return {
      isMicActive: this.isMicActive,
      isAIProcessing: this.isAIProcessing,
      isTTSActive: this.isTTSActive,
    };
  }
}

export const animationController = new AnimationController();
