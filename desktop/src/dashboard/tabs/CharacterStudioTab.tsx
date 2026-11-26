import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Film,
  Loader2,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Square,
  Star,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { CANONICAL_ANIMATION_STATES } from '../../characters/animationMapping';
import {
  DEFAULT_CHARACTER_SETTINGS,
  getCharacterById,
  getRegisteredCharacters,
} from '../../characters/characterRegistry';
import { LoadedCharacterBundle } from '../../characters/glbAssetLoader';
import {
  AnimationClipDescriptor,
  CameraPreset,
  CanonicalAnimationState,
} from '../../characters/types';
import { CompanionModel } from '../../companion/CompanionModel';
import { GlbCharacterModel } from '../../companion/GlbCharacterModel';
import {
  animationController,
  AnimationControllerState,
} from '../../services/animationController';
import { useCompanionStore } from '../../stores/companionStore';

const CAMERA_PRESETS: Record<
  CameraPreset,
  { label: string; position: [number, number, number]; target: [number, number, number] }
> = {
  full_body: { label: 'Full Body', position: [0, 0.05, 3.8], target: [0, -0.05, 0] },
  front: { label: 'Front', position: [0, 0.2, 3.1], target: [0, 0.05, 0] },
  upper_body: { label: 'Upper Body', position: [0, 0.55, 2.05], target: [0, 0.48, 0] },
  side: { label: 'Side', position: [3.4, 0.15, 0.2], target: [0, 0, 0] },
  isometric: { label: '3/4 Angle', position: [2.4, 0.9, 2.8], target: [0, 0, 0] },
};

const StudioCameraRig: React.FC<{
  preset: CameraPreset;
  distanceMultiplier: number;
  resetToken: number;
}> = ({ preset, distanceMultiplier, resetToken }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const cfg = CAMERA_PRESETS[preset] || CAMERA_PRESETS.full_body;
    const targetVec = new THREE.Vector3(...cfg.target);
    const basePos = new THREE.Vector3(...cfg.position);
    const offset = basePos.clone().sub(targetVec).multiplyScalar(distanceMultiplier);
    camera.position.copy(targetVec.clone().add(offset));
    camera.lookAt(targetVec);
    if (controlsRef.current) {
      controlsRef.current.target.copy(targetVec);
      controlsRef.current.update();
    }
  }, [preset, distanceMultiplier, resetToken, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.1}
      maxDistance={7.5}
    />
  );
};

