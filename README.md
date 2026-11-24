# VCamp — AI-Powered Native Windows 3D Desktop Companion

VCamp is a personal AI desktop companion engineered for Microsoft Windows. It renders a sleek, realistic 3D robot directly on your Windows desktop with true window transparency, real-time multilingual intelligence powered by the **Groq API** (`llama-3.3-70b-versatile`), speech recognition (`whisper-large-v3-turbo`), automatic text-to-speech with localized Windows voices, 7-category sentiment analysis driving animated visor expressions, and full background system tray residency.

---

## 🌟 Key Features

- **Native Windows Floating Companion:** Borderless, transparent, always-on-top desktop window positioned docked at the bottom-left of your screen. Draggable to any location.
- **Realistic 3D Robot Character:** Built with Three.js and React Three Fiber. Features glossy white PBR armor, glowing forehead **V** logo (`#00f2fe`), dark metallic joints, and an animated digital visor screen that reacts in real-time.
- **Real Groq Cloud AI:** Powered by Groq's high-speed inference engine with `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.
- **Trilingual Communication:**
  - **Tamil (`தமிழ்`):** Automatic detection of Tamil Unicode and natural conversational responses.
  - **English:** Articulate, helpful conversational and technical assistance.
  - **Tanglish:** Robust understanding and responses for phonetic Tamil written in the English alphabet (e.g., *"epdi irukinga"*, *"romba nalla irukku"*).
- **Voice Assistant (Push-to-Talk):** Direct microphone recording transcribed via Groq Whisper API, with spoken audio output through Windows Speech voices.
- **Real-Time Sentiment Analysis:** Classifies user dialogue into 7 emotional states (`happy`, `excited`, `sad`, `angry`, `frustrated`, `confused`, `neutral`), directly altering the 3D robot's facial visor expressions and posture.
- **System Tray Residency:** Minimizing or closing hides the companion into the Windows taskbar tray; right-click context menu enables fast Show, Hide, Dashboard, and Exit actions.
- **Dual Management Dashboard:** Comprehensive Control Center available both as an in-app overlay modal and as an independent standalone web dashboard.

---

## 📁 Repository Structure

```
VCamp/
├── desktop/                    # Native Windows desktop application (Tauri 2 + React + Three.js)
│   ├── src/
│   │   ├── companion/          # 3D robot model, materials, and scene canvas
│   │   ├── chat/               # Glassmorphism chat popup, message list, push-to-talk mic
│   │   ├── services/           # Groq API, sentiment classifier, Whisper STT, Windows TTS
│   │   ├── stores/             # Zustand state stores (companion & conversation)
│   │   ├── dashboard/          # In-app Control Center modal
│   │   └── assets/             # Branding icons and 3D model asset directory
│   ├── src-tauri/              # Rust native desktop core (system tray, window transparency)
│   ├── package.json
│   └── vite.config.ts
├── dashboard/                  # Standalone Control Center & Management Web App
├── docs/                       # Technical documentation
│   ├── setup.md                # Windows installation and run instructions
│   ├── architecture.md         # System design, data flow, and state machine
│   ├── api-configuration.md    # Groq API setup, model choices, and audio specs
│   └── model-assets.md         # 3D GLB/GLTF humanoid asset specifications
├── tests/                      # Automated test suite and acceptance test report
│   ├── test_services.js        # Automated unit tests for sentiment, language, and Groq registry
│   └── test_report.md          # Formal acceptance verification report
└── README.md                   # This project overview
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18+ or v20+
- **Rust Toolchain:** Cargo & Rust `x86_64-pc-windows-gnu` or `x86_64-pc-windows-msvc`
- **Groq API Key:** Obtain from [console.groq.com](https://console.groq.com)

### 2. Run Desktop Companion in Development Mode
```powershell
cd "D:\Aathil\sentiment analysis\VCamp\desktop"
npm.cmd run dev
```
Open `http://127.0.0.1:1420` in your browser to interact with the companion.

### 3. Build Native Windows Production Executable
```powershell
cd "D:\Aathil\sentiment analysis\VCamp\desktop"
npm.cmd run build
npx.cmd tauri build
```
The compiled native executable will be located at:
`desktop/src-tauri/target/release/vcamp-desktop.exe`

---

## 🧪 Running Automated Tests
```powershell
cd "D:\Aathil\sentiment analysis\VCamp\tests"
node test_services.js
```
All 9 sentiment categories and multilingual language detection tests will execute and verify.

---

## 📜 License
Proprietary — Developed for VCamp Workforce Companion System.
