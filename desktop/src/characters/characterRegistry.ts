import { AnimationSourceConfig, CharacterDefinition, CharacterSettings } from './types';

const ATHLETIC_MAN_ANIMATIONS: AnimationSourceConfig[] = [
  {
    stateHint: 'IDLE',
    expectedAction: 'idle',
    fileName: 'Athletic_man@idle.glb',
    filePath: '/characters/Athletic_man/Athletic_man@idle.glb',
    defaultMode: 'loop',
  },
  {
    stateHint: 'DANCE',
    expectedAction: 'dance_groove',
    fileName: 'Athletic_man@dance_groove.glb',
    filePath: '/characters/Athletic_man/Athletic_man@dance_groove.glb',
    defaultMode: 'loop',
  },
  {
    stateHint: 'JUMP',
    expectedAction: 'jump_running',
    fileName: 'Athletic_man@jump_running.glb',
    filePath: '/characters/Athletic_man/Athletic_man@jump_running.glb',
    defaultMode: 'once',
  },
  {
    stateHint: 'KNOCKDOWN',
    expectedAction: 'knockdown',
    fileName: 'Athletic_man@knockdown.glb',
    filePath: '/characters/Athletic_man/Athletic_man@knockdown.glb',
    defaultMode: 'once',
  },
  {
    stateHint: 'LAUGH',
    expectedAction: 'laugh',
    fileName: 'Athletic_man@laugh.glb',
    filePath: '/characters/Athletic_man/Athletic_man@laugh.glb',
    defaultMode: 'loop',
  },
  {
    stateHint: 'LAUGH_HARD',
    expectedAction: 'laugh hard',
    fileName: 'Athletic_man@laugh_hard.glb',
    filePath: '/characters/Athletic_man/Athletic_man@laugh_hard.glb',
    defaultMode: 'loop',
  },
  {
    stateHint: 'PUNCH',
    expectedAction: 'punch',
    fileName: 'Athletic_man@punch.glb',
    filePath: '/characters/Athletic_man/Athletic_man@punch.glb',
    defaultMode: 'once',
  },
  {
    stateHint: 'PUSH',
    expectedAction: 'push',
    fileName: 'Athletic_man@push.glb',
    filePath: '/characters/Athletic_man/Athletic_man@push.glb',
    defaultMode: 'once',
  },
  {
    stateHint: 'RUN',
    expectedAction: 'run',
    fileName: 'Athletic_man@run.glb',
    filePath: '/characters/Athletic_man/Athletic_man@run.glb',
    defaultMode: 'loop',
  },
  {
    stateHint: 'TALK',
    expectedAction: 'talk',
    fileName: 'Athletic_man@talk.glb',
    filePath: '/characters/Athletic_man/Athletic_man@talk.glb',
    defaultMode: 'loop',
  },
  {
    stateHint: 'TALK_GESTURE',
    expectedAction: 'talk_gesture',
    fileName: 'Athletic_man@talk_gestures.glb',
    filePath: '/characters/Athletic_man/Athletic_man@talk_gestures.glb',
    defaultMode: 'loop',
  },
  {
    stateHint: 'WALK',
    expectedAction: 'walk',
    fileName: 'Athletic_man@walk.glb',
    filePath: '/characters/Athletic_man/Athletic_man@walk.glb',
    defaultMode: 'loop',
  },
  {
    stateHint: 'WAVE',
    expectedAction: 'wave',
    fileName: 'Athletic_man@wave.glb',
    filePath: '/characters/Athletic_man/Athletic_man@wave.glb',
    defaultMode: 'loop',
  },
];

export const CHARACTER_REGISTRY: CharacterDefinition[] = [
  {
    id: 'vcamp_robot',
    name: 'VCamp Robot',
    subtitle: 'Procedural PBR Companion',
    description:
      'Original VCamp robotic desktop companion with procedural kinematics, cyan visor expressions, and 25-emotion glow aura.',
    kind: 'procedural',
    defaultTransform: {
      scale: 1.0,
      rotationYDeg: 0,
      positionY: -0.25,
    },
    defaultCamera: {
      position: [0, 0.1, 4.0],
      target: [0, 0.0, 0],
      fov: 40,
    },
    capabilities: {
      facialMorphs: false,
      skeletalAnimations: false,
      emotionVisor: true,
    },
  },
  {
    id: 'athletic_man',
    name: 'Athletic Man',
    subtitle: 'Rigged Humanoid GLB (164 Bones • 13 Actions)',
    description:
      'Full MakeHuman 164-bone rigged 3D humanoid character with 34 facial/viseme morph targets and 13 skeletal motion-capture animations.',
    kind: 'glb',
    previewImage: '/characters/Athletic_man/preview.png',
    baseModelPath: '/characters/Athletic_man/Athletic_man.glb',
    animationSources: ATHLETIC_MAN_ANIMATIONS,
    defaultTransform: {
      scale: 1.24,
      rotationYDeg: 0,
      positionY: -1.1,
    },
    defaultCamera: {
      position: [0, 0.05, 3.8],
      target: [0, 0.0, 0],
      fov: 40,
    },
    capabilities: {
      facialMorphs: true,
      skeletalAnimations: true,
      emotionVisor: false,
    },
  },
];

export const DEFAULT_CHARACTER_ID = 'vcamp_robot';

export const DEFAULT_CHARACTER_SETTINGS: CharacterSettings = {
  scale: 1.0,
  rotationYDeg: 0,
  animationSpeed: 1.0,
  cameraPreset: 'full_body',
  cameraDistance: 1.0,
};

export function getRegisteredCharacters(): CharacterDefinition[] {
  return CHARACTER_REGISTRY;
}

export function getCharacterById(id: string): CharacterDefinition {
  return CHARACTER_REGISTRY.find((c) => c.id === id) || CHARACTER_REGISTRY[0];
}
