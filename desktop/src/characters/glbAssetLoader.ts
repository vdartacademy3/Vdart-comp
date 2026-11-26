import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeletonScene } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  CANONICAL_ANIMATION_STATES,
  CANONICAL_STATE_META_MAP,
  resolveClipToCanonicalState,
} from './animationMapping';
import {
  AnimationClipDescriptor,
  CanonicalAnimationState,
  CharacterDefinition,
} from './types';

export interface LoadedCharacterBundle {
  characterId: string;
  baseScene: THREE.Group;
  skeletonBones: string[];
  morphTargetCount: number;
  clipsByState: Partial<Record<CanonicalAnimationState, THREE.AnimationClip>>;
  descriptors: AnimationClipDescriptor[];
}

const sharedLoader = new GLTFLoader();
const gltfPromiseCache = new Map<string, Promise<GLTF>>();
const bundlePromiseCache = new Map<string, Promise<LoadedCharacterBundle>>();

function loadGltfCached(url: string): Promise<GLTF> {
  const existing = gltfPromiseCache.get(url);
  if (existing) return existing;

  const promise = new Promise<GLTF>((resolve, reject) => {
    sharedLoader.load(
      url,
      (gltf) => resolve(gltf),
      undefined,
      (err) => {
        gltfPromiseCache.delete(url);
        reject(err instanceof Error ? err : new Error(`Failed to load GLB: ${url}`));
      }
    );
  });

  gltfPromiseCache.set(url, promise);
  return promise;
}

function extractSkeletonBoneNames(root: THREE.Object3D): Set<string> {
  const bones = new Set<string>();
  root.traverse((obj) => {
    if ((obj as THREE.Bone).isBone && obj.name) {
      bones.add(obj.name);
    }
    const skinned = obj as THREE.SkinnedMesh;
    if (skinned.isSkinnedMesh && skinned.skeleton) {
      for (const b of skinned.skeleton.bones) {
        if (b?.name) bones.add(b.name);
      }
    }
  });
  return bones;
}

function extractMorphTargetInfo(root: THREE.Object3D): {
  meshNodeNames: Set<string>;
  morphTargetCount: number;
} {
  const meshNodeNames = new Set<string>();
  let morphTargetCount = 0;

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh && mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
      if (mesh.name) meshNodeNames.add(mesh.name);
      morphTargetCount = Math.max(morphTargetCount, mesh.morphTargetInfluences.length);
    }
  });

  return { meshNodeNames, morphTargetCount };
}

/**
 * Verifies whether an AnimationClip's bone and morph tracks are compatible with the base character rig.
 */
export function verifyClipCompatibility(
  clip: THREE.AnimationClip,
  baseBones: Set<string>,
  baseMorphMeshNames: Set<string>,
  baseMorphCount: number,
  sourceBones?: Set<string>
): { compatible: boolean; reason?: string } {
  if (!clip || clip.tracks.length === 0) {
    return { compatible: false, reason: 'Animation clip has no keyframe tracks' };
  }

  let boneTrackCount = 0;
  let matchedBoneTracks = 0;

  for (const track of clip.tracks) {
    const dotIdx = track.name.indexOf('.');
    const targetNode = dotIdx >= 0 ? track.name.slice(0, dotIdx) : track.name;
    const propName = dotIdx >= 0 ? track.name.slice(dotIdx + 1) : '';

    if (propName.startsWith('morphTargetInfluences')) {
      if (baseMorphCount === 0) {
        return { compatible: false, reason: 'Base character has no morph targets' };
      }
      if (baseMorphMeshNames.size > 0 && !baseMorphMeshNames.has(targetNode)) {
        // Still allow if base has morph meshes; Three.js binds by node name.
        // Report mismatch only if none of the morph tracks can bind.
      }
      continue;
    }

    boneTrackCount += 1;
    if (baseBones.has(targetNode) || targetNode === 'Armature') {
      matchedBoneTracks += 1;
    }
  }

  if (sourceBones && sourceBones.size > 0) {
    let sharedBones = 0;
    for (const b of baseBones) {
      if (sourceBones.has(b)) sharedBones += 1;
    }
    if (sharedBones === 0) {
      return { compatible: false, reason: 'Skeleton bone hierarchy does not match base character' };
    }
  }

  if (boneTrackCount > 0 && matchedBoneTracks === 0) {
    return { compatible: false, reason: 'No animation bone tracks matched the base skeleton' };
  }

  return { compatible: true };
}

/**
 * Loads a GLB character bundle, supporting both:
 * 1) A single GLB containing multiple embedded animations
 * 2) Multiple separate animation GLB files sharing a compatible skeleton
 */
