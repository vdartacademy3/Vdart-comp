# VDart Companion (VCamp) – Windows Release Package

This folder contains the standalone Windows 10/11 release artifacts for **VDart Companion (VCamp v3.0.0)**.

## Release Artifacts

| Artifact | Purpose | Size |
|---|---|---|
| `VCamp-Setup.exe` | Windows x64 NSIS Installer (current-user install + shortcuts + uninstaller) | 70,418,729 bytes (67.16 MiB) |
| `VCamp-Setup.msi` | Windows x64 Enterprise MSI Installer | 73,936,896 bytes (70.51 MiB) |
| `VCamp-Portable.exe` | Portable standalone Windows GUI executable (no Python/Node required) | 82,125,312 bytes (78.32 MiB) |
| `checksums.txt` | SHA-256 verification hashes for all release binaries | — |

## Key Capabilities

- **Standalone Desktop Runtime**: Tauri 2 + Rust native transparent companion window, expandable corporate workspace dashboard, and Windows system tray integration (`Show/Hide Companion`, `Open Workspace`, `Exit`).
- **Local AppData Persistence**: Stores companion settings, character customization, and desktop runtime data in `%APPDATA%\VCamp\data` without touching installation folders.
- **3D Character Studio (`VCamp Robot` & `Athletic_man`)**: Built-in `VCamp Robot` plus bundled `Athletic_man` GLB rigged character with 13 crossfaded animation actions (`idle`, `walk`, `run`, `jump_running`, `dance_groove`, `wave`, `talk`, `talk_gesture`, `laugh`, `laugh hard`, `punch`, `push`, `knockdown`), speed/scale/rotation/camera controls, and reset.
- **Corporate White & Technology Blue UI**: Pure White (`#FFFFFF`) cards/surfaces with Technology Blue (`#1769D2`) accents across Compact Companion, Chat Drawer, Auth Modal, and the 8-tab Workspace Dashboard.
- **Modular AI & Multilingual Sentiment**: Groq Cloud, OpenAI-compatible, or built-in Offline fallback across English, Tamil, and Tanglish; consent-based sentiment analysis with user opt-out, correction feedback, and one-click deletion.
- **Privacy-Preserving Enterprise Backend (`backend/`)**: Optional FastAPI + SQLite server supporting JWT + Argon2id authentication, schema migrations (`schema_migrations`), k-anonymity HR department aggregates (`suppressed_for_privacy` below minimum group size), and database backups.

## Verification

Compare SHA-256 hashes before distribution:

```powershell
Get-FileHash .\VCamp-Setup.exe -Algorithm SHA256
Get-FileHash .\VCamp-Setup.msi -Algorithm SHA256
Get-FileHash .\vcamp-desktop.exe -Algorithm SHA256
```

Matches [`checksums.txt`](checksums.txt).
