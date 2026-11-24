# VCamp Desktop Companion — Setup & Installation Guide

## 1. System Requirements

- **Operating System:** Microsoft Windows 10 (64-bit) or Windows 11
- **Runtime:** Microsoft Edge WebView2 (pre-installed on Windows 10/11)
- **Audio Hardware:** Built-in or external Microphone for voice input, and speakers/headphones for speech output
- **AI Engine:** Groq Cloud API key (free at [https://console.groq.com](https://console.groq.com))

---

## 2. Architecture Overview

VCamp is engineered as a **native Windows 3D desktop companion** built on:
- **Tauri 2 & Rust:** Native borderless, transparent, always-on-top desktop window management and background system tray process.
- **Three.js & React Three Fiber:** High-performance 3D character rendering with cinematic PBR materials and procedural skeletal animations.
- **Groq AI Integration:** Ultra-low-latency Llama 3.3 70B & Llama 3.1 8B for natural conversational reasoning across Tamil, English, and Tanglish.
- **Groq Whisper:** Multilingual speech-to-text transcription engine.
- **Web Speech & Windows TTS:** Native voice synthesis with automatic language detection.
- **Multi-Category Sentiment Engine:** Real-time emotion classification mapping to robot expressions.

---

## 3. Quick Start (Development & Testing)

### A. Prerequisites
1. **Node.js:** v18+ or v20+
2. **Rust & Cargo:** v1.75+ (Target `x86_64-pc-windows-gnu` or `x86_64-pc-windows-msvc`)

### B. Running Frontend Dev Server
```powershell
cd "D:\Aathil\sentiment analysis\VCamp\desktop"
npm run dev
```
Open `http://127.0.0.1:1420` in any browser to test the interactive 3D companion scene, speech recognition, sentiment detection, and Groq chat directly.

### C. Building Native Windows Production Bundle
```powershell
cd "D:\Aathil\sentiment analysis\VCamp\desktop"
npm run build
npm run tauri build
```
This generates:
- `target/release/vcamp-desktop.exe` (Portable native Windows executable)
- `target/release/bundle/nsis/VCamp-Setup.exe` (Windows Installer)

---

## 4. Desktop Interactions

- **Drag Robot:** Click and drag the move bar at the top of the companion to position VCamp anywhere on your Windows desktop.
- **Open Chat:** Click directly on the 3D robot or click the speech bubble icon to toggle the conversation panel.
- **Voice Chat (Push-to-Talk):** Click the microphone button in the chat popup. Speak in Tamil, English, or Tanglish. Click again when finished to transcribe and send.
- **Open Dashboard:** Click the dashboard icon in the chat header or the system tray menu to access the comprehensive Control Center.
- **Minimize to Tray:** Click the minimize icon to hide the 3D companion while keeping the application alive in the Windows notification area / system tray.
- **Restore from Tray:** Click the VCamp tray icon or select "Show Companion" to bring the robot back immediately.
- **Exit Application:** Select "Exit VCamp" from the system tray menu to completely terminate all background processes.
