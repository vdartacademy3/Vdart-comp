# VCamp AI Provider & API Configuration Guide

## 1. Supported AI Providers

VCamp supports a modular AI provider architecture configurable from both the desktop **Settings & System** tab (`SettingsSystemTab`) and environment variables (`backend/app/config.py`):

| Provider Mode | Config Value | Endpoint | Notes |
| :--- | :--- | :--- | :--- |
| **Groq Cloud** | `groq` | `https://api.groq.com/openai/v1/chat/completions` | Low-latency LPU inference (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `qwen/qwen3-32b`) |
| **OpenAI-Compatible** | `openai_compatible` | Custom `VCAMP_AI_BASE_URL` | Works with local or cloud OpenAI-compatible servers |
| **Offline Fallback** | `offline` | Built-in deterministic responder | Works cleanly with zero network/API keys |

Configure in **Desktop -> Workspace -> Settings & System**, or via environment variables (`AI_PROVIDER`, `GROQ_API_KEY`, `AI_BASE_URL`, `GROQ_MODEL`) without editing source files.

---

## 2. Audio Transcription

VCamp supports Push-to-Talk speech input:
- **Browser Web Speech API:** Built-in fallback when available in WebView2
- **Groq Whisper:** `whisper-large-v3-turbo` via `https://api.groq.com/openai/v1/audio/transcriptions` when a Groq API key is configured

---

## 3. Security & Privacy Controls

- **No Hardcoded Credentials:** Never commit `.env` or embed API keys/passwords in source code. Copy `.env.example` to `.env` for local overrides.
- **Generated Signing Secret:** If `JWT_SECRET_KEY` is omitted, the backend auto-generates and stores a random per-install secret in `.vcamp_jwt_secret` inside `VCAMP_DATA_DIR`.
- **Consent & Erasure:** Sentiment recording, memory retention, quiet hours, retention duration, and one-click history deletion are user-controlled.
- **K-Anonymity HR Guardrail:** Department analytics suppress buckets below `VCAMP_HR_MIN_GROUP_SIZE` (default `3`) and never expose private chat transcripts.
