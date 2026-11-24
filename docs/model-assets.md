# VCamp 3D Model Asset Specification

## 1. Overview

VCamp ships with a fully procedural, high-precision PBR 3D robotic companion model built using Three.js and React Three Fiber.

The system also includes an external model loader pipeline designed to accept rigged 3D models in standard GLTF/GLB format.

---

## 2. Model Location

To provide a custom external 3D robot model, place your `.glb` file at:
```
VCamp/desktop/src/assets/models/vcamp_robot.glb
```

---

## 3. Rigging & Bone Hierarchy Requirements

For full skeletal animation support, custom models should adhere to the standard humanoid skeleton hierarchy:
- `Root`
  - `Hips` / `Pelvis`
    - `Spine`
      - `Chest`
        - `Neck`
          - `Head`
        - `LeftShoulder` -> `LeftArm` -> `LeftForeArm` -> `LeftHand`
        - `RightShoulder` -> `RightArm` -> `RightForeArm` -> `RightHand`

---

## 4. Visual Aesthetics & Material Guidelines

To match the approved VCamp companion design:
- **Primary Armor:** Glossy white ceramic finish (Roughness: ~0.15, Metalness: ~0.1).
- **Secondary Armor:** Dark metallic titanium/gunmetal finish (Roughness: ~0.25, Metalness: ~0.85).
- **Forehead Emblem:** Glowing V shape with emissive cyan (`#00f2fe`) material.
- **Chest Emblem:** VCamp brand crest with cyan illumination.
- **Face / Visor:** Dark glass curved visor with illuminated digital eye and mouth display.