export const CharacterStudioTab: React.FC = () => {
  const characters = useMemo(() => getRegisteredCharacters(), []);
  const selectedCharacterId = useCompanionStore((s) => s.selectedCharacterId);
  const defaultCharacterId = useCompanionStore((s) => s.defaultCharacterId);
  const characterSettingsMap = useCompanionStore((s) => s.characterSettings);
  const characterDescriptors = useCompanionStore((s) => s.characterDescriptors);
  const setSelectedCharacterId = useCompanionStore((s) => s.setSelectedCharacterId);
  const setDefaultCharacterId = useCompanionStore((s) => s.setDefaultCharacterId);
  const updateCharacterSettings = useCompanionStore((s) => s.updateCharacterSettings);
  const resetCharacterSettings = useCompanionStore((s) => s.resetCharacterSettings);

  const selectedChar = getCharacterById(selectedCharacterId);
  const settings = characterSettingsMap[selectedCharacterId] || DEFAULT_CHARACTER_SETTINGS;

  const [animState, setAnimState] = useState<AnimationControllerState>(() =>
    animationController.getState()
  );
  const [selectedAction, setSelectedAction] = useState<CanonicalAnimationState>('IDLE');
  const [loopOverride, setLoopOverride] = useState<'auto' | 'loop' | 'once'>('auto');
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioError, setStudioError] = useState<string | null>(null);
  const [bundleMeta, setBundleMeta] = useState<{
    bones: number;
    morphs: number;
    descriptors: AnimationClipDescriptor[];
  } | null>(null);
  const [cameraResetToken, setCameraResetToken] = useState(0);

  useEffect(() => {
    return animationController.subscribe((next) => setAnimState(next));
  }, []);

  useEffect(() => {
    setStudioError(null);
    if (selectedChar.kind === 'glb') {
      setStudioLoading(true);
    } else {
      setStudioLoading(false);
      setBundleMeta(null);
    }
  }, [selectedChar.id, selectedChar.kind]);

  const handleBundleLoaded = (bundle: LoadedCharacterBundle) => {
    setStudioLoading(false);
    setStudioError(null);
    setBundleMeta({
      bones: bundle.skeletonBones.length,
      morphs: bundle.morphTargetCount,
      descriptors: bundle.descriptors,
    });
  };

  const handleLoadError = (err: Error) => {
    setStudioLoading(false);
    setStudioError(err.message);
  };

  const actionRows: AnimationClipDescriptor[] = useMemo(() => {
    if (selectedChar.kind === 'procedural') {
      return CANONICAL_ANIMATION_STATES.map((meta) => ({
        state: meta.state,
        label: meta.label,
        expectedAction: meta.expectedAction,
        fileName: 'Procedural (Three.js)',
        filePath: '',
        clipName: `Procedural:${meta.state}`,
        duration: 0,
        mode: meta.defaultMode,
        priority: meta.defaultPriority,
        skeletonCompatible: true,
        boneCount: 0,
        morphTargetCount: 0,
        status: 'valid',
      }));
    }

    if (bundleMeta?.descriptors?.length) return bundleMeta.descriptors;
    if (characterDescriptors.length) return characterDescriptors;

    return CANONICAL_ANIMATION_STATES.map((meta) => ({
      state: meta.state,
      label: meta.label,
      expectedAction: meta.expectedAction,
      fileName: `Athletic_man@${meta.expectedAction.replace(/\s+/g, '_')}.glb`,
      filePath: '',
      clipName: null,
      duration: 0,
      mode: meta.defaultMode,
      priority: meta.defaultPriority,
      skeletonCompatible: false,
      boneCount: 0,
      morphTargetCount: 0,
      status: studioLoading ? 'loading' : 'missing',
    }));
  }, [selectedChar.kind, bundleMeta, characterDescriptors, studioLoading]);

  const validCount = actionRows.filter((r) => r.status === 'valid').length;

  const handlePlayAction = (state: CanonicalAnimationState) => {
    setSelectedAction(state);
    animationController.trigger(state, {
      source: 'studio',
      force: true,
      loopOverride,
      studioPreview: true,
    });
  };

  const handleStopAnimation = () => {
    setSelectedAction('IDLE');
    animationController.stop('studio');
  };

  const handleResetAll = () => {
    setSelectedAction('IDLE');
    setLoopOverride('auto');
    resetCharacterSettings(selectedCharacterId);
    setCameraResetToken((n) => n + 1);
  };

  return (
    <div className="space-y-5" data-testid="character-studio">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-vcamp-text flex items-center gap-2">
            <Users className="w-5 h-5 text-vcamp-primary" />
            3D Character Studio &amp; Animation Controller
          </h3>
          <p className="text-xs text-vcamp-muted">
            Select, preview, scale, rotate, and test character animation clips with live Three.js validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-vcamp-secondary text-vcamp-primary font-semibold border border-blue-200">
            Active: {selectedChar.name}
          </span>
          <button
            type="button"
            onClick={handleResetAll}
            data-testid="studio-reset-settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-vcamp-border text-xs font-medium text-vcamp-text transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-vcamp-primary" />
            Reset Settings
          </button>
        </div>
      </div>

      {/* Character Selection */}
      <div className="bg-white p-4 rounded-2xl border border-vcamp-border shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-vcamp-text uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-vcamp-primary" />
            Registered Characters ({characters.length})
          </h4>
          <span className="text-[11px] text-vcamp-muted">
            Character selection persists automatically across restarts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {characters.map((char) => {
            const isSelected = char.id === selectedCharacterId;
            const isDefault = char.id === defaultCharacterId;
            return (
              <div
                key={char.id}
                data-testid={`character-card-${char.id}`}
                onClick={() => setSelectedCharacterId(char.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'bg-vcamp-secondary border-vcamp-primary shadow-card'
                    : 'bg-white border-vcamp-border hover:border-blue-300'
                }`}
              >
                {char.previewImage ? (
                  <img
                    src={char.previewImage}
                    alt={char.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-vcamp-border shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-vcamp-secondary border border-blue-200 flex items-center justify-center shrink-0">
                    <Sparkles className="w-7 h-7 text-vcamp-primary" />
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-vcamp-text truncate">{char.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {isDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                          Default
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-vcamp-success border border-emerald-200 font-semibold">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-vcamp-primary font-semibold">{char.subtitle}</p>
                  <p className="text-[11px] text-vcamp-muted line-clamp-2">{char.description}</p>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCharacterId(char.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        isSelected
                          ? 'bg-vcamp-primary text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-vcamp-text'
                      }`}
                    >
                      {isSelected ? 'Active Companion' : 'Select Character'}
                    </button>

                    {!isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDefaultCharacterId(char.id);
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] bg-white hover:bg-slate-50 border border-vcamp-border text-vcamp-muted hover:text-vcamp-text flex items-center gap-1"
                      >
                        <Star className="w-3 h-3 text-vcamp-warning" />
                        Set Default
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview + Animations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 3D Preview & Transform Sliders */}
        <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-vcamp-border shadow-card flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-vcamp-text uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-vcamp-primary" />
              3D Character Preview
            </h4>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span
                data-testid="studio-active-state"
                className="px-2 py-0.5 rounded-full bg-vcamp-secondary text-vcamp-primary border border-blue-200 font-mono font-semibold"
              >
                State: {animState.activeState}
              </span>
              {bundleMeta && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-vcamp-muted border border-vcamp-border font-mono">
                  {bundleMeta.bones} Bones • {bundleMeta.morphs} Morphs
                </span>
              )}
            </div>
          </div>

          <div
            data-testid="studio-preview-canvas"
            className="relative w-full h-[330px] rounded-xl overflow-hidden bg-slate-50 border border-vcamp-border"
          >
            {studioLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm gap-2">
                <Loader2 className="w-6 h-6 text-vcamp-primary animate-spin" />
                <span className="text-xs text-vcamp-text font-medium">
                  Loading {selectedChar.name} &amp; verifying 13 animation clips...
                </span>
              </div>
            )}

            {studioError && (
              <div className="absolute inset-x-3 top-3 z-20 p-2.5 rounded-lg bg-red-50 border border-red-200 text-vcamp-error text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{studioError}</span>
              </div>
            )}

            <Canvas
              camera={{ position: [0, 0.05, 3.8], fov: 40, near: 0.1, far: 50 }}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            >
              <ambientLight intensity={1.0} />
              <hemisphereLight args={['#ffffff', '#cbd5e1', 0.9]} />
              <directionalLight position={[3, 4, 4]} intensity={1.5} castShadow />
              <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#1769d2" />
              <gridHelper args={[6, 12, '#cbd5e1', '#e2e8f0']} position={[0, -1.1, 0]} />

              {selectedChar.kind === 'glb' ? (
                <GlbCharacterModel
                  characterId={selectedChar.id}
                  enableDesktopTransform={false}
                  speedOverride={settings.animationSpeed}
                  scaleOverride={settings.scale}
                  rotationYDegOverride={settings.rotationYDeg}
                  onBundleLoaded={handleBundleLoaded}
                  onLoadError={handleLoadError}
                />
              ) : (
                <group
                  scale={[settings.scale, settings.scale, settings.scale]}
                  rotation={[0, THREE.MathUtils.degToRad(settings.rotationYDeg), 0]}
                >
                  <CompanionModel />
                </group>
              )}

              <StudioCameraRig
                preset={settings.cameraPreset}
                distanceMultiplier={settings.cameraDistance}
                resetToken={cameraResetToken}
              />
            </Canvas>

            {animState.lastFallbackReason && (
              <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800">
                Fallback: {animState.lastFallbackReason}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((presetKey) => (
                <button
                  key={presetKey}
                  type="button"
                  data-testid={`camera-preset-${presetKey}`}
                  onClick={() => updateCharacterSettings(selectedCharacterId, { cameraPreset: presetKey })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                    settings.cameraPreset === presetKey
                      ? 'bg-vcamp-secondary border-vcamp-primary text-vcamp-primary'
                      : 'bg-white border-vcamp-border text-vcamp-muted hover:text-vcamp-text'
                  }`}
                >
                  {CAMERA_PRESETS[presetKey].label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-vcamp-muted w-28 shrink-0">Camera Distance</span>
              <input
                type="range"
                min="0.6"
                max="1.8"
                step="0.05"
                value={settings.cameraDistance}
                onChange={(e) =>
                  updateCharacterSettings(selectedCharacterId, {
                    cameraDistance: parseFloat(e.target.value),
                  })
                }
                data-testid="studio-camera-distance"
                className="flex-1 accent-vcamp-primary cursor-pointer"
              />
              <span className="font-mono text-vcamp-primary font-semibold w-12 text-right">
                {settings.cameraDistance.toFixed(2)}x
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-vcamp-border space-y-2.5 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-vcamp-text font-medium w-28 shrink-0 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-vcamp-primary" />
                Anim Speed
              </span>
              <input
                type="range"
                min="0.25"
                max="2.5"
                step="0.05"
                value={settings.animationSpeed}
                onChange={(e) =>
                  updateCharacterSettings(selectedCharacterId, {
                    animationSpeed: parseFloat(e.target.value),
                  })
                }
                data-testid="studio-speed-slider"
                className="flex-1 accent-vcamp-primary cursor-pointer"
              />
              <span className="font-mono text-vcamp-primary font-semibold w-12 text-right">
                {settings.animationSpeed.toFixed(2)}x
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-vcamp-text font-medium w-28 shrink-0">Character Scale</span>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={settings.scale}
                onChange={(e) =>
                  updateCharacterSettings(selectedCharacterId, {
                    scale: parseFloat(e.target.value),
                  })
                }
                data-testid="studio-scale-slider"
                className="flex-1 accent-vcamp-primary cursor-pointer"
              />
              <span className="font-mono text-vcamp-primary font-semibold w-12 text-right">
                {settings.scale.toFixed(2)}x
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-vcamp-text font-medium w-28 shrink-0">Rotation (Y)</span>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={settings.rotationYDeg}
                onChange={(e) =>
                  updateCharacterSettings(selectedCharacterId, {
                    rotationYDeg: parseInt(e.target.value, 10),
                  })
                }
                data-testid="studio-rotation-slider"
                className="flex-1 accent-vcamp-primary cursor-pointer"
              />
              <span className="font-mono text-vcamp-primary font-semibold w-12 text-right">
                {settings.rotationYDeg}°
              </span>
            </div>
          </div>
        </div>

        {/* 13 Action Clips */}
        <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-vcamp-border shadow-card flex flex-col space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-vcamp-text uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-4 h-4 text-vcamp-primary" />
              Animation Actions ({validCount}/{actionRows.length} Verified)
            </h4>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="studio-play-btn"
                onClick={() => handlePlayAction(selectedAction)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-vcamp-primary hover:bg-vcamp-primaryHover text-white text-xs font-semibold transition-colors"
              >
                <Play className="w-3 h-3" />
                Play
              </button>
              <button
                type="button"
                data-testid="studio-stop-btn"
                onClick={handleStopAnimation}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-vcamp-error text-xs font-semibold transition-colors"
              >
                <Square className="w-3 h-3" />
                Stop
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pb-2 border-b border-vcamp-border">
            <div className="flex items-center gap-1">
              <span className="text-vcamp-muted mr-1">Playback:</span>
              {(['auto', 'loop', 'once'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setLoopOverride(m)}
                  className={`px-2 py-0.5 rounded border capitalize font-medium ${
                    loopOverride === m
                      ? 'bg-vcamp-secondary border-vcamp-primary text-vcamp-primary'
                      : 'bg-white border-vcamp-border text-vcamp-muted hover:text-vcamp-text'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-vcamp-muted">
              LISTEN / THINK safely fall back to IDLE
            </span>
          </div>

          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1" data-testid="studio-animation-list">
            {actionRows.map((desc) => {
              const isPlayingThis = animState.activeState === desc.state;
              const isSelected = selectedAction === desc.state;
              const isAvailable = desc.status === 'valid';

              return (
                <div
                  key={desc.state}
                  data-testid={`anim-row-${desc.state}`}
                  onClick={() => isAvailable && handlePlayAction(desc.state)}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    !isAvailable
                      ? 'bg-slate-50 border-vcamp-border opacity-60 cursor-not-allowed'
                      : isPlayingThis
                      ? 'bg-vcamp-secondary border-vcamp-primary cursor-pointer'
                      : isSelected
                      ? 'bg-slate-50 border-blue-300 cursor-pointer'
                      : 'bg-white border-vcamp-border hover:border-blue-300 cursor-pointer'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-vcamp-text">{desc.state}</span>
                      <span className="text-[10px] text-vcamp-muted">({desc.expectedAction})</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-vcamp-text font-mono">
                        {desc.mode}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-vcamp-secondary text-vcamp-primary font-mono">
                        P{desc.priority}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-vcamp-muted mt-0.5">
                      <span className="text-vcamp-primary font-mono truncate">
                        Clip: {desc.clipName || 'None'}
                      </span>
                      {desc.duration > 0 && <span>• {desc.duration.toFixed(2)}s</span>}
                      <span className="truncate">• {desc.fileName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {desc.status === 'valid' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-vcamp-success border border-emerald-200 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Valid
                      </span>
                    ) : desc.status === 'loading' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-vcamp-secondary text-vcamp-primary border border-blue-200 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading
                      </span>
                    ) : (
                      <span
                        title={desc.error || desc.status}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-vcamp-error border border-red-200 flex items-center gap-1 capitalize"
                      >
                        <XCircle className="w-3 h-3" />
                        {desc.status}
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={!isAvailable}
                      data-testid={`play-anim-${desc.state}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAvailable) handlePlayAction(desc.state);
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        !isAvailable
                          ? 'bg-slate-100 border-vcamp-border text-slate-400 cursor-not-allowed'
                          : isPlayingThis
                          ? 'bg-vcamp-primary text-white border-vcamp-primary'
                          : 'bg-white hover:bg-vcamp-secondary border-vcamp-border text-vcamp-primary'
                      }`}
                      title={isAvailable ? `Play ${desc.state}` : desc.error || 'Unavailable'}
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
