# VCamp Architecture & Engineering Design

## 1. System Architecture Diagram

```
+-------------------------------------------------------------------------+
|                        Windows Desktop Environment                     |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                 VCamp Native Transparent Window                  |  |
|  |  +---------------------------+   +-----------------------------+  |  |
|  |  |   Three.js 3D Companion   |   |   Glassmorphism Chat Popup  |  |  |
|  |  |   - PBR Robotic Armor     |   |   - Multi-Turn Messages     |  |  |
|  |  |   - Glowing V Forehead    |   |   - Sentiment Badges        |  |  |
|  |  |   - Animated Eye Visor    |   |   - Audio Playback Controls |  |  |
|  |  |   - State Anim Blender    |   |   - Push-To-Talk Mic Button |  |  |
|  |  +---------------------------+   +-----------------------------+  |  |
|  |                |                               |                  |  |
|  +----------------|-------------------------------|------------------+  |
|                   |                               |                     |
|  +----------------v-------------------------------v------------------+  |
|  |                      Tauri 2 Rust Core Bridge                     |  |
|  |  - Windows Window Management (Always-On-Top, Transparent)         |  |
|  |  - System Tray Management (Show, Hide, Dashboard, Exit)           |  |
|  |  - Autostart with Windows Registry Integration                   |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
+-------------------------------------------------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v                                                   v
+-----------------------------------+   +------------------------------------+
|          Groq Cloud AI            |   |       Windows Speech Subsystem     |
| - Llama 3.3 70B (Text Reasoner)   |   | - Web Speech API                   |
| - Llama 3.1 8B (Sentiment Engine) |   | - Microsoft Valluvar (Tamil)       |
| - Whisper Large v3 (Audio STT)    |   | - Microsoft Zira / David (English) |
+-----------------------------------+   +------------------------------------+
```

## 2. Core Functional Modules

### A. 3D Robotic Companion (`src/companion/`)
- **Procedural PBR Model (`CompanionModel.tsx`):**
  - High-precision geometric armor plates using glossy white ceramic (`MeshPhysicalMaterial`) and dark titanium alloy (`MeshStandardMaterial`).
  - Forehead glowing V emblem with bloom and localized point lighting.
  - Expressive digital eye visor screen dynamically shifting between:
    - `idle`: Calm breathing and regular blinks every 3-5 seconds.
    - `hover`: Attentive gaze following pointer position.
    - `listening`: Alert dilated eyes and head tilted forward.
    - `thinking`: Rapid pulsing forehead V logo and scanning eye particles.
    - `speaking`: Conversational head motion and audio-reactive mouth sync.
    - `happy`: Smiling crescent eyes (`^ ^`) and cheerful nodding.
    - `empathetic`: Gentle soft gaze and comforting posture.
    - `confused`: Asymmetric eye scaling (`o O`) and 18-degree quizzical head tilt.

### B. Conversational Intelligence & Groq Integration (`src/services/groqService.ts`)
- Multi-turn conversational context with customizable system prompt.
- Automatic multilingual routing:
  - Tamil Unicode (`\u0B80-\u0BFF`) detection -> natural polite Tamil script responses.
  - Tanglish phonetic patterns -> friendly Tanglish / Tamil blend.
  - English -> articulate, concise technical responses.

### C. Voice Engine (`src/services/transcriptionService.ts` & `speechService.ts`)
- Push-to-talk audio recording via `MediaRecorder` API.
- Transcription through Groq Whisper API (`whisper-large-v3-turbo`).
- Text-to-speech through Windows native Speech Synthesis voices with automatic language detection and manual voice selection.

### D. Sentiment Classification Engine (`src/services/sentimentService.ts`)
- Instant local heuristic classifier with Tamil, English, and Tanglish regex tokens for zero-latency UI updates.
- Optional Groq structured classification (`response_format: { type: 'json_object' }`) returning calibrated confidence scores.
- Interactive user feedback mechanism allowing users to correct emotion predictions by clicking the sentiment badge.

### E. System Tray & Background Residency
- The application remains resident in the Windows system notification area.
- Minimizing or closing the companion window hides the window rather than terminating the process.
- Tray context menu provides one-click options to restore companion, open dashboard, or exit cleanly.
