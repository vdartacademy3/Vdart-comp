# VCamp Troubleshooting Guide (Windows)

## 1. WebView2 Runtime Missing
- **Symptom**: Window fails to open on an older Windows 10 build.
- **Fix**: Install Microsoft Edge WebView2 Evergreen Bootstrapper from Microsoft's official site (`msedgewebview2.exe`). Windows 11 includes it by default.

## 2. Character Studio GLB Model Slow on Low-RAM PCs
- **Behavior**: `VCamp Robot` renders immediately at startup with zero network/model disk load. Selecting `Athletic_man` loads and caches GLB assets on demand.
- **Tip**: Close heavy background tabs if your system has 8 GB RAM, or switch back to `VCamp Robot` via **Workspace -> Character Studio -> Set Default**.

## 3. AI Responses Use Offline Fallback
- **Cause**: No Groq / OpenAI-compatible API key is configured, or the device has no internet access.
- **Fix**: Open **Workspace -> Settings & System**, select your preferred provider (`Groq Cloud` or `OpenAI-Compatible`), paste a valid API key, and click Save.

## 4. Microphone / Voice Input Unavailable
- **Cause**: Windows microphone privacy permission disabled or no audio input device present.
- **Fix**: Open **Windows Settings -> Privacy & security -> Microphone** and ensure desktop apps are allowed microphone access. Note that VCamp only records audio when you explicitly press the microphone button.

## 5. Resetting Local App Data
User desktop settings are stored cleanly in:
`%APPDATA%\VCamp\data`
Close VCamp via the tray menu (**Exit VCamp**) before backing up or removing files in that directory.

## 6. Windows SmartScreen Warning on Unsigned Binary
- Notice internal/self-distributed builds without a commercial EV Authenticode certificate may trigger Microsoft Defender SmartScreen ("More info -> Run anyway"). Verify file integrity against [`checksums.txt`](checksums.txt) first.
