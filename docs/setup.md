# VCamp Desktop Companion — Setup & Installation Guide

## 1. System Requirements

- **Operating System:** Microsoft Windows 10 (64-bit) or Windows 11
- **Runtime:** Microsoft Edge WebView2 (pre-installed on Windows 10/11)
- **Hardware:** 8 GB RAM or higher recommended; integrated GPU supported
- **Audio Hardware:** Built-in or external Microphone for push-to-talk voice input, and speakers/headphones for voice output
- **AI Mode:** Offline deterministic mode out of the box, or bring your own Groq / OpenAI-compatible API key in Settings

---

## 2. Architecture Overview

VCamp v3.0 is engineered as a standalone **Windows 3D desktop companion** with an optional FastAPI enterprise backend:
- **Tauri 2 & Rust:** Borderless, transparent, always-on-top compact mode + expandable corporate workspace + Windows background system tray, storing local user preferences in `%APPDATA%\VCamp\data`.
- **Three.js & React Three Fiber:** Modular 3D character engine supporting `VCamp Robot` and `Athletic_man` (13 animation states with smooth crossfades).
- **Modular AI Conversation Engine:** Supports Groq Cloud, OpenAI-compatible endpoints, and deterministic Offline mode across English, Tamil, and Tanglish.
- **Consent-First Sentiment & Question Engine:** Non-diagnostic affective detection with user consent controls, one-click history erasure, cooldowns, and quiet hours.
- **Optional Enterprise Backend (`backend/`):** FastAPI + SQLAlchemy SQLite with Alembic-style migrations (`schema_migrations`), Argon2id auth, JWT sessions, RBAC, and k-anonymity HR department aggregates.

---

## 3. Quick Start (Development & Testing)

### A. Prerequisites
1. **Node.js:** v18+ or v20+ (tested on Node v24.15.0)
2. **Rust & Cargo:** v1.75+ (tested on `rustc 1.100.0` `x86_64-pc-windows-msvc`)
3. **Python (optional for Enterprise Backend):** Python 3.11+ with dependencies from `backend/requirements.txt`

### B. Running Frontend Dev Server
```powershell
cd "d:\Aathil\Vdart-comp\desktop"
npm run dev
```
Open `http://127.0.0.1:1420` to run the companion in browser preview.

### C. Running Optional Enterprise Backend
```powershell
cd "d:\Aathil\Vdart-comp\backend"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### D. Building Native Windows Release Bundle
```powershell
cd "d:\Aathil\Vdart-comp\desktop"
npx tauri build
```
Build outputs under `desktop\src-tauri\target\release\`:
- `vcamp-desktop.exe` (Standalone portable executable)
- `bundle\nsis\VCamp_1.0.0_x64-setup.exe` -> packaged as `release\VCamp-Setup.exe`
- `bundle\msi\VCamp_1.0.0_x64_en-US.msi` -> packaged as `release\VCamp-Setup.msi`

---

## 4. Desktop Interactions

- **Drag Companion:** Drag the companion move handle to position VCamp anywhere on your Windows desktop.
- **Open Chat:** Click the 3D character or chat icon to open the conversation drawer.
- **Voice Chat (Push-to-Talk):** Click the microphone button in chat to speak in English, Tamil, or Tanglish.
- **Open Workspace Dashboard:** Click the Dashboard icon or tray menu item to open Character Studio, Wellbeing, Question Engine, Reminders, HR Analytics (Admin), and Settings.
- **Minimize to Tray / Exit:** Minimize sends VCamp to the Windows system tray; Exit terminates the process cleanly.
