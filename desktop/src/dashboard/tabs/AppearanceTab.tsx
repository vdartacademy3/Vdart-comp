import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Footprints, 
  Zap, 
  Smile, 
  Moon, 
  ArrowRight, 
  Compass, 
  Activity, 
  Maximize2, 
  Sliders,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  MousePointer,
  RotateCw,
  Layers,
  Monitor,
  Gauge
} from 'lucide-react';
import { 
  useCompanionStore, 
  RobotSize, 
  CompanionAction 
} from '../../stores/companionStore';
import { 
  desktopMovementService, 
  MovementMode, 
  MovementSpeed, 
  BoundaryMode 
} from '../../services/desktopMovementService';

export const AppearanceTab: React.FC = () => {
  const { 
    robotSize, 
    setRobotSize, 
    state, 
    currentAction, 
    triggerAction, 
    isSleeping, 
    setIsSleeping,
    currentEmotion,
    setEmotion,
    robotZ,
    setRobotZ,
    isHovering,
    setIsHovering
  } = useCompanionStore();

  const [activeMode, setActiveMode] = useState<MovementMode>('idle');
  const [currentPos, setCurrentPos] = useState({ x: 24, y: 700 });
  const [currentDir, setCurrentDir] = useState(1);
  const [speedSetting, setSpeedSetting] = useState<MovementSpeed>(desktopMovementService.getSpeed());
  const [boundaryMode, setBoundaryMode] = useState<BoundaryMode>(desktopMovementService.getBoundaryMode());
  const [customSpeed, setCustomSpeed] = useState<number>(desktopMovementService.getEffectiveSpeedPx());
  const [virtualBounds, setVirtualBounds] = useState<any>(null);

  useEffect(() => {
    const unsub = desktopMovementService.subscribe((mode, pos, dir) => {
      setActiveMode(mode);
      setCurrentPos(pos);
      setCurrentDir(dir);
    });

    desktopMovementService.getVirtualDesktopBounds().then((b) => {
      if (b) setVirtualBounds(b);
    });

    return unsub;
  }, []);

  const handleSizeChange = (newSize: RobotSize) => {
    setRobotSize(newSize);
  };

  const handleSpeedChange = (spd: MovementSpeed) => {
    setSpeedSetting(spd);
    desktopMovementService.setSpeed(spd);
  };

  const handleCustomSpeedChange = (val: number) => {
    setCustomSpeed(val);
    desktopMovementService.setCustomSpeed(val);
  };

  const handleBoundaryChange = (b: BoundaryMode) => {
    setBoundaryMode(b);
    desktopMovementService.setBoundaryMode(b);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-cyan-300 mb-1 flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          Robot Appearance, 3D Kinematics & Movement Engine
        </h3>
        <p className="text-xs text-slate-400">
          Configure physical desktop size, 3D XYZ depth perspective, and native Windows desktop movement trajectories.
        </p>
      </div>

      {/* Module 1: Robot Size Selector */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Maximize2 className="w-4 h-4 text-cyan-400" />
            Desktop Companion Display Size
          </h4>
          <span className="text-[11px] text-cyan-400">Target ~30–35% size reduction applied</span>
        </div>

        <p className="text-xs text-slate-400">
          Select the physical footprint of VCamp on your desktop. Sizing smoothly scales the 3D model, viewport, and native desktop window bounds without cropping.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'small' as RobotSize,
              name: 'Small (Ultra-Compact)',
              heightTarget: '~155px on 1080p',
              desc: 'Subtle corner companion for minimal screen space disruption.',
            },
            {
              id: 'medium' as RobotSize,
              name: 'Medium (Default Reduced)',
              heightTarget: '~188px on 1080p',
              desc: 'Balanced production scale with 35% height reduction and full articulation.',
              recommended: true,
            },
            {
              id: 'large' as RobotSize,
              name: 'Large (Presentation)',
              heightTarget: '~245px on 1080p',
              desc: 'High visibility mode for detailed 3D inspection and demonstrations.',
            },
          ].map((preset) => {
            const isSelected = robotSize === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSizeChange(preset.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                    {preset.name}
                  </span>
                  {preset.recommended && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      Default
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-cyan-400 font-mono block mb-1">
                  {preset.heightTarget}
                </span>
                <p className="text-[11px] text-slate-400">{preset.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module 2: 3D XYZ Depth & Kinematics Control */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            3D Z-Depth Transformation & Focal Perspective
          </h4>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/30">
            Z: {robotZ.toFixed(2)}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Controls the 3D model's depth coordinate inside the Three.js viewport. Moving along the Z-axis dynamically adjusts optical perspective scaling and lighting attenuation.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 w-28 shrink-0">Depth (Foreground / Background):</span>
            <input 
              type="range" 
              min="-2.0" 
              max="1.0" 
              step="0.05"
              value={robotZ} 
              onChange={(e) => setRobotZ(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400 cursor-pointer"
            />
            <div className="flex gap-1 shrink-0">
              <button 
                onClick={() => setRobotZ(-1.2)}
                className="px-2 py-1 text-[10px] rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
              >
                Deep (-1.2)
              </button>
              <button 
                onClick={() => setRobotZ(0.0)}
                className="px-2 py-1 text-[10px] rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
              >
                Normal (0.0)
              </button>
              <button 
                onClick={() => setRobotZ(0.6)}
                className="px-2 py-1 text-[10px] rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
              >
                Popout (+0.6)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setIsHovering(!isHovering)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                isHovering 
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-300' 
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isHovering ? 'Disable Floating / Hover' : 'Enable Floating / Hover Levitation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Module 3: Real Windows Desktop Movement Controller */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Move className="w-4 h-4 text-cyan-400" />
            Native Windows Desktop Movement Controller
          </h4>
          <span className="text-[11px] text-emerald-400 font-mono">
            Pos: ({currentPos.x}, {currentPos.y}) • Mode: {activeMode}
          </span>
        </div>

        {/* Boundary & Speed Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-cyan-500/10">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              Desktop Bounds & Multi-Monitor Mode:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleBoundaryChange('current_monitor')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  boundaryMode === 'current_monitor'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Current Display Only
              </button>
              <button
                onClick={() => handleBoundaryChange('entire_desktop')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  boundaryMode === 'entire_desktop'
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                All Displays ({virtualBounds?.monitor_count || 1})
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              Movement Speed Preset:
            </label>
            <div className="flex gap-1.5">
              {(['slow', 'normal', 'fast'] as MovementSpeed[]).map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs capitalize font-medium border transition-colors ${
                    speedSetting === spd
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directional Pad & Primary Trajectory Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Directional Cross */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Directional Navigation
            </span>
            <div className="grid grid-cols-3 gap-2 w-44">
              <div />
              <button
                onClick={() => desktopMovementService.walkUp()}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-cyan-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 flex items-center justify-center transition-colors"
                title="Walk Upward"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div />

              <button
                onClick={() => desktopMovementService.walkLeft()}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-cyan-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 flex items-center justify-center transition-colors"
                title="Walk Left"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => desktopMovementService.stopMovement()}
                className="p-2.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-300 flex items-center justify-center transition-colors font-bold text-xs"
                title="Stop Movement"
              >
                STOP
              </button>
              <button
                onClick={() => desktopMovementService.walkRight()}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-cyan-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 flex items-center justify-center transition-colors"
                title="Walk Right"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div />
              <button
                onClick={() => desktopMovementService.walkDown()}
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-cyan-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 flex items-center justify-center transition-colors"
                title="Walk Downward"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <div />
            </div>
          </div>

          {/* Autonomous Trajectories & Kinematics */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Autonomous Trajectories & Actions
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => desktopMovementService.startRun()}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 hover:bg-amber-950 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-300 text-xs transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Sprint / Run</span>
              </button>

              <button
                onClick={() => desktopMovementService.startJump(90, 650)}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 text-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Physics Jump Arc</span>
              </button>

              <button
                onClick={() => desktopMovementService.startWander()}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 hover:bg-teal-950 border border-slate-700 hover:border-teal-400 text-slate-200 hover:text-teal-300 text-xs transition-colors"
              >
                <Footprints className="w-3.5 h-3.5 text-teal-400" />
                <span>Autonomous Wander</span>
              </button>

              <button
                onClick={() => desktopMovementService.startFollowCursor(140)}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 hover:bg-purple-950 border border-slate-700 hover:border-purple-400 text-slate-200 hover:text-purple-300 text-xs transition-colors"
              >
                <MousePointer className="w-3.5 h-3.5 text-purple-400" />
                <span>Follow Mouse Cursor</span>
              </button>

              <button
                onClick={() => desktopMovementService.startCircle(80, 2400)}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 text-xs transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Circular Orbit</span>
              </button>

              <button
                onClick={() => desktopMovementService.returnToHome()}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-400 text-slate-200 hover:text-emerald-300 text-xs transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>Return to Home (Corner)</span>
              </button>
            </div>

            {/* Edge Docking Quick Actions */}
            <div className="pt-3 border-t border-slate-800/80 mt-2">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                Quick Screen Edge Docking:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Top-Left', edge: 'top_left' as const },
                  { label: 'Top-Right', edge: 'top_right' as const },
                  { label: 'Center', edge: 'center' as const },
                  { label: 'Bottom-Left', edge: 'bottom_left' as const },
                  { label: 'Bottom-Right', edge: 'bottom_right' as const },
                ].map((pos) => (
                  <button
                    key={pos.edge}
                    onClick={() => desktopMovementService.moveToEdge(pos.edge)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:text-white transition-colors"
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module 4: Central State Controller Monitor */}
      <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-cyan-400" />
          Central Robot State Machine & Emotions
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Companion State</span>
            <span className="text-lg font-bold text-cyan-300 uppercase font-mono">{state}</span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Procedural Action</span>
            <span className="text-lg font-bold text-teal-300 capitalize font-mono">{currentAction || 'idle'}</span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Emotional Glow</span>
            <span className="text-lg font-bold text-amber-300 capitalize font-mono">{currentEmotion || 'neutral'}</span>
          </div>
        </div>

        {/* Emotion Override Triggers */}
        <div className="pt-2">
          <span className="text-xs font-semibold text-slate-300 block mb-2">Test Emotional Facial Displays:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'happy', 'excited', 'curious', 'empathetic', 'confused', 
              'calm', 'anxious', 'stressed', 'tired', 'sad', 'neutral'
            ].map((em) => (
              <button
                key={em}
                onClick={() => setEmotion(em as any, 4000)}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white capitalize text-[11px] transition-colors"
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
