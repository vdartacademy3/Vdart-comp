import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCompanionStore, CompanionState, CompanionAction, RobotEmotion } from '../stores/companionStore';
import { desktopMovementService } from '../services/desktopMovementService';

interface CompanionModelProps {
  pointerPosition?: { x: number; y: number };
}

// 25-Emotion Dynamic Color & Intensity Map
const EMOTION_GLOW_THEMES: Record<RobotEmotion, { color: string; pulseSpeed: number; baseIntensity: number }> = {
  // Positive
  happy: { color: '#00f2fe', pulseSpeed: 4.0, baseIntensity: 2.2 },
  excited: { color: '#38bdf8', pulseSpeed: 7.0, baseIntensity: 2.8 },
  cheerful: { color: '#06b6d4', pulseSpeed: 4.5, baseIntensity: 2.3 },
  proud: { color: '#22d3ee', pulseSpeed: 3.0, baseIntensity: 2.2 },
  curious: { color: '#38bdf8', pulseSpeed: 4.2, baseIntensity: 2.1 },
  playful: { color: '#00f2fe', pulseSpeed: 6.5, baseIntensity: 2.5 },
  grateful: { color: '#34d399', pulseSpeed: 3.2, baseIntensity: 2.2 },
  encouraging: { color: '#10b981', pulseSpeed: 3.8, baseIntensity: 2.3 },

  // Supportive
  empathetic: { color: '#2dd4bf', pulseSpeed: 2.2, baseIntensity: 1.9 },
  concerned: { color: '#f43f5e', pulseSpeed: 3.5, baseIntensity: 2.0 },
  calm: { color: '#0ea5e9', pulseSpeed: 1.5, baseIntensity: 1.7 },
  gentle: { color: '#a7f3d0', pulseSpeed: 1.8, baseIntensity: 1.7 },
  reassuring: { color: '#38bdf8', pulseSpeed: 2.5, baseIntensity: 2.0 },
  attentive: { color: '#00f2fe', pulseSpeed: 5.0, baseIntensity: 2.5 },

  // Neutral and cognitive
  neutral: { color: '#00f2fe', pulseSpeed: 2.0, baseIntensity: 1.8 },
  thinking: { color: '#a855f7', pulseSpeed: 8.0, baseIntensity: 2.5 },
  listening: { color: '#00f2fe', pulseSpeed: 5.0, baseIntensity: 2.4 },
  confused: { color: '#f59e0b', pulseSpeed: 4.0, baseIntensity: 2.1 },
  surprised: { color: '#38bdf8', pulseSpeed: 6.0, baseIntensity: 2.6 },
  focused: { color: '#0284c7', pulseSpeed: 2.2, baseIntensity: 1.9 },

  // Low-energy
  sleepy: { color: '#818cf8', pulseSpeed: 1.2, baseIntensity: 1.1 },
  tired: { color: '#94a3b8', pulseSpeed: 1.0, baseIntensity: 0.9 },
  resting: { color: '#6366f1', pulseSpeed: 0.8, baseIntensity: 0.8 },
  relaxed: { color: '#38bdf8', pulseSpeed: 1.4, baseIntensity: 1.4 },

  // Negative conversational states
  frustrated: { color: '#f97316', pulseSpeed: 6.0, baseIntensity: 2.3 },
  disappointed: { color: '#64748b', pulseSpeed: 1.5, baseIntensity: 1.2 },
  sad: { color: '#3b82f6', pulseSpeed: 1.4, baseIntensity: 1.3 },
  anxious: { color: '#f59e0b', pulseSpeed: 5.5, baseIntensity: 2.2 },
  stressed: { color: '#ef4444', pulseSpeed: 6.5, baseIntensity: 2.4 },
  ambiguous: { color: '#64748b', pulseSpeed: 2.0, baseIntensity: 1.5 },
};

