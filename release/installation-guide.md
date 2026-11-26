# VCamp Windows Installation Guide

## Option A – Standard Windows Installer (`VCamp-Setup.exe`)
1. Double-click `VCamp-Setup.exe`.
2. Complete the installer wizard (`currentUser` installation — no administrator privileges required on most machines).
3. Launch **VCamp** from the Start Menu or Desktop shortcut.
4. Confirm Microsoft Edge WebView2 Runtime is available (pre-installed on Windows 10/11).

## Option B – Enterprise MSI Deployment (`VCamp-Setup.msi`)
Deploy interactively or silently via Windows Installer:
```powershell
msiexec /i VCamp-Setup.msi /qn
```

## Option C – Portable Executable (`vcamp-desktop.exe`)
1. Copy `vcamp-desktop.exe` to any user-writable directory (e.g., `C:\Users\<user>\Apps\VCamp\`).
2. Double-click `vcamp-desktop.exe` to run directly without installation.
3. User preferences and character configurations persist under `%APPDATA%\VCamp\data`.

## First-Time Setup Inside the App
1. Sign in via **Local Desktop Mode** (zero backend required) or enter your **Enterprise Backend Server URL** if connecting to an organization server.
2. Open **Workspace -> Settings & System** to optionally enter a Groq API key (`groq`), configure an OpenAI-compatible URL (`openai_compatible`), or keep **Offline Fallback** active.
3. Open **Workspace -> Character Studio** to switch between **VCamp Robot** and **Athletic_man** and preview all 13 animations.
