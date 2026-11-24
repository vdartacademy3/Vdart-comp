import React, { useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { CompanionModel } from './CompanionModel';
import { useCompanionStore } from '../stores/companionStore';
import { desktopMovementService } from '../services/desktopMovementService';

interface CompanionSceneProps {
  onRobotClick?: () => void;
}

export const CompanionScene: React.FC<CompanionSceneProps> = ({ onRobotClick }) => {
  const { state, setState, isChatOpen, setIsChatOpen, isSleeping, setIsSleeping, triggerAction } = useCompanionStore();
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; time: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Interruption: Clicking or pressing down on the robot immediately halts any autonomous movement
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
        {/* Cinematic Studio Lighting */}
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 4, 4]} intensity={1.5} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.6} color="#00f2fe" />
        <pointLight position={[0, -1, 1]} intensity={0.8} color="#06b6d4" />

        {/* 3D Robot Character */}
        <CompanionModel pointerPosition={pointer} />
      </Canvas>
    </div>
  );
};