export const CompanionModel: React.FC<CompanionModelProps> = ({ pointerPosition = { x: 0, y: 0 } }) => {
  const { state, currentAction, currentEmotion, isSpeaking, isRecording, robotZ, jumpState, movementDirection, isHovering } = useCompanionStore();

  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftEyebrowRef = useRef<THREE.Mesh>(null);
  const rightEyebrowRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const foreheadVRef = useRef<THREE.Mesh>(null);
  const chestVRef = useRef<THREE.Mesh>(null);
  const chestLightRef = useRef<THREE.PointLight>(null);
  const foreheadLightRef = useRef<THREE.PointLight>(null);
  const bodyRef = useRef<THREE.Group>(null);

  // Articulated Arms & Hands
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftShoulderRef = useRef<THREE.Group>(null);
  const rightShoulderRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);

  // Articulated Legs References
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftKneeRef = useRef<THREE.Group>(null);
  const rightKneeRef = useRef<THREE.Group>(null);
  const sleepZsRef = useRef<THREE.Group>(null);

  // Neck Hydraulic Tendon Cylinders
  const neckPistonLeftRef = useRef<THREE.Mesh>(null);
  const neckPistonRightRef = useRef<THREE.Mesh>(null);

  // Blinking cycle state (pseudo-random human-like blinking)
  const blinkStateRef = useRef<{ nextBlinkTime: number; isBlinking: boolean; blinkStart: number }>({
    nextBlinkTime: 2.0,
    isBlinking: false,
    blinkStart: 0,
  });

  // Premium PBR Materials for Futuristic Armor
  const materials = useMemo(() => {
    return {
      whiteArmor: new THREE.MeshPhysicalMaterial({
        color: '#f8fafc',
        metalness: 0.15,
        roughness: 0.12,
        clearcoat: 0.9,
        clearcoatRoughness: 0.06,
        reflectivity: 0.92,
      }),
      darkMetallic: new THREE.MeshStandardMaterial({
        color: '#070d18',
        metalness: 0.95,
        roughness: 0.18,
      }),
      silverJoint: new THREE.MeshStandardMaterial({
        color: '#d1d5db',
        metalness: 0.98,
        roughness: 0.1,
      }),
      cyanGlow: new THREE.MeshStandardMaterial({
        color: '#00f2fe',
        emissive: '#00f2fe',
        emissiveIntensity: 2.2,
        toneMapped: false,
      }),
      cyanAccent: new THREE.MeshStandardMaterial({
        color: '#06b6d4',
        emissive: '#0891b2',
        emissiveIntensity: 0.8,
        metalness: 0.65,
        roughness: 0.16,
      }),
      visorScreen: new THREE.MeshPhysicalMaterial({
        color: '#010409',
        metalness: 0.95,
        roughness: 0.03,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        ior: 1.52,
      }),
    };
  }, []);

  // Forehead & Chest Glowing V Emblem Geometry
  const vShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.16, 0.2);
    shape.lineTo(-0.06, 0.2);
    shape.lineTo(0, -0.08);
    shape.lineTo(0.06, 0.2);
    shape.lineTo(0.16, 0.2);
    shape.lineTo(0.04, -0.2);
    shape.lineTo(-0.04, -0.2);
    shape.closePath();

    const extrudeSettings = {
      depth: 0.05,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  // Frame animation loop with human-like expressions and physical kinematics
  useFrame((stateContext) => {
    const time = stateContext.clock.getElapsedTime();
    if (!groupRef.current) return;

    // Effective active state & active emotion
    const action: CompanionAction | string = isRecording 
      ? 'listen' 
      : isSpeaking 
      ? 'speak' 
      : currentAction || state;

    const emotion: RobotEmotion = currentEmotion || 'neutral';
    const emotionTheme = EMOTION_GLOW_THEMES[emotion] || EMOTION_GLOW_THEMES.neutral;

    // Target poses for smooth procedural transitions
    let targetPosY = -0.25;
    let targetRotX = 0;
    let targetRotY = 0;
    let targetRotZ = 0;

    let targetLeftArmRotX = 0;
    let targetLeftArmRotY = 0;
    let targetLeftArmRotZ = -0.14;
    let targetRightArmRotX = 0;
    let targetRightArmRotY = 0;
    let targetRightArmRotZ = 0.14;

    let targetLeftForearmRotX = 0.1;
    let targetRightForearmRotX = 0.1;

    let targetLeftLegRotX = 0;
    let targetRightLegRotX = 0;
    let targetLeftKneeRotX = 0;
    let targetRightKneeRotX = 0;

    // Eye, eyebrow and facial expression targets
    let targetLeftEyeScaleX = 1.0;
    let targetLeftEyeScaleY = 1.0;
    let targetRightEyeScaleX = 1.0;
    let targetRightEyeScaleY = 1.0;
    let targetEyeRotZ = 0;

    let targetLeftEyebrowY = 0.13;
    let targetRightEyebrowY = 0.13;
    let targetLeftEyebrowRotZ = 0;
    let targetRightEyebrowRotZ = 0;

    let mouthScaleY = 0.25;
    let mouthScaleX = 1.0;

    // Pulse & glow intensity
    const vLogoPulse = emotionTheme.baseIntensity + Math.sin(time * emotionTheme.pulseSpeed) * 0.45;

    // Natural human-like idle breathing (dual harmonic chest elevation & expansion)
    const breathHarmonic = Math.sin(time * 1.8);
    const microSaccadeY = Math.cos(time * 0.75) * 0.025;
    const microSaccadeX = Math.sin(time * 0.95) * 0.02;

    // ==============================================================
    // 1. BASE ACTION POSES
    // ==============================================================
    if (action === 'idle') {
      targetPosY = -0.25 + breathHarmonic * 0.022;

      // Natural cursor gaze tracking (clamped to realistic anatomical neck limits)
      if (pointerPosition) {
        targetRotY = THREE.MathUtils.clamp(pointerPosition.x * 0.38, -0.42, 0.42) + microSaccadeY;
        targetRotX = THREE.MathUtils.clamp(-pointerPosition.y * 0.28, -0.26, 0.26) + microSaccadeX;
      } else {
        targetRotX = Math.sin(time * 1.4) * 0.03 + microSaccadeX;
        targetRotY = Math.cos(time * 0.9) * 0.04 + microSaccadeY;
      }

      targetLeftArmRotZ = -0.14 + breathHarmonic * 0.02;
      targetRightArmRotZ = 0.14 - breathHarmonic * 0.02;
    }
    // FLOATING / HOVERING MODE
    else if (action === 'hover' || isHovering) {
      const floatBob = Math.sin(time * 2.8) * 0.045;
      targetPosY = -0.25 + floatBob;
      targetLeftLegRotX = 0.18;
      targetRightLegRotX = 0.18;
      targetLeftKneeRotX = 0.12;
      targetRightKneeRotX = 0.12;
      targetLeftArmRotZ = -0.28 + Math.cos(time * 2.2) * 0.05;
      targetRightArmRotZ = 0.28 - Math.cos(time * 2.2) * 0.05;
      targetRotZ = Math.sin(time * 1.6) * 0.04;
    }
    // JUMP KINEMATICS (3D Squash, Stretch & Landing Impact)
    else if (action === 'jump' || jumpState.isJumping) {
      const p = jumpState.progress > 0 ? jumpState.progress : (Math.sin(time * 5.0) * 0.5 + 0.5);
      
      if (p < 0.45) {
        // Ascent: Tuck knees, aerodynamic forward tilt, arms raised
        targetLeftLegRotX = -0.32;
        targetRightLegRotX = -0.32;
        targetLeftKneeRotX = 0.72;
        targetRightKneeRotX = 0.72;
        targetLeftArmRotZ = -0.65;
        targetRightArmRotZ = 0.65;
        targetRotX = 0.14;
      } else if (p < 0.70) {
        // Apex: Body extension, triumphant reach
        targetLeftLegRotX = 0.12;
        targetRightLegRotX = 0.12;
        targetLeftKneeRotX = 0.15;
        targetRightKneeRotX = 0.15;
        targetLeftArmRotZ = -0.85;
        targetRightArmRotZ = 0.85;
        targetRotX = -0.06;
      } else {
        // Landing: Knees bend to absorb impact (squash)
        targetLeftKneeRotX = 0.58;
        targetRightKneeRotX = 0.58;
        targetLeftArmRotZ = -0.22;
        targetRightArmRotZ = 0.22;
        targetRotX = 0.18;
      }
    }
    // WALKING / WANDERING
    else if (action === 'walk' || action === 'wander') {
      const walkFreq = 5.5;
      const legStride = Math.sin(time * walkFreq);
      const walkBob = Math.abs(Math.sin(time * walkFreq)) * 0.032;
      targetPosY = -0.25 + walkBob;

      targetLeftLegRotX = legStride * 0.48;
      targetRightLegRotX = -legStride * 0.48;
      targetLeftKneeRotX = Math.max(0, -legStride) * 0.5;
      targetRightKneeRotX = Math.max(0, legStride) * 0.5;

      targetLeftArmRotX = -legStride * 0.42;
      targetRightArmRotX = legStride * 0.42;
      targetLeftArmRotZ = -0.18;
      targetRightArmRotZ = 0.18;

      targetRotZ = Math.sin(time * walkFreq) * 0.04;
      targetRotX = 0.06;
    }
    // RUNNING (Desktop sprint)
    else if (action === 'run') {
      const runFreq = 11.0;
      const legStride = Math.sin(time * runFreq);
      const runBob = Math.abs(Math.sin(time * runFreq)) * 0.065;
      targetPosY = -0.25 + runBob;

      targetLeftLegRotX = legStride * 0.88;
      targetRightLegRotX = -legStride * 0.88;
      targetLeftKneeRotX = Math.max(0, -legStride) * 0.92;
      targetRightKneeRotX = Math.max(0, legStride) * 0.92;

      targetLeftArmRotX = -legStride * 0.82;
      targetRightArmRotX = legStride * 0.82;
      targetLeftArmRotZ = -0.32;
      targetRightArmRotZ = 0.32;

      targetRotX = 0.22; // Aerodynamic forward lean
      targetRotZ = Math.sin(time * runFreq) * 0.08;
    }
    // GREETING / ATTENTIVE WAVE (Friendly wave when alert or greet)
    else if (action === 'greet' || emotion === 'attentive') {
      targetRotY = -0.14;
      targetRotX = 0.08;
      // Right arm raises and waves hand
      targetRightArmRotZ = 1.35;
      targetRightArmRotX = Math.sin(time * 8.5) * 0.35 - 0.2;
      targetRightForearmRotX = 0.45;
      targetLeftArmRotZ = -0.15;
    }
    // PLAYFUL HOP
    else if (action === 'play') {
      const hop = Math.abs(Math.sin(time * 5.2)) * 0.12;
      targetPosY = -0.25 + hop;
      targetRotZ = Math.sin(time * 4.2) * 0.14;
      targetLeftArmRotZ = -0.55;
      targetRightArmRotZ = 0.55;
    }
    // SLEEP MODE
    else if (action === 'sleep') {
      targetPosY = -0.28 + Math.sin(time * 0.9) * 0.01;
      targetRotX = 0.24; // Head gently drooped
      targetRotZ = 0.08;
      targetLeftArmRotZ = -0.06;
      targetRightArmRotZ = 0.06;
      targetLeftEyeScaleY = 0.1;
      targetRightEyeScaleY = 0.1;
      mouthScaleY = 0.08;
    }

    // SPEAKING / CONVERSING: Phonetic mouth flutter and conversational gestures
    if (isSpeaking || action === 'speak') {
      mouthScaleY = 0.35 + Math.abs(Math.sin(time * 14.0)) * 0.65;
      mouthScaleX = 0.95 + Math.cos(time * 9.0) * 0.2;
      targetRightArmRotZ = 0.35 + Math.sin(time * 3.8) * 0.18;
      targetLeftArmRotZ = -0.35 - Math.cos(time * 3.4) * 0.16;
    }

    // LISTENING / RECORDING: Attentive head tilt
    if (isRecording || action === 'listen') {
      targetRotZ = 0.18;
      targetRotX = 0.1;
      targetLeftEyeScaleY = 1.25;
      targetRightEyeScaleY = 1.25;
      targetLeftEyebrowY = 0.15;
      targetRightEyebrowY = 0.15;
    }

    // ==============================================================
    // 2. 25 EMOTIONAL STATE EXPRESSIONS & EYEBROWS
    // ==============================================================
    if (action !== 'sleep') {
      switch (emotion) {
        // POSITIVE
        case 'happy':
        case 'cheerful':
          targetLeftEyeScaleY = 0.75;
          targetRightEyeScaleY = 0.75;
          targetEyeRotZ = -0.15;
          targetLeftEyebrowY = 0.15;
          targetRightEyebrowY = 0.15;
          mouthScaleY = 0.45;
          break;

        case 'excited':
        case 'playful':
          targetLeftEyeScaleY = 1.35;
          targetRightEyeScaleY = 1.35;
          targetLeftEyeScaleX = 1.2;
          targetRightEyeScaleX = 1.2;
          targetLeftEyebrowY = 0.16;
          targetRightEyebrowY = 0.16;
          mouthScaleY = 0.55;
          break;

        case 'proud':
        case 'encouraging':
          targetRotX = -0.08;
          targetLeftEyeScaleY = 0.85;
          targetRightEyeScaleY = 0.85;
          mouthScaleY = 0.35;
          break;

        case 'curious':
          targetRotZ = 0.22;
          targetLeftEyeScaleY = 1.28;
          targetRightEyeScaleY = 0.9;
          targetLeftEyebrowY = 0.16;
          targetRightEyebrowY = 0.12;
          break;

        // SUPPORTIVE
        case 'empathetic':
        case 'gentle':
          targetRotZ = 0.1;
          targetLeftEyeScaleY = 0.82;
          targetRightEyeScaleY = 0.82;
          targetLeftEyebrowRotZ = -0.12;
          targetRightEyebrowRotZ = 0.12;
          mouthScaleY = 0.28;
          break;

        case 'concerned':
          targetRotX = 0.12;
          targetLeftEyeScaleY = 0.75;
          targetRightEyeScaleY = 0.75;
          targetLeftEyebrowRotZ = -0.22;
          targetRightEyebrowRotZ = 0.22;
          break;

        case 'attentive':
          targetRotX = 0.16;
          targetLeftEyeScaleY = 1.3;
          targetRightEyeScaleY = 1.3;
          targetLeftEyebrowY = 0.16;
          targetRightEyebrowY = 0.16;
          break;

        // COGNITIVE
        case 'thinking':
          targetRotZ = -0.18;
          targetRotX = -0.1;
          targetLeftEyeScaleY = 0.65;
          targetRightEyeScaleY = 1.15;
          targetLeftEyebrowRotZ = 0.18;
          targetRightEyebrowRotZ = -0.12;
          mouthScaleY = 0.18;
          break;

        case 'confused':
          targetRotZ = 0.26;
          targetLeftEyeScaleY = 1.25;
          targetRightEyeScaleY = 0.7;
          targetLeftEyebrowRotZ = -0.25;
          targetRightEyebrowRotZ = 0.18;
          mouthScaleY = 0.18;
          break;

        case 'surprised':
          targetRotX = -0.16;
          targetLeftEyeScaleX = 1.45;
          targetLeftEyeScaleY = 1.45;
          targetRightEyeScaleX = 1.45;
          targetRightEyeScaleY = 1.45;
          targetLeftEyebrowY = 0.18;
          targetRightEyebrowY = 0.18;
          mouthScaleY = 0.6;
          mouthScaleX = 0.6;
          break;

        case 'focused':
          targetRotX = 0.08;
          targetLeftEyeScaleY = 0.85;
          targetRightEyeScaleY = 0.85;
          targetLeftEyeScaleX = 1.15;
          targetRightEyeScaleX = 1.15;
          targetLeftEyebrowRotZ = 0.16;
          targetRightEyebrowRotZ = -0.16;
          break;

        // LOW-ENERGY
        case 'sleepy':
        case 'tired':
          targetRotX = 0.15;
          targetLeftEyeScaleY = 0.22;
          targetRightEyeScaleY = 0.22;
          mouthScaleY = 0.15;
          break;

        // NEGATIVE CONVERSATIONAL
        case 'frustrated':
          targetRotZ = Math.sin(time * 7.5) * 0.045;
          targetLeftEyeScaleY = 0.55;
          targetRightEyeScaleY = 0.55;
          targetLeftEyebrowRotZ = 0.24;
          targetRightEyebrowRotZ = -0.24;
          mouthScaleY = 0.16;
          break;

        case 'disappointed':
        case 'sad':
          targetRotX = 0.18;
          targetRotZ = 0.06;
          targetLeftEyeScaleY = 0.58;
          targetRightEyeScaleY = 0.58;
          targetLeftEyebrowRotZ = -0.18;
          targetRightEyebrowRotZ = 0.18;
          mouthScaleY = 0.2;
          break;

        case 'anxious':
          targetRotZ = Math.sin(time * 10.0) * 0.03;
          targetLeftEyeScaleY = 1.15;
          targetRightEyeScaleY = 1.15;
          targetLeftEyebrowY = 0.16;
          targetRightEyebrowY = 0.16;
          targetLeftEyebrowRotZ = -0.15;
          targetRightEyebrowRotZ = 0.15;
          mouthScaleY = 0.2;
          break;

        case 'stressed':
          targetRotX = 0.12;
          targetLeftEyeScaleY = 0.65;
          targetRightEyeScaleY = 0.65;
          targetLeftEyebrowRotZ = 0.22;
          targetRightEyebrowRotZ = -0.22;
          mouthScaleY = 0.15;
          break;

        case 'calm':
          targetRotX = -0.02;
          targetLeftEyeScaleY = 0.82;
          targetRightEyeScaleY = 0.82;
          targetLeftEyebrowY = 0.13;
          targetRightEyebrowY = 0.13;
          mouthScaleY = 0.32;
          break;

        case 'ambiguous':
          targetRotZ = 0.16;
          targetLeftEyeScaleY = 1.05;
          targetRightEyeScaleY = 0.85;
          targetLeftEyebrowY = 0.15;
          targetRightEyebrowY = 0.12;
          mouthScaleY = 0.22;
          break;
      }
    }

    // ==============================================================
    // 3. NATURAL HUMAN-LIKE BLINKING SYSTEM
    // ==============================================================
    if (action !== 'sleep') {
      const now = time;
      if (!blinkStateRef.current.isBlinking && now >= blinkStateRef.current.nextBlinkTime) {
        blinkStateRef.current.isBlinking = true;
        blinkStateRef.current.blinkStart = now;
      }

      if (blinkStateRef.current.isBlinking) {
        const blinkDuration = 0.14; // 140ms natural eyelid blink
        const elapsed = now - blinkStateRef.current.blinkStart;
        if (elapsed < blinkDuration) {
          const blinkFactor = Math.sin((elapsed / blinkDuration) * Math.PI);
          targetLeftEyeScaleY *= (1.0 - blinkFactor * 0.94);
          targetRightEyeScaleY *= (1.0 - blinkFactor * 0.94);
        } else {
          blinkStateRef.current.isBlinking = false;
          // Random next blink interval between 2.8 and 5.2 seconds
          blinkStateRef.current.nextBlinkTime = now + 2.8 + Math.random() * 2.4;
        }
      }
    }

    // ==============================================================
    // 4. SMOOTH LERP INTERPOLATION (Zero Jerkiness & 3D Kinematics)
    // ==============================================================
    const lerpSpeed = 0.12;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetPosY, lerpSpeed);

    // 3D Depth Transformation (Z-Axis movement)
    const targetZ = robotZ || 0;
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, lerpSpeed);

    // Dynamic Depth Perspective Scaling: organic depth scaling simulates 3D camera focal distance
    const depthScale = Math.max(0.62, 1.0 + targetZ * 0.22);
    groupRef.current.scale.set(
      THREE.MathUtils.lerp(groupRef.current.scale.x, depthScale, lerpSpeed),
      THREE.MathUtils.lerp(groupRef.current.scale.y, depthScale, lerpSpeed),
      THREE.MathUtils.lerp(groupRef.current.scale.z, depthScale, lerpSpeed)
    );

    // Natural facing direction turn & lean when walking / running across screen
    const dir = movementDirection || desktopMovementService.getDirection();
    const isTranslating = action === 'walk' || action === 'run' || action === 'wander' || action === 'follow_cursor';
    const targetFacingY = isTranslating ? (dir > 0 ? 0.48 : -0.48) : 0;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetFacingY, lerpSpeed);

    const targetLeanZ = isTranslating ? (dir > 0 ? -0.05 : 0.05) : 0;
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetLeanZ, lerpSpeed);

    if (headRef.current) {
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetRotX, lerpSpeed);
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetRotY, lerpSpeed);
      headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, targetRotZ, lerpSpeed);
    }

    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, targetLeftArmRotX, lerpSpeed);
      leftArmRef.current.rotation.y = THREE.MathUtils.lerp(leftArmRef.current.rotation.y, targetLeftArmRotY, lerpSpeed);
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, targetLeftArmRotZ, lerpSpeed);
    }

    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, targetRightArmRotX, lerpSpeed);
      rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, targetRightArmRotY, lerpSpeed);
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetRightArmRotZ, lerpSpeed);
    }

    if (leftForearmRef.current) {
      leftForearmRef.current.rotation.x = THREE.MathUtils.lerp(leftForearmRef.current.rotation.x, targetLeftForearmRotX, lerpSpeed);
    }
    if (rightForearmRef.current) {
      rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(rightForearmRef.current.rotation.x, targetRightForearmRotX, lerpSpeed);
    }

    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, targetLeftLegRotX, lerpSpeed);
    }

    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, targetRightLegRotX, lerpSpeed);
    }

    if (leftKneeRef.current) {
      leftKneeRef.current.rotation.x = THREE.MathUtils.lerp(leftKneeRef.current.rotation.x, targetLeftKneeRotX, lerpSpeed);
    }

    if (rightKneeRef.current) {
      rightKneeRef.current.rotation.x = THREE.MathUtils.lerp(rightKneeRef.current.rotation.x, targetRightKneeRotX, lerpSpeed);
    }

    // Apply digital eye shapes and rotations
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.set(targetLeftEyeScaleX, targetLeftEyeScaleY, 1);
      rightEyeRef.current.scale.set(targetRightEyeScaleX, targetRightEyeScaleY, 1);
      leftEyeRef.current.rotation.z = targetEyeRotZ;
      rightEyeRef.current.rotation.z = -targetEyeRotZ;
    }

    // Apply dynamic eyebrows
    if (leftEyebrowRef.current && rightEyebrowRef.current) {
      leftEyebrowRef.current.position.y = THREE.MathUtils.lerp(leftEyebrowRef.current.position.y, targetLeftEyebrowY, lerpSpeed);
      rightEyebrowRef.current.position.y = THREE.MathUtils.lerp(rightEyebrowRef.current.position.y, targetRightEyebrowY, lerpSpeed);
      leftEyebrowRef.current.rotation.z = THREE.MathUtils.lerp(leftEyebrowRef.current.rotation.z, targetLeftEyebrowRotZ, lerpSpeed);
      rightEyebrowRef.current.rotation.z = THREE.MathUtils.lerp(rightEyebrowRef.current.rotation.z, targetRightEyebrowRotZ, lerpSpeed);
    }

    if (mouthRef.current) {
      mouthRef.current.scale.set(mouthScaleX, mouthScaleY, 1);
    }

    // Apply dynamic emotion aura lighting
    if (materials.cyanGlow) {
      const glowMat = materials.cyanGlow as THREE.MeshStandardMaterial;
      glowMat.color.set(emotionTheme.color);
      glowMat.emissive.set(emotionTheme.color);
      glowMat.emissiveIntensity = vLogoPulse;
    }

    if (chestLightRef.current) {
      chestLightRef.current.color.set(emotionTheme.color);
      chestLightRef.current.intensity = vLogoPulse * 0.85;
    }

    if (foreheadLightRef.current) {
      foreheadLightRef.current.color.set(emotionTheme.color);
      foreheadLightRef.current.intensity = vLogoPulse * 0.95;
    }

    // Animate sleep Zs drifting upward when sleeping
    if (sleepZsRef.current && action === 'sleep') {
      sleepZsRef.current.position.y = (time * 0.16) % 0.35;
      sleepZsRef.current.position.x = Math.sin(time * 1.6) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.25, 0]}>
      {/* ===================== HEAD ASSEMBLY ===================== */}
      <group ref={headRef} position={[0, 0.88, 0]}>
        {/* Cranial Helmet Base with Anatomical Jawline & Chin Contours */}
        <mesh material={materials.whiteArmor} castShadow receiveShadow>
          <sphereGeometry args={[0.54, 32, 32]} />
        </mesh>

        {/* Mandibular Jawline & Temples (Sculpted Dark Metallic Plating) */}
        <mesh position={[0, -0.16, 0.12]} material={materials.darkMetallic}>
          <boxGeometry args={[0.58, 0.22, 0.44]} />
        </mesh>
        {/* Sculpted Chin Guard */}
        <mesh position={[0, -0.28, 0.28]} material={materials.whiteArmor}>
          <boxGeometry args={[0.26, 0.1, 0.22]} />
        </mesh>

        {/* Crown Crest & Occipital Ridge */}
        <mesh position={[0, 0.26, -0.06]} material={materials.darkMetallic} castShadow>
          <boxGeometry args={[0.68, 0.32, 0.68]} />
        </mesh>

        {/* Curved Obsidian Glass Visor Screen */}
        <mesh position={[0, -0.02, 0.42]} material={materials.visorScreen}>
          <boxGeometry args={[0.7, 0.36, 0.22]} />
        </mesh>

        {/* Brow Ridge Indicators (Dynamic Eyebrow LED Arcs) */}
        <mesh ref={leftEyebrowRef} position={[-0.18, 0.13, 0.535]} material={materials.cyanGlow}>
          <boxGeometry args={[0.12, 0.015, 0.01]} />
        </mesh>
        <mesh ref={rightEyebrowRef} position={[0.18, 0.13, 0.535]} material={materials.cyanGlow}>
          <boxGeometry args={[0.12, 0.015, 0.01]} />
        </mesh>

        {/* Expressive Digital Eyes on Visor */}
        <mesh ref={leftEyeRef} position={[-0.18, 0.03, 0.54]} material={materials.cyanGlow}>
          <capsuleGeometry args={[0.045, 0.08, 8, 16]} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.18, 0.03, 0.54]} material={materials.cyanGlow}>
          <capsuleGeometry args={[0.045, 0.08, 8, 16]} />
        </mesh>

        {/* Digital Phonetic Mouth Display */}
        <mesh ref={mouthRef} position={[0, -0.12, 0.54]} material={materials.cyanGlow}>
          <capsuleGeometry args={[0.018, 0.16, 8, 16]} />
        </mesh>

        {/* Glowing Forehead 'V' Logo */}
        <group position={[0, 0.3, 0.44]} scale={[0.62, 0.62, 0.62]}>
          <mesh ref={foreheadVRef} geometry={vShape} material={materials.cyanGlow} />
          <pointLight ref={foreheadLightRef} color="#00f2fe" intensity={1.5} distance={1.2} />
        </group>

        {/* Audio Sensor Ear Cups with Dual Concentric Cyan Frequency Rings */}
        <group position={[-0.56, 0, 0]}>
          <mesh material={materials.darkMetallic}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 24]} />
          </mesh>
          <mesh position={[-0.04, 0, 0]} material={materials.cyanGlow}>
            <torusGeometry args={[0.08, 0.015, 12, 24]} />
          </mesh>
          <mesh position={[-0.04, 0, 0]} material={materials.cyanAccent}>
            <circleGeometry args={[0.045, 16]} />
          </mesh>
        </group>
        <group position={[0.56, 0, 0]}>
          <mesh material={materials.darkMetallic}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 24]} />
          </mesh>
          <mesh position={[0.04, 0, 0]} material={materials.cyanGlow}>
            <torusGeometry args={[0.08, 0.015, 12, 24]} />
          </mesh>
          <mesh position={[0.04, 0, 0]} material={materials.cyanAccent}>
            <circleGeometry args={[0.045, 16]} />
          </mesh>
        </group>
      </group>

      {/* Floating Sleep Zs */}
      <group ref={sleepZsRef} visible={currentAction === 'sleep' || state === 'sleep'}>
        <mesh position={[0.3, 1.48, 0.2]} material={materials.cyanGlow}>
          <sphereGeometry args={[0.035, 12, 12]} />
        </mesh>
        <mesh position={[0.42, 1.66, 0.15]} material={materials.cyanGlow}>
          <sphereGeometry args={[0.05, 12, 12]} />
        </mesh>
        <mesh position={[0.56, 1.86, 0.1]} material={materials.cyanGlow}>
          <sphereGeometry args={[0.065, 12, 12]} />
        </mesh>
      </group>

      {/* ===================== DOUBLE-RING ARTICULATED CERVICAL NECK ===================== */}
      <group position={[0, 0.44, 0]}>
        <mesh material={materials.silverJoint}>
          <cylinderGeometry args={[0.13, 0.17, 0.16, 24]} />
        </mesh>
        {/* Double Cervical Vertebrae Rings */}
        <mesh position={[0, 0.04, 0]} material={materials.darkMetallic}>
          <torusGeometry args={[0.15, 0.02, 16, 24]} />
        </mesh>
        <mesh position={[0, -0.04, 0]} material={materials.darkMetallic}>
          <torusGeometry args={[0.16, 0.02, 16, 24]} />
        </mesh>
        {/* Dual Lateral Hydraulic Tendon Cylinders */}
        <mesh ref={neckPistonLeftRef} position={[-0.14, 0, 0]} material={materials.silverJoint}>
          <cylinderGeometry args={[0.02, 0.02, 0.18, 12]} />
        </mesh>
        <mesh ref={neckPistonRightRef} position={[0.14, 0, 0]} material={materials.silverJoint}>
          <cylinderGeometry args={[0.02, 0.02, 0.18, 12]} />
        </mesh>
      </group>

      {/* ===================== TORSO, PECTORALS & SPINE ===================== */}
      <group ref={bodyRef} position={[0, 0, 0]}>
        {/* Clavicle Collar & Pectoral Armor Plates */}
        <mesh position={[0, 0.16, 0]} material={materials.whiteArmor} castShadow>
          <cylinderGeometry args={[0.39, 0.33, 0.5, 32]} />
        </mesh>

        {/* Left & Right Pectoral Armor Plates with Clavicle Line */}
        <mesh position={[-0.16, 0.22, 0.18]} rotation={[0.12, 0, 0]} material={materials.whiteArmor}>
          <boxGeometry args={[0.22, 0.16, 0.12]} />
        </mesh>
        <mesh position={[0.16, 0.22, 0.18]} rotation={[0.12, 0, 0]} material={materials.whiteArmor}>
          <boxGeometry args={[0.22, 0.16, 0.12]} />
        </mesh>

        {/* Dark Metallic Side Flank Panels */}
        <mesh position={[-0.27, 0.14, 0]} material={materials.darkMetallic}>
          <boxGeometry args={[0.15, 0.42, 0.32]} />
        </mesh>
        <mesh position={[0.27, 0.14, 0]} material={materials.darkMetallic}>
          <boxGeometry args={[0.15, 0.42, 0.32]} />
        </mesh>

        {/* Central Chest Reactor Emblem with Glowing VCamp Crest */}
        <mesh position={[0, 0.18, 0.31]} material={materials.darkMetallic}>
          <circleGeometry args={[0.15, 32]} />
        </mesh>
        <mesh position={[0, 0.18, 0.32]} material={materials.cyanAccent}>
          <ringGeometry args={[0.13, 0.15, 32]} />
        </mesh>
        <group position={[0, 0.18, 0.33]} scale={[0.42, 0.42, 0.42]}>
          <mesh ref={chestVRef} geometry={vShape} material={materials.cyanGlow} />
          <pointLight ref={chestLightRef} color="#00f2fe" intensity={1.2} distance={0.9} />
        </group>

        {/* Recessed Illuminated Cyan Dorsal Spine Vertebrae (Back) */}
        <mesh position={[0, 0.25, -0.22]} material={materials.cyanGlow}>
          <boxGeometry args={[0.04, 0.08, 0.03]} />
        </mesh>
        <mesh position={[0, 0.14, -0.22]} material={materials.cyanGlow}>
          <boxGeometry args={[0.04, 0.08, 0.03]} />
        </mesh>
        <mesh position={[0, 0.03, -0.21]} material={materials.cyanGlow}>
          <boxGeometry args={[0.04, 0.08, 0.03]} />
        </mesh>

        {/* Multi-Segment Abdominal Ball Vertebra & Waist Core */}
        <mesh position={[0, -0.12, 0.14]} material={materials.cyanAccent}>
          <boxGeometry args={[0.28, 0.025, 0.04]} />
        </mesh>
        <mesh position={[0, -0.22, 0]} material={materials.silverJoint}>
          <cylinderGeometry args={[0.21, 0.25, 0.22, 24]} />
        </mesh>
        {/* Abdominal Ball Joint */}
        <mesh position={[0, -0.22, 0.04]} material={materials.darkMetallic}>
          <sphereGeometry args={[0.14, 20, 20]} />
        </mesh>

        {/* Pelvic Girdle & Center Propulsion Reactor */}
        <mesh position={[0, -0.42, 0]} material={materials.darkMetallic}>
          <cylinderGeometry args={[0.3, 0.22, 0.22, 32]} />
        </mesh>
        <mesh position={[0, -0.48, 0]} material={materials.cyanGlow}>
          <torusGeometry args={[0.12, 0.025, 16, 32]} />
        </mesh>
      </group>

      {/* ===================== ARTICULATED HUMANOID ARMS & HANDS ===================== */}
      {/* Left Arm with Deltoid Pauldron, Bicep, Forearm Gauntlet & 5-Finger Hand */}
      <group ref={leftArmRef} position={[-0.46, 0.26, 0]}>
        {/* Deltoid Shoulder Pauldron */}
        <group ref={leftShoulderRef}>
          <mesh material={materials.whiteArmor} castShadow>
            <sphereGeometry args={[0.15, 24, 24]} />
          </mesh>
          <mesh position={[-0.04, 0.04, 0]} material={materials.darkMetallic}>
            <boxGeometry args={[0.1, 0.06, 0.18]} />
          </mesh>
        </group>

        {/* Bicep Arm Segment */}
        <mesh position={[0, -0.19, 0]} material={materials.whiteArmor}>
          <cylinderGeometry args={[0.09, 0.08, 0.22, 20]} />
        </mesh>

        {/* Articulated Chrome Elbow Hinge */}
        <mesh position={[0, -0.32, 0]} material={materials.silverJoint}>
          <sphereGeometry args={[0.075, 16, 16]} />
        </mesh>

        {/* Forearm Gauntlet */}
        <group ref={leftForearmRef} position={[0, -0.32, 0]}>
          <mesh position={[0, -0.14, 0]} material={materials.whiteArmor}>
            <cylinderGeometry args={[0.08, 0.07, 0.22, 20]} />
          </mesh>
          {/* Cyan Gauntlet Status Conduit */}
          <mesh position={[0, -0.14, 0.065]} material={materials.cyanGlow}>
            <boxGeometry args={[0.02, 0.16, 0.015]} />
          </mesh>

          {/* Articulated Humanoid Hand with Palm Repulsor Emitter */}
          <group position={[0, -0.28, 0]}>
            {/* Contoured Palm */}
            <mesh material={materials.darkMetallic}>
              <boxGeometry args={[0.085, 0.09, 0.045]} />
            </mesh>
            {/* Glowing Repulsor Disc in Palm */}
            <mesh position={[0, -0.01, 0.024]} material={materials.cyanGlow}>
              <circleGeometry args={[0.022, 16]} />
            </mesh>
            {/* Articulated Fingers (4 fingers + thumb) */}
            <mesh position={[-0.03, -0.07, 0]} material={materials.silverJoint}>
              <boxGeometry args={[0.016, 0.05, 0.016]} />
            </mesh>
            <mesh position={[-0.01, -0.075, 0]} material={materials.silverJoint}>
              <boxGeometry args={[0.016, 0.055, 0.016]} />
            </mesh>
            <mesh position={[0.01, -0.075, 0]} material={materials.silverJoint}>
              <boxGeometry args={[0.016, 0.055, 0.016]} />
            </mesh>
            <mesh position={[0.03, -0.07, 0]} material={materials.silverJoint}>
              <boxGeometry args={[0.016, 0.05, 0.016]} />
            </mesh>
            {/* Opposable Thumb */}
            <mesh position={[0.045, -0.02, 0.02]} rotation={[0, 0, -0.4]} material={materials.silverJoint}>
              <boxGeometry args={[0.016, 0.045, 0.016]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Right Arm with Deltoid Pauldron, Bicep, Forearm Gauntlet & 5-Finger Hand */}
      <group ref={rightArmRef} position={[0.46, 0.26, 0]}>
        {/* Deltoid Shoulder Pauldron */}
        <group ref={rightShoulderRef}>
          <mesh material={materials.whiteArmor} castShadow>
            <sphereGeometry args={[0.15, 24, 24]} />
          </mesh>
          <mesh position={[0.04, 0.04, 0]} material={materials.darkMetallic}>
            <boxGeometry args={[0.1, 0.06, 0.18]} />
          </mesh>
        </group>

        {/* Bicep Arm Segment */}
        <mesh position={[0, -0.19, 0]} material={materials.whiteArmor}>
          <cylinderGeometry args={[0.09, 0.08, 0.22, 20]} />
        </mesh>

        {/* Articulated Chrome Elbow Hinge */}
        <mesh position={[0, -0.32, 0]} material={materials.silverJoint}>
          <sphereGeometry args={[0.075, 16, 16]} />
        </mesh>

        {/* Forearm Gauntlet */}
        <group ref={rightForearmRef} position={[0, -0.32, 0]}>
          <mesh position={[0, -0.14, 0]} material={materials.whiteArmor}>
            <cylinderGeometry args={[0.08, 0.07, 0.22, 20]} />
          </mesh>
          {/* Cyan Gauntlet Status Conduit */}
          <mesh position={[0, -0.14, 0.065]} material={materials.cyanGlow}>
            <boxGeometry args={[0.02, 0.16, 0.015]} />
          </mesh>

          {/* Articulated Humanoid Hand with Palm Repulsor Emitter */}
          <group position={[0, -0.28, 0]}>
            {/* Contoured Palm */}
            <mesh material={materials.darkMetallic}>
              <boxGeometry args={[0.085, 0.09, 0.045]} />
            </mesh>
            {/* Glowing Repulsor Disc in Palm */}
            <mesh position={[0, -0.01, 0.024]} material={materials.cyanGlow}>
              <circleGeometry args={[0.022, 16]} />
            </mesh>
            {/* Articulated Fingers */}
            <mesh position={[-0.03, -0.07, 0]} material={materials.silverJoint}>
              <boxGeometry args={[0.016, 0.05, 0.016]} />
            </mesh>
            <mesh position={[-0.01, -0.075, 0]} material={materials.silverJoint}>
              <boxGeometry args={[0.016, 0.055, 0.016]} />
            </mesh>
            <mesh position={[0.01, -0.075, 0]} material={materials.silverJoint}>
              <boxGeometry args={[0.016, 0.055, 0.016]} />
            </mesh>
            <mesh position={[0.03, -0.07, 0]} material={materials.silverJoint}>
              <boxGeometry args={[0.016, 0.05, 0.016]} />
            </mesh>
            {/* Opposable Thumb */}
            <mesh position={[-0.045, -0.02, 0.02]} rotation={[0, 0, 0.4]} material={materials.silverJoint}>
              <boxGeometry args={[0.016, 0.045, 0.016]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ===================== ARTICULATED LEGS & HUMANOID BOOTS ===================== */}
      {/* Left Leg: Hip Joint, Thigh, Knee Guard with Pins, Shin & Anti-Grav Boot */}
      <group ref={leftLegRef} position={[-0.18, -0.42, 0]}>
        {/* Ball-and-Socket Hip Joint */}
        <mesh material={materials.silverJoint}>
          <sphereGeometry args={[0.085, 18, 18]} />
        </mesh>

        {/* Quadricep Thigh Armor */}
        <mesh position={[0, -0.13, 0]} material={materials.whiteArmor}>
          <cylinderGeometry args={[0.08, 0.068, 0.22, 20]} />
        </mesh>

        {/* Knee Guard Assembly with Chrome Guide Pins */}
        <group ref={leftKneeRef} position={[0, -0.26, 0]}>
          <mesh material={materials.silverJoint}>
            <sphereGeometry args={[0.068, 16, 16]} />
          </mesh>
          {/* Sculpted Knee Guard Cap */}
          <mesh position={[0, 0, 0.055]} material={materials.darkMetallic}>
            <boxGeometry args={[0.085, 0.085, 0.045]} />
          </mesh>
          <mesh position={[0, 0, 0.08]} material={materials.cyanAccent}>
            <circleGeometry args={[0.02, 12]} />
          </mesh>

          {/* Calf / Shin Gauntlet */}
          <mesh position={[0, -0.15, 0]} material={materials.whiteArmor}>
            <cylinderGeometry args={[0.068, 0.058, 0.22, 20]} />
          </mesh>

          {/* Ergonomic Humanoid Anti-Grav Boot */}
          <group position={[0, -0.28, 0.04]}>
            {/* Ankle Pivot Collar */}
            <mesh position={[0, 0.03, -0.02]} material={materials.silverJoint}>
              <cylinderGeometry args={[0.062, 0.062, 0.04, 16]} />
            </mesh>
            {/* Ergonomic Foot Shell */}
            <mesh material={materials.darkMetallic}>
              <boxGeometry args={[0.095, 0.048, 0.17]} />
            </mesh>
            {/* Toe Guard */}
            <mesh position={[0, -0.01, 0.07]} material={materials.whiteArmor}>
              <boxGeometry args={[0.09, 0.03, 0.05]} />
            </mesh>
            {/* Cyan Thruster Runner (Under Sole) */}
            <mesh position={[0, -0.025, 0]} material={materials.cyanGlow}>
              <boxGeometry args={[0.065, 0.01, 0.13]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Right Leg: Hip Joint, Thigh, Knee Guard with Pins, Shin & Anti-Grav Boot */}
      <group ref={rightLegRef} position={[0.18, -0.42, 0]}>
        {/* Ball-and-Socket Hip Joint */}
        <mesh material={materials.silverJoint}>
          <sphereGeometry args={[0.085, 18, 18]} />
        </mesh>

        {/* Quadricep Thigh Armor */}
        <mesh position={[0, -0.13, 0]} material={materials.whiteArmor}>
          <cylinderGeometry args={[0.08, 0.068, 0.22, 20]} />
        </mesh>

        {/* Knee Guard Assembly with Chrome Guide Pins */}
        <group ref={rightKneeRef} position={[0, -0.26, 0]}>
          <mesh material={materials.silverJoint}>
            <sphereGeometry args={[0.068, 16, 16]} />
          </mesh>
          {/* Sculpted Knee Guard Cap */}
          <mesh position={[0, 0, 0.055]} material={materials.darkMetallic}>
            <boxGeometry args={[0.085, 0.085, 0.045]} />
          </mesh>
          <mesh position={[0, 0, 0.08]} material={materials.cyanAccent}>
            <circleGeometry args={[0.02, 12]} />
          </mesh>

          {/* Calf / Shin Gauntlet */}
          <mesh position={[0, -0.15, 0]} material={materials.whiteArmor}>
            <cylinderGeometry args={[0.068, 0.058, 0.22, 20]} />
          </mesh>

          {/* Ergonomic Humanoid Anti-Grav Boot */}
          <group position={[0, -0.28, 0.04]}>
            {/* Ankle Pivot Collar */}
            <mesh position={[0, 0.03, -0.02]} material={materials.silverJoint}>
              <cylinderGeometry args={[0.062, 0.062, 0.04, 16]} />
            </mesh>
            {/* Ergonomic Foot Shell */}
            <mesh material={materials.darkMetallic}>
              <boxGeometry args={[0.095, 0.048, 0.17]} />
            </mesh>
            {/* Toe Guard */}
            <mesh position={[0, -0.01, 0.07]} material={materials.whiteArmor}>
              <boxGeometry args={[0.09, 0.03, 0.05]} />
            </mesh>
            {/* Cyan Thruster Runner (Under Sole) */}
            <mesh position={[0, -0.025, 0]} material={materials.cyanGlow}>
              <boxGeometry args={[0.065, 0.01, 0.13]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
