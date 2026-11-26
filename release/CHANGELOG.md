# Changelog – VDart Companion (VCamp)

## v3.0.0 – Full-Stack Reconstruction, White/Blue Corporate UI, Athletic_man Studio & Windows Release

### Added & Integrated
- **3D Character Engine & Studio**: Integrated `Athletic_man` (19 GLB/texture assets preserved verbatim under `desktop/public/characters/Athletic_man/`) alongside `VCamp Robot` with centralized state priority controller (`animationController.ts`), dynamic clip discovery (`animationMapping.ts`), `SkeletonUtils.clone`, smooth crossfades, speech-synced `TALK` playback, and `CharacterStudioTab`.
- **Native Windows Persistence (`desktop/src-tauri/src/lib.rs`)**: Added `%APPDATA%\VCamp\data` storage commands (`get_app_data_dir`, `save_app_data`, `load_app_data`, `delete_app_data`), autostart toggle commands, and hydrated `companionStore.ts` cleanly on app startup.
- **Standalone Local Desktop Mode**: Enabled full standalone desktop operation without requiring local Python/Node runtimes; added modular AI provider abstraction (`groq`, `openai_compatible`, `offline`).
- **Database Migrations & Privacy Governance (`backend/app/migrations.py`)**: Added idempotent `schema_migrations` (`v1: consent_character_sentiment_v3`), consent flags (`consent_sentiment`, `consent_memory`, `consent_questions`, `retention_days`, quiet hours), sentiment correction feedback, one-click history deletion (`DELETE /api/sentiment/history`), and personal data export (`GET /api/system/privacy-export`).
- **Intelligent Question Engine (`backend/app/services/question_service.py`)**: Context-pattern detection (`workload`, `motivation`, `frustration`, `positive`) with 120-minute cooldown, daily cap (3), quiet-hour suppression, and consent enforcement.
- **HR K-Anonymity Guardrail (`backend/app/routers/sentiment.py`)**: Department wellbeing aggregates automatically mark `suppressed_for_privacy: true` until at least `HR_MIN_AGGREGATION_THRESHOLD` (default `3`) distinct employees contribute.
- **Bundle Optimization**: Split Vite production chunks (`three-engine`, `react-vendor`, `ui-icons`) in `desktop/vite.config.ts`.

### Redesigned & Consolidated
- **Corporate Light Theme**: Transitioned desktop companion, floating chat drawer, workspace dashboard (`DashboardModal`), web admin dashboard (`dashboard/`), and all 9 admin modules to Pure White (`#FFFFFF`) and Technology Blue (`#1769D2`).
- **Codebase Cleanup**: Consolidated duplicate desktop dashboard tabs from 19 down to 8 cohesive tabs; removed unused tab modules, duplicate `desktop/test_services.js`, and obsolete `tests/test_no_manual_movement.py`.

### Fixed
- **Security**: Eliminated hardcoded JWT secret fallbacks (now generated/stored per install in `.vcamp_jwt_secret`), gated demo account seeding behind env flags (`VCAMP_ENABLE_DEMO_ACCOUNTS`), restricted CORS origins to explicit host lists, and fixed `/api/auth/register` privilege escalation so post-bootstrap self-registrations are forced to `EMPLOYEE`.
- **API & UI Contracts**: Fixed desktop & web dashboard chat response parsing (`companion_message.text`), companion profile field alignment (`companion_name`, `selected_character_id`), and `SentimentAnalyticsModule` schema bindings (`/sentiment/analytics?scope=...`, `emotion_distribution`, `language_distribution`).
