import React, { useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { CompanionModel } from './CompanionModel';
import { GlbCharacterModel } from './GlbCharacterModel';
import { useCompanionStore } from '../stores/companionStore';
import { desktopMovementService } from '../services/desktopMovementService';

interface CompanionSceneProps {
  onRobotClick?: () => void;
}

export const CompanionScene: React.FC<CompanionSceneProps> = ({ onRobotClick }) => {
  const {
    state,
    setState,
    isChatOpen,
    setIsChatOpen,
    isSleeping,
    setIsSleeping,
    triggerAction,
    selectedCharacterId,
    characterLoadStatus,
  } = useCompanionStore();
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; time: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Interruption: Clicking or pressing down on the companion immediately halts any autonomous movement
    desktopMovementService.stopMovement();

    dragRef.current = {
      startX: e.screenX,
      startY: e.screenY,
      time: Date.now(),
    };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setPointer({ x, y });

    // Distinguish Drag from Click: If held and moved > 4 pixels, initiate native Windows OS window dragging
    if (dragRef.current && e.buttons === 1) {
      const dist = Math.hypot(e.screenX - dragRef.current.startX, e.screenY - dragRef.current.startY);
      if (dist > 4) {
        desktopMovementService.startDrag();
        dragRef.current = null;
      }
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      const dt = Date.now() - dragRef.current.time;
      const dist = Math.hypot(e.screenX - dragRef.current.startX, e.screenY - dragRef.current.startY);
      dragRef.current = null;

      // Quick tap / click without drag movement
      if (dist < 6 && dt < 350) {
        if (onRobotClick) {
          onRobotClick();
        } else if (isSleeping) {
          setIsSleeping(false);
          triggerAction('greet', 2000);
        } else {
          setIsChatOpen(!isChatOpen);
        }
      }
    }
  }, [onRobotClick, isSleeping, setIsSleeping, triggerAction, isChatOpen, setIsChatOpen]);

  const handlePointerEnter = useCallback(() => {
    if (state === 'idle') {
      setState('hover');
    }
  }, [state, setState]);

  const handlePointerLeave = useCallback(() => {
    if (state === 'hover') {
      setState('idle');
    }
    dragRef.current = null;
  }, [state, setState]);

  const isGlbCharacter = selectedCharacterId !== 'vcamp_robot';

  return (
    <div
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      title="VCamp 3D Companion • Click to talk • Click and drag anywhere on desktop"
    >
      {isGlbCharacter && characterLoadStatus === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="px-2.5 py-1 rounded-full bg-slate-950/85 border border-cyan-500/40 text-[10px] text-cyan-300 animate-pulse">
            Loading 3D Character...
          </div>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 4.0], fov: 40, near: 0.1, far: 50 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        style={{ background: 'transparent' }}
      >
        {/* Studio & Natural Humanoid Lighting */}
        <ambientLight intensity={isGlbCharacter ? 0.95 : 0.75} />
        <hemisphereLight args={['#e2e8f0', '#1e293b', isGlbCharacter ? 0.85 : 0.3]} />
        <directionalLight position={[3, 4, 4]} intensity={isGlbCharacter ? 1.65 : 1.5} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.65} color="#00f2fe" />
        <pointLight position={[0, -1, 1]} intensity={0.6} color="#06b6d4" />

        {/* Active 3D Companion Character */}
        {isGlbCharacter ? (
          <GlbCharacterModel characterId={selectedCharacterId} enableDesktopTransform />
        ) : (
          <CompanionModel pointerPosition={pointer} />
        )}
      </Canvas>
    </div>
  );
};
