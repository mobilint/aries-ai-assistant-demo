# ARIES AI Assistant Demo

Offline voice-based AI assistant demo for ARIES / Mobilint hardware.

The current implementation uses:

- `Flask-SocketIO` backend for STT, LLM, and TTS orchestration
- `Next.js` frontend for the kiosk-style assistant UI
- frontend-owned locale resources, example questions, and prompt bundles
- backend-owned single-model deployment config in `backend/src/model.json`

## Repository Structure

- [backend/src/server.py](./backend/src/server.py): websocket server, task queue, STT/LLM/TTS flow
- [backend/src/pipeline_handler.py](./backend/src/pipeline_handler.py): model loading, STT inference, text generation, and TTS calls
- [backend/src/stt_models.py](./backend/src/stt_models.py): allowlisted STT model selector options
- [backend/src/model.json](./backend/src/model.json): deployed model and prompt/config paths used for initial startup
- [frontend/app/i18n](./frontend/app/i18n): UI text resources by locale
- [frontend/app/settings.ts](./frontend/app/settings.ts): frontend locale settings, UI text wiring, and TTS English-to-Korean replacement dictionary
- [frontend/app/utils/sanitizeForTTS.ts](./frontend/app/utils/sanitizeForTTS.ts): frontend TTS input sanitizer for markdown / emoji / punctuation cleanup
- [frontend/app/components/SanitizedTTSPreview.tsx](./frontend/app/components/SanitizedTTSPreview.tsx): debug button for inspecting the final sanitized TTS input
- [frontend/app/questions/locales](./frontend/app/questions/locales): example question resources by locale
- [frontend/public/prompt-bundles](./frontend/public/prompt-bundles): locale-specific `system.txt` / `inter.txt`

## Supported Locales

This demo supports:

- `en`
- `ko`

The frontend loads the selected locale's prompt bundle and sends it to the backend through the `prompt_config` socket event.

Unlike the LLM demos, this assistant also keeps STT and TTS aligned with the selected frontend locale:

1. frontend chooses `en` or `ko`
2. backend receives the matching prompt bundle
3. STT forwards the same locale to Whisper-family STT models
4. TTS selects the matching English or Korean voice directly from the frontend locale

TTS input text is also frontend-owned before synthesis:

5. frontend sanitizes the final LLM answer before sending `read`
6. backend keeps sentence splitting / synthesis orchestration
7. backend applies mixed-language segment synthesis only when the selected locale is Korean

The backend also rejects `ask`, `voice`, and `read` requests until the prompt bundle has been synchronized.

## Installation & Usage (Windows)

Windows does not support the Docker PCIe/NPU binding flow used on Linux, so run the backend and frontend directly.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

### Backend

```powershell
cd backend
uv sync
uv run mblt-melotts-download
uv run src/server.py
```

Open `http://localhost:3000`.

When running the backend directly with `uv`, run `mblt-melotts-download` once before first startup.

## Installation & Usage (Linux)

The helper script installs dependencies, prepares the Docker network, updates the repository, and downloads required assets.

```bash
./update.sh
```

## Manual Linux Setup

### Install Docker

Follow the official Docker Engine instructions:

- <https://docs.docker.com/engine/install/ubuntu/>
- <https://docs.docker.com/engine/install/linux-postinstall/>

### Create Docker Network

```bash
docker network create mblt_int
```

### Build

```bash
docker compose build
```

### Run (NPU mode)

```bash
docker compose up
```

### Run (GPU mode)

Install NVIDIA Container Toolkit first:

- <https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html>

Then run:

```bash
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up
```

`docker-compose.gpu.yml` sets `gpus: all`.

### Run in Background

```bash
docker compose up -d
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d
```

### Stop

```bash
docker compose down
```

## Runtime Notes

### Hardware requirement

This demo is designed for hardware-accelerated inference only.
CPU-only execution is not supported.

### Prompt ownership

Prompt text is not stored on the backend as the active source of truth.

- frontend loads prompt bundle files from [frontend/public/prompt-bundles](./frontend/public/prompt-bundles)
- frontend sends `system_prompt` / `inter_prompt` to the backend
- backend applies those prompt texts to the active session

### STT / TTS locale ownership

Frontend locale is also the source of truth for speech processing.

