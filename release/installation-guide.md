# VCamp v2.0.0 – Enterprise Installation & Deployment Guide

---

## 1. Architecture Overview
VCamp v2.0.0 consists of three integrated, tenant-isolated layers:
1. **Central Secure Backend (`backend/`)**: FastAPI server powering Argon2id authentication, 15-class multilingual sentiment intelligence, Groq LLM integration, and tenant data isolation.
2. **Desktop Companion (`desktop/` or `release/vcamp-desktop.exe`)**: Featherweight floating 3D companion for Windows desktops with Three.js rendering, voice transcription, and automatic emotion-driven character animations.
3. **Website Management Dashboard (`dashboard/`)**: Central web platform for employee directory administration, aggregate sentiment analytics, empirical model performance evaluation, and security audit logs.

---

## 2. Quick Start: Launching the Ecosystem

### Step 1: Start Central Secure Backend
Open a terminal in `VCamp/backend`:
```powershell
cd "d:\Aathil\sentiment analysis\VCamp\backend"
python run.py
```
*The backend runs on `http://127.0.0.1:8000` with automatic SQLite/PostgreSQL migrations and default accounts seeded.*

### Step 2: Launch Desktop Companion
Run the standalone Windows executable:
```cmd
d:\Aathil\sentiment analysis\VCamp\release\vcamp-desktop.exe
```
Or run via development mode:
```powershell
cd "d:\Aathil\sentiment analysis\VCamp\desktop"
npm run tauri dev
```

### Step 3: Launch Website Dashboard
Open a terminal in `VCamp/dashboard`:
```powershell
cd "d:\Aathil\sentiment analysis\VCamp\dashboard"
npm run dev
```
*Access the management dashboard in your browser at `http://localhost:5173`.*

---

## 3. Mandatory Employee Authentication
On first launch, both the desktop companion and website dashboard require employee login.

### Pre-Configured Enterprise Demo Accounts
| Role | Email | Password | Permissions |
|---|---|---|---|
| **Super Admin** | `admin@vcamp.ai` | `Admin@12345` | Full access to employee directory, aggregate sentiment analytics, empirical benchmark evals, and system audit logs. |
| **Employee** | `employee@vcamp.ai` | `Employee@12345` | Access to personal 3D companion, private sentiment history, personal reminders, and isolated memories. |

---

## 4. Desktop Companion Orientation

### 4.1 Minimal Floating 3D Character
- **Always-on-Top Floating Widget**: Docked smoothly on the desktop with zero bloated dashboard panels.
- **Header Drag Bar**: Click and drag to position the companion anywhere across single or multi-monitor workspaces.
- **System Tray Integration**: Minimize to Windows tray when focus is needed; click tray icon to restore.

### 4.2 Core Interactions
- 💬 **Chat Drawer**: Click the chat button to converse with VCamp in English, Tamil Unicode, or Romanized Tanglish.
- 🎙️ **Voice Microphone**: Speak directly using Whisper Large v3 Turbo transcription.
- ⏰ **Proactive Reminders**: Say *"Remind me at 4 PM to drink water"* — natural language detection automatically schedules the task.
- ⚙️ **Minimal Settings**: Fast access to speech volume, voice speed, language mode, and sign out.
- 🎨 **Emotion Feedback**: The companion's facial expressions and body posture automatically reflect conversation sentiment (`happy`, `empathetic`, `confused`, `thinking`, `idle`).

---

## 5. Website Dashboard Overview
The website dashboard provides 10 dedicated management modules:
1. **Overview**: Real-time platform health and AI engine status.
2. **Employee Management**: Account creation, Argon2id password reset, RBAC role assignment (`SUPER_ADMIN`, `ADMIN`, `EMPLOYEE`).
3. **Sentiment Analytics**: 15 calibrated emotion classes, language distribution, and non-surveillance organization aggregate trends.
4. **Model Performance & Evals**: Live 46-sample benchmark runner calculating factual scikit-learn Accuracy (89.13%), Macro F1 (91.37%), and Confusion Matrix.
5. **System Configuration**: Groq API key manager and sentiment uncertainty/inertia thresholds.
6. **Companion Management**: Personal companion tone configuration, custom prompt injector, and 3D `.GLB` model mesh uploader.
7. **Question Engine**: Scientifically validated affective check-ins in English and Tamil.
8. **Reminders Management**: Personal schedule and smart-detected task manager.
9. **Voice Configuration**: Regional Indian voices (Tamil, Hindi, Indian English) with pitch and prosody sliders.
10. **Privacy & Audit Logs**: Immutable security audit trail, GDPR data export, and tenant deletion workflows.