export async function loadCharacterBundle(
  character: CharacterDefinition
): Promise<LoadedCharacterBundle> {
  if (character.kind !== 'glb' || !character.baseModelPath) {
    throw new Error(`Character "${character.id}" is not a GLB asset character.`);
  }

  const cached = bundlePromiseCache.get(character.id);
  if (cached) return cached;

  const promise = (async () => {
    const baseGltf = await loadGltfCached(character.baseModelPath!);
    const baseScene = baseGltf.scene;
    const baseBones = extractSkeletonBoneNames(baseScene);
    const { meshNodeNames: baseMorphMeshes, morphTargetCount } = extractMorphTargetInfo(baseScene);

    // Enable shadows and preserve original materials/textures cleanly
    baseScene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
      }
    });

    const clipsByState: Partial<Record<CanonicalAnimationState, THREE.AnimationClip>> = {};
    const descriptorByState = new Map<CanonicalAnimationState, AnimationClipDescriptor>();

    // Mode 1: Check embedded animations directly on the base GLB
    if (baseGltf.animations && baseGltf.animations.length > 0) {
      for (const clip of baseGltf.animations) {
        const resolvedState = resolveClipToCanonicalState(clip.name);
        if (!resolvedState) continue;
        const meta = CANONICAL_STATE_META_MAP[resolvedState];
        const compat = verifyClipCompatibility(clip, baseBones, baseMorphMeshes, morphTargetCount);
        if (compat.compatible) {
          clipsByState[resolvedState] = clip;
        }
        descriptorByState.set(resolvedState, {
          state: resolvedState,
          label: meta.label,
          expectedAction: meta.expectedAction,
          fileName: character.baseModelPath!.split('/').pop() || 'model.glb',
          filePath: character.baseModelPath!,
          clipName: clip.name || '(unnamed)',
          duration: Number(clip.duration.toFixed(3)),
          mode: meta.defaultMode,
          priority: meta.defaultPriority,
          skeletonCompatible: compat.compatible,
          boneCount: baseBones.size,
          morphTargetCount,
          status: compat.compatible ? 'valid' : 'incompatible',
          error: compat.reason,
        });
      }
    }

    // Mode 2: Load separate animation GLB files and verify skeleton compatibility
    const sources = character.animationSources || [];
    await Promise.all(
      sources.map(async (src) => {
        const fallbackMeta = CANONICAL_STATE_META_MAP[src.stateHint];
        try {
          const animGltf = await loadGltfCached(src.filePath);
          const animClip = animGltf.animations?.[0];
          const sourceBones = extractSkeletonBoneNames(animGltf.scene);

          if (!animClip) {
            descriptorByState.set(src.stateHint, {
              state: src.stateHint,
              label: fallbackMeta.label,
              expectedAction: src.expectedAction,
              fileName: src.fileName,
              filePath: src.filePath,
              clipName: null,
              duration: 0,
              mode: src.defaultMode,
              priority: fallbackMeta.defaultPriority,
              skeletonCompatible: sourceBones.size > 0,
              boneCount: sourceBones.size,
              morphTargetCount,
              status: 'missing',
              error: 'No embedded AnimationClip found in GLB',
            });
            return;
          }

          const resolvedState = resolveClipToCanonicalState(animClip.name, src.stateHint) || src.stateHint;
          const meta = CANONICAL_STATE_META_MAP[resolvedState];
          const compat = verifyClipCompatibility(
            animClip,
            baseBones,
            baseMorphMeshes,
            morphTargetCount,
            sourceBones
          );

          if (compat.compatible) {
            clipsByState[resolvedState] = animClip;
          }

          descriptorByState.set(resolvedState, {
            state: resolvedState,
            label: meta.label,
            expectedAction: src.expectedAction,
            fileName: src.fileName,
            filePath: src.filePath,
            clipName: animClip.name || '(unnamed)',
            duration: Number(animClip.duration.toFixed(3)),
            mode: src.defaultMode,
            priority: meta.defaultPriority,
            skeletonCompatible: compat.compatible,
            boneCount: sourceBones.size,
            morphTargetCount,
            status: compat.compatible ? 'valid' : 'incompatible',
            error: compat.reason,
          });
        } catch (err) {
          descriptorByState.set(src.stateHint, {
            state: src.stateHint,
            label: fallbackMeta.label,
            expectedAction: src.expectedAction,
            fileName: src.fileName,
            filePath: src.filePath,
            clipName: null,
            duration: 0,
            mode: src.defaultMode,
            priority: fallbackMeta.defaultPriority,
            skeletonCompatible: false,
            boneCount: 0,
            morphTargetCount: 0,
            status: 'missing',
            error: err instanceof Error ? err.message : 'Failed to load animation GLB',
          });
        }
      })
    );

    // Ensure all 13 canonical actions are represented in the returned descriptors list
    const descriptors: AnimationClipDescriptor[] = CANONICAL_ANIMATION_STATES.map((meta) => {
      const existing = descriptorByState.get(meta.state);
      if (existing) return existing;
      return {
        state: meta.state,
        label: meta.label,
        expectedAction: meta.expectedAction,
        fileName: 'N/A',
        filePath: '',
        clipName: null,
        duration: 0,
        mode: meta.defaultMode,
        priority: meta.defaultPriority,
        skeletonCompatible: false,
        boneCount: 0,
        morphTargetCount: 0,
        status: 'missing',
        error: 'Action asset not registered or missing',
      };
    });

    return {
      characterId: character.id,
      baseScene,
      skeletonBones: Array.from(baseBones),
      morphTargetCount,
      clipsByState,
      descriptors,
    };
  })();

  bundlePromiseCache.set(character.id, promise);
  return promise.catch((err) => {
    bundlePromiseCache.delete(character.id);
    throw err;
  });
}

/**
 * Creates an isolated skinned character instance using SkeletonUtils.clone
 * so multiple viewports (main companion + Character Studio preview) can render safely
 * without sharing mutable bone transforms or corrupting SkinnedMesh bindings.
 */
export function instantiateCharacterScene(bundle: LoadedCharacterBundle): THREE.Group {
  const cloned = cloneSkeletonScene(bundle.baseScene) as THREE.Group;
  cloned.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
    }
  });
  return cloned;
}