- STT uses the selected locale when calling Whisper
- frontend sanitizes the text that will be sent to TTS
- TTS chooses the voice from the selected locale
- when the selected locale is Korean, backend additionally splits mixed-language segments for synthesis

This keeps UI language, prompt language, STT language, and TTS language aligned.

### TTS text sanitizing and preview

Before a `read` request is sent to the backend, the frontend sanitizes the latest LLM answer for speech output.

- removes markdown syntax such as headings, list markers, links, code fences, and inline backticks
- removes emoji / pictographic characters
- normalizes punctuation and bracketed text for speech-friendly sentence boundaries
- applies the Korean `ENG_TO_KOR` replacement dictionary from [frontend/app/settings.ts](./frontend/app/settings.ts) when the active locale is `ko`

The backend no longer owns this replacement dictionary. This ensures the debug preview and the actual text sent to TTS are identical.

The TTS panel also includes a preview button that opens a page-level modal showing the exact sanitized text most recently sent to TTS.

The preview button is shown only after there is a non-empty sanitized TTS input to inspect.

### Mixed-language TTS behavior

The backend still owns TTS task execution, but synthesis behavior is now more granular:

- frontend sends already-sanitized text through the `read` socket event
- backend splits TTS input into sentences using `.`, `!`, `?`, `:`, `*`, parentheses, and line breaks
- when the selected locale is `ko`, each sentence is further divided into Korean / English segments
- backend synthesizes those segments with the matching voice and concatenates the generated audio

This improves pronunciation for mixed-language Korean responses containing product names, model names, and English technical terms, while keeping English locale synthesis on the simpler single-language path.

## STT Model Selector

The frontend STT panel includes a model selector for comparing Mobilint public ASR models. The backend validates selections against a fixed allowlist and switches the active STT pipeline only while the single-session handler is idle.

Supported STT models:

- `mobilint/whisper-small`
- `mobilint/whisper-medium` (default)
- `mobilint/whisper-large-v3-turbo`

`mobilint/whisper.cpp` is intentionally excluded because this demo uses the Hugging Face Transformers `automatic-speech-recognition` pipeline path, not whisper.cpp/GGML execution. Other Mobilint ASR models such as `whisper-tiny`, `whisper-base`, `whisper-large-v3`, and `Qwen3-ASR-1.7B` are also excluded from the current selector scope.

`update.sh` downloads the three supported STT repositories into the Hugging Face cache. Docker runs with `HF_HUB_OFFLINE=1` and mounts the host Hugging Face cache, so run `./update.sh` after changing the STT allowlist or before using the selector offline.

## Configuration

### Change the deployed model

Edit [backend/src/model.json](./backend/src/model.json).

This file defines:

- `model_id`
- `system_prompt_path`
- `inter_prompt_path`
- `generation_config_path`

Changes take effect when the backend restarts.

### Change prompt text

Edit the locale files under [frontend/public/prompt-bundles](./frontend/public/prompt-bundles):

- `system.txt`
- `inter.txt`

The frontend reloads and sends the selected locale's prompt bundle to the backend.

### Change UI text

Edit the locale JSON files under [frontend/app/i18n](./frontend/app/i18n).

### Change example questions

Edit the locale JSON files under [frontend/app/questions/locales](./frontend/app/questions/locales).

### Change TTS English-to-Korean replacement text

Edit `ENG_TO_KOR` in [frontend/app/settings.ts](./frontend/app/settings.ts).

These replacements are applied on the frontend during TTS sanitizing when the selected locale is Korean, and the same final text is what appears in the TTS preview modal.

## Development Checks

Frontend production build:

```powershell
cd frontend
npm run build
```

Backend syntax check:

```powershell
python -m py_compile backend/src/server.py backend/src/pipeline_handler.py backend/src/BilingualMeloTTS.py
```

## Desktop Shortcut

If you use the provided desktop shortcut, this repository is expected at `~/aries-ai-assistant-demo`.

If needed, update the path in:

- [ai-assistant-demo.desktop](./ai-assistant-demo.desktop)
- [run.sh](./run.sh)

Then install the desktop entry:

```bash
mkdir -p "$HOME/.local/share/applications"
cp ai-assistant-demo.desktop "$HOME/.local/share/applications/"
```
