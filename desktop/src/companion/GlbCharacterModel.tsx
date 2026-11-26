import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CANONICAL_STATE_META_MAP } from '../characters/animationMapping';
import { getCharacterById } from '../characters/characterRegistry';
import {
  instantiateCharacterScene,
  loadCharacterBundle,
  LoadedCharacterBundle,
} from '../characters/glbAssetLoader';
import { CanonicalAnimationState } from '../characters/types';
import {
  animationController,
  AnimationControllerState,
} from '../services/animationController';
import { desktopMovementService } from '../services/desktopMovementService';
import { useCompanionStore } from '../stores/companionStore';

interface GlbCharacterModelProps {
  characterId: string;
  /** True in the floating desktop companion viewport; false in Character Studio preview. */
  enableDesktopTransform?: boolean;
  /** Optional local animation speed override (falls back to store/controller). */
  speedOverride?: number;
  /** Optional local scale multiplier override. */
  scaleOverride?: number;
  /** Optional local Y-rotation in degrees override. */
  rotationYDegOverride?: number;
  /** Callback when bundle finishes loading or errors. */
  onBundleLoaded?: (bundle: LoadedCharacterBundle) => void;
  onLoadError?: (error: Error) => void;
}

export const GlbCharacterModel: React.FC<GlbCharacterModelProps> = ({
  characterId,
  enableDesktopTransform = false,
  speedOverride,
  scaleOverride,
  rotationYDegOverride,
  onBundleLoaded,
  onLoadError,
}) => {
  const characterDef = getCharacterById(characterId);
  const storeSettings = useCompanionStore((s) => s.characterSettings[characterId]);
  const robotZ = useCompanionStore((s) => s.robotZ);
  const movementDirection = useCompanionStore((s) => s.movementDirection);
  const setCharacterDescriptors = useCompanionStore((s) => s.setCharacterDescriptors);
  const setCharacterLoadStatus = useCompanionStore((s) => s.setCharacterLoadStatus);

  const rootGroupRef = useRef<THREE.Group>(null);
  const [sceneInstance, setSceneInstance] = useState<THREE.Group | null>(null);
  const [bundle, setBundle] = useState<LoadedCharacterBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Partial<Record<CanonicalAnimationState, THREE.AnimationAction>>>({});
  const activeActionRef = useRef<{
    state: CanonicalAnimationState;
    action: THREE.AnimationAction;
  } | null>(null);
  const finishedHandlerRef = useRef<((e: { action: THREE.AnimationAction; direction: number }) => void) | null>(null);

  // Load and cache GLB bundle, then clone an isolated skinned instance
  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    if (enableDesktopTransform) {
      setCharacterLoadStatus('loading', null);
    }

    loadCharacterBundle(characterDef)
      .then((loaded) => {
        if (cancelled) return;
        const instance = instantiateCharacterScene(loaded);
        setBundle(loaded);
        setSceneInstance(instance);
        setCharacterDescriptors(loaded.descriptors);
        if (enableDesktopTransform) {
          setCharacterLoadStatus('ready', null);
        }
        onBundleLoaded?.(loaded);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load character GLB';
        setLoadError(message);
        if (enableDesktopTransform) {
          setCharacterLoadStatus('error', message);
        }
        onLoadError?.(err instanceof Error ? err : new Error(message));
      });

    return () => {
      cancelled = true;
    };
  }, [characterDef.id, enableDesktopTransform]);

  // Build dedicated AnimationMixer and pre-bind all verified clips
  useEffect(() => {
    if (!sceneInstance || !bundle) return;

    const mixer = new THREE.AnimationMixer(sceneInstance);
    mixerRef.current = mixer;
    const actionMap: Partial<Record<CanonicalAnimationState, THREE.AnimationAction>> = {};

    for (const [stateKey, clip] of Object.entries(bundle.clipsByState)) {
      if (clip) {
        const action = mixer.clipAction(clip);
        actionMap[stateKey as CanonicalAnimationState] = action;
      }
    }
    actionsRef.current = actionMap;
    activeActionRef.current = null;

    const handleFinished = (event: { action: THREE.AnimationAction; direction: number }) => {
      const current = activeActionRef.current;
      if (current && event.action === current.action) {
        animationController.notifyClipFinished(current.state);
      }
    };
    finishedHandlerRef.current = handleFinished;
    mixer.addEventListener('finished', handleFinished);

    // Play initial state immediately with zero fade-in delay
    const initialState = animationController.getState();
    applyAnimationState(initialState, 0.01);

    return () => {
      if (finishedHandlerRef.current) {
        mixer.removeEventListener('finished', finishedHandlerRef.current);
      }
      mixer.stopAllAction();
      mixer.uncacheRoot(sceneInstance);
      mixerRef.current = null;
      actionsRef.current = {};
      activeActionRef.current = null;
    };
  }, [sceneInstance, bundle]);

  const applyAnimationState = (ctrlState: AnimationControllerState, customFade?: number) => {
    const mixer = mixerRef.current;
    if (!mixer) return;

    const targetState = ctrlState.activeState;
    const nextAction = actionsRef.current[targetState] || actionsRef.current.IDLE;
    if (!nextAction) return;

    const effectiveSpeed = speedOverride ?? ctrlState.playbackSpeed ?? 1.0;
    const meta = CANONICAL_STATE_META_MAP[targetState];
    const fadeDuration = customFade ?? ctrlState.fadeDuration ?? 0.24;

    // Determine loop mode: Studio preview defaults to continuous loop unless user forces 'once'
    let loopMode: THREE.AnimationActionLoopStyles = THREE.LoopRepeat;
    let repetitions = Infinity;

    if (ctrlState.loopOverride === 'once') {
      loopMode = THREE.LoopOnce;
      repetitions = 1;
    } else if (ctrlState.loopOverride === 'loop') {
      loopMode = THREE.LoopRepeat;
      repetitions = Infinity;
    } else if (meta.defaultMode === 'once') {
      loopMode = THREE.LoopOnce;
      repetitions = 1;
    } else if (!ctrlState.isStudioPreview && meta.interactiveLoops && meta.interactiveLoops > 0) {
      loopMode = THREE.LoopRepeat;
      repetitions = meta.interactiveLoops;
    }

    const prev = activeActionRef.current;

    if (prev && prev.action === nextAction) {
      nextAction.setEffectiveTimeScale(effectiveSpeed);
      nextAction.setLoop(loopMode, repetitions);
      nextAction.clampWhenFinished = loopMode === THREE.LoopOnce;
      if (ctrlState.nonce > 0 && loopMode === THREE.LoopOnce) {
        nextAction.reset().play();
      }
      return;
    }

    // Stop any stray actions that aren't prev or next to prevent weight conflicts
    for (const act of Object.values(actionsRef.current)) {
      if (act && act !== prev?.action && act !== nextAction && act.isRunning()) {
        act.stop();
      }
    }

    nextAction.enabled = true;
    nextAction.reset();
    nextAction.setEffectiveTimeScale(effectiveSpeed);
    nextAction.setEffectiveWeight(1);
    nextAction.setLoop(loopMode, repetitions);
    nextAction.clampWhenFinished = loopMode === THREE.LoopOnce;
    nextAction.play();

    if (prev && prev.action !== nextAction) {
      prev.action.enabled = true;
      prev.action.crossFadeTo(nextAction, fadeDuration, true);
    } else {
      nextAction.fadeIn(fadeDuration);
    }

    activeActionRef.current = { state: targetState, action: nextAction };
  };

  // Subscribe to centralized animationController
  useEffect(() => {
    if (!sceneInstance || !bundle) return;

    let lastNonce = -1;
    let lastSpeed = -1;

    const unsubscribe = animationController.subscribe((ctrlState) => {
      const effectiveSpeed = speedOverride ?? ctrlState.playbackSpeed;
      if (ctrlState.nonce !== lastNonce) {
        lastNonce = ctrlState.nonce;
        lastSpeed = effectiveSpeed;
        applyAnimationState(ctrlState);
      } else if (effectiveSpeed !== lastSpeed && activeActionRef.current) {
        lastSpeed = effectiveSpeed;
        activeActionRef.current.action.setEffectiveTimeScale(effectiveSpeed);
      }
    });

    return unsubscribe;
  }, [sceneInstance, bundle, speedOverride]);

  // Apply live speedOverride changes when controlled from Studio slider
  useEffect(() => {
    if (typeof speedOverride === 'number' && activeActionRef.current) {
      activeActionRef.current.action.setEffectiveTimeScale(speedOverride);
    }
  }, [speedOverride]);

  // Advance AnimationMixer and smooth transforms each frame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(Math.min(delta, 0.05));
    }

    if (!rootGroupRef.current) return;

    const userScale = scaleOverride ?? storeSettings?.scale ?? 1.0;
    const baseScale = characterDef.defaultTransform.scale * userScale;
    const targetZ = enableDesktopTransform ? robotZ || 0 : 0;
    const depthScale = enableDesktopTransform ? Math.max(0.62, 1.0 + targetZ * 0.22) : 1.0;
    const finalScale = baseScale * depthScale;

    rootGroupRef.current.scale.set(
      THREE.MathUtils.lerp(rootGroupRef.current.scale.x, finalScale, 0.16),
      THREE.MathUtils.lerp(rootGroupRef.current.scale.y, finalScale, 0.16),
      THREE.MathUtils.lerp(rootGroupRef.current.scale.z, finalScale, 0.16)
    );

    // Keep feet anchored nicely as scale changes
    const baseY = characterDef.defaultTransform.positionY * userScale;
    rootGroupRef.current.position.y = THREE.MathUtils.lerp(rootGroupRef.current.position.y, baseY, 0.16);
    rootGroupRef.current.position.z = THREE.MathUtils.lerp(rootGroupRef.current.position.z, targetZ, 0.16);

    const userRotDeg = rotationYDegOverride ?? storeSettings?.rotationYDeg ?? 0;
    let targetRotY = THREE.MathUtils.degToRad(characterDef.defaultTransform.rotationYDeg + userRotDeg);

    if (enableDesktopTransform) {
      const ctrlState = animationController.getState();
      const isTranslating = ctrlState.activeState === 'WALK' || ctrlState.activeState === 'RUN';
      if (isTranslating) {
        const dir = movementDirection || desktopMovementService.getDirection();
        targetRotY += dir > 0 ? 0.55 : -0.55;
      }
    }

    rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(
      rootGroupRef.current.rotation.y,
      targetRotY,
      0.16
    );
  });

  if (loadError) {
    // Subtle red indicator ring inside WebGL canvas while UI displays full error
    return (
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.45, 0.04, 16, 32]} />
        <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={1.5} />
      </mesh>
    );
  }

  if (!sceneInstance) {
    return (
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.035, 16, 32]} />
        <meshStandardMaterial color="#06b6d4" emissive="#00f2fe" emissiveIntensity={1.6} />
      </mesh>
    );
  }

  return (
    <group
      ref={rootGroupRef}
      position={[0, characterDef.defaultTransform.positionY, 0]}
      scale={[
        characterDef.defaultTransform.scale,
        characterDef.defaultTransform.scale,
        characterDef.defaultTransform.scale,
      ]}
    >
      <primitive object={sceneInstance} />
    </group>
  );
};
