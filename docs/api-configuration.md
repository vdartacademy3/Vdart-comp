# VCamp API Configuration Guide

## 1. Obtaining a Groq API Key

VCamp uses Groq's high-speed LPU inference engine for conversational AI and audio transcription.

1. Navigate to [https://console.groq.com/keys](https://console.groq.com/keys).
2. Sign in or register with your email/GitHub/Google account.
3. Click **Create API Key**.
4. Name your key (e.g. `VCamp-Desktop`) and copy the key (starts with `gsk_...`).
5. Open VCamp Desktop, click the **Key** icon in the chat header, paste the key, and click **Save Key**.

---

## 2. Supported Models

| Model ID | Provider | Context Window | Recommended Use Case |
| :--- | :--- | :--- | :--- |
| `llama-3.3-70b-versatile` | Meta AI | 128k tokens | **Default Recommended**: Top-tier multilingual comprehension across Tamil, English, and Tanglish. |
| `llama-3.1-8b-instant` | Meta AI | 128k tokens | **Fastest Response**: Optimized for low-latency dialogue and structured sentiment extraction. |
| `mixtral-8x7b-32768` | Mistral AI | 32k tokens | Complex coding, long reasoning, and balanced dialogue. |
| `gemma2-9b-it` | Google | 8k tokens | High-accuracy concise responses. |

---

## 3. Audio Transcription Model

VCamp voice recognition utilizes:
- **Model:** `whisper-large-v3-turbo` (or `whisper-large-v3`)
- **Endpoint:** `https://api.groq.com/openai/v1/audio/transcriptions`
- **Supported Audio Formats:** `audio/webm`, `audio/wav`, `audio/mp4`
- **Supported Languages:** Tamil (`ta`), English (`en`), and 97+ other languages with automatic language detection.

---

## 4. Security & Privacy Controls

- **No Hardcoded Keys:** Secrets are never hardcoded in source code or committed to repositories.
- **Local Storage:** The API key is stored securely in encrypted local storage on the user's machine.
- **Audio Privacy:** Microphone recording is strictly user-initiated (Push-to-Talk). No ambient background listening or audio recording is ever executed.
