export type CanonicalAnimationState =
  | 'IDLE'
  | 'DANCE'
  | 'JUMP'
  | 'KNOCKDOWN'
  | 'LAUGH'
  | 'LAUGH_HARD'
  | 'PUNCH'
  | 'PUSH'
  | 'RUN'
  | 'TALK'
  | 'TALK_GESTURE'
  | 'WALK'
  | 'WAVE';

/**
 * Logical AI companion states that may not have dedicated clips on every character
 * and therefore resolve cleanly to a safe available fallback (e.g. IDLE).
 */
export type LogicalAnimationState = CanonicalAnimationState | 'LISTEN' | 'THINK';

export type AnimationPlaybackMode = 'loop' | 'once';

export type AnimationAvailabilityStatus =
  | 'valid'
  | 'missing'
  | 'incompatible'
  | 'requires_conversion'
  | 'loading';

export interface AnimationClipDescriptor {
  state: CanonicalAnimationState;
  label: string;
  expectedAction: string;
  fileName: string;
  filePath: string;
  clipName: string | null;
  duration: number;
  mode: AnimationPlaybackMode;
  priority: number;
  skeletonCompatible: boolean;
  boneCount: number;
  morphTargetCount: number;
  status: AnimationAvailabilityStatus;
  error?: string;
}

export interface AnimationSourceConfig {
  stateHint: CanonicalAnimationState;
  expectedAction: string;
  fileName: string;
  filePath: string;
  defaultMode: AnimationPlaybackMode;
}

export type CameraPreset = 'front' | 'full_body' | 'upper_body' | 'side' | 'isometric';

export interface CharacterSettings {
  scale: number;
  rotationYDeg: number;
  animationSpeed: number;
  cameraPreset: CameraPreset;
  cameraDistance: number;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  kind: 'procedural' | 'glb';
  previewImage?: string;
  baseModelPath?: string;
  animationSources?: AnimationSourceConfig[];
  defaultTransform: {
    scale: number;
    rotationYDeg: number;
    positionY: number;
  };
  defaultCamera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  };
  capabilities: {
    facialMorphs: boolean;
    skeletalAnimations: boolean;
    emotionVisor: boolean;
  };
}
