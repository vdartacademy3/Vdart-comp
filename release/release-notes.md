# VDart Companion (VCamp) v3.0.0 – Release Notes

## Highlights
- **Corporate Light UI Redesign**: Pure White (`#FFFFFF`) and Technology Blue (`#1769D2`) across Desktop Companion, Chat Drawer, 8-tab Workspace Dashboard (`DashboardModal`), and Web Admin Dashboard (`dashboard/`).
- **Standalone Windows Desktop Mode**: Full offline/local desktop execution via `%APPDATA%\VCamp\data` persistence (`desktop/src-tauri/src/lib.rs` + `localDataService.ts`), without requiring a local Python runtime.
- **3D Character Studio (`VCamp Robot` + `Athletic_man`)**: Dynamic GLB animation discovery, skeleton cloning, priority controller (`animationController.ts`), and all 13 verified `Athletic_man` animations alongside the procedural `VCamp Robot`.
- **Modular AI & Consent-First Sentiment**: Configurable `groq`, `openai_compatible`, and deterministic `offline` providers; consent toggles, sentiment correction feedback, one-click history erasure, and contextual pattern questions with quiet hours/cooldowns.
- **Security & HR Privacy Hardening**: Fixed `/api/auth/register` privilege escalation, eliminated hardcoded JWT secrets and seeded passwords, enforced strict CORS origins, added idempotent SQLite migrations (`schema_migrations`), and enforced k-anonymity thresholding on HR department aggregates (`suppressed_for_privacy`).

## Packaging
- `release/VCamp-Portable.exe` (82,125,312 bytes)
- `release/VCamp-Setup.exe` (70,418,729 bytes)
- `release/VCamp-Setup.msi` (73,936,896 bytes)
- `release/checksums.txt` (SHA-256 verification sums)
