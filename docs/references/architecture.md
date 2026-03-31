# Architecture

## System Overview

```
┌─────────────────────────────────────────────────┐
│  Browser (phone or desktop)                     │
│                                                 │
│  Next.js React App (port 3000)                  │
│  ┌─────────────┐  ┌──────────────┐              │
│  │ TextInput    │  │ SentenceCard │  pinyin-pro  │
│  │ (paste text) │  │ (ruby text)  │  (display)   │
│  └─────────────┘  └──────────────┘              │
│  ┌─────────────┐  ┌──────────────┐              │
│  │ RecordButton │  │ EvalResult   │              │
│  │ (MediaRec.)  │  │ (colors)     │              │
│  └──────┬──────┘  └──────▲───────┘              │
│         │ WAV blob       │ CharResult[]          │
│         ▼                │                       │
│    POST /api/evaluate    │                       │
└─────────┬────────────────┘───────────────────────┘
          │  (Next.js rewrites to :8000)
          ▼
┌─────────────────────────────────────────────────┐
│  FastAPI Backend (port 8000)                    │
│                                                 │
│  POST /api/evaluate                             │
│  ┌──────────────────┐                           │
│  │ TranscriptionSvc │ ← abstract interface      │
│  │  ├─ WhisperAPI   │   (swap via env var)      │
│  │  └─ FunASR       │                           │
│  └────────┬─────────┘                           │
│           │ transcribed text                    │
│  ┌────────▼─────────┐                           │
│  │ PinyinService    │  pypinyin                 │
│  │ (both texts →    │  (authoritative Chinese   │
│  │  pinyin arrays)  │   pinyin conversion)      │
│  └────────┬─────────┘                           │
│  ┌────────▼─────────┐                           │
│  │ Comparison       │  difflib.SequenceMatcher  │
│  │ (align + score   │  (sequence alignment)     │
│  │  per character)  │                           │
│  └──────────────────┘                           │
│  → Returns: [{ char, expected_pinyin,           │
│     actual_pinyin, status }]                    │
└─────────────────────────────────────────────────┘
```

## Key Files

### Backend (`backend/app/`)

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app, CORS, health endpoint |
| `config.py` | Settings from .env (API key, backend choice) |
| `routers/evaluate.py` | POST /api/evaluate — orchestrates transcription + comparison |
| `services/transcription/base.py` | Abstract `TranscriptionService` interface |
| `services/transcription/whisper.py` | OpenAI Whisper API implementation |
| `services/transcription/funasr_backend.py` | Local FunASR/Paraformer implementation |
| `services/transcription/factory.py` | Creates the right backend from config |
| `services/pinyin_service.py` | `get_pinyin()` — text → [(char, pinyin)] pairs; `decompose_pinyin()` — split into initial/final/tone |
| `services/comparison.py` | `compare_pronunciation()` — aligns two pinyin sequences, classifies each character |
| `models/schemas.py` | Pydantic models: CharResult, EvaluationResponse |

### Frontend (`frontend/app/`)

| File | Purpose |
|------|---------|
| `page.tsx` | Main page — state management, wires components together |
| `components/TextInput.tsx` | Textarea for pasting Chinese text |
| `components/SentenceList.tsx` | Renders list of SentenceCards |
| `components/SentenceCard.tsx` | Single sentence with pinyin ruby text + color-coded results |
| `components/RecordButton.tsx` | Record/Stop button using MediaRecorder API |
| `lib/pinyin.ts` | pinyin-pro wrapper for client-side pinyin display |
| `lib/audio.ts` | Float32Array → WAV conversion, Blob → WAV via AudioContext |
| `lib/sentences.ts` | Split Chinese text on sentence-ending punctuation |
| `lib/api.ts` | `evaluatePronunciation()` — POST to backend |
| `types/index.ts` | TypeScript types shared across components |

## Audio Pipeline Detail

1. **Browser**: MediaRecorder captures audio as WebM/Opus chunks
2. **On stop**: chunks → single WebM Blob → decoded via AudioContext at 16kHz → Float32Array → WAV Blob (44-byte header + PCM16 data)
3. **Upload**: WAV sent as multipart/form-data to `/api/evaluate`
4. **Backend**: WAV bytes forwarded to Whisper API (or local model)
5. **Result**: transcribed Chinese text string

## Pinyin Comparison Detail

1. Both expected and transcribed text → `get_pinyin()` → list of (char, pinyin) pairs
2. Only CJK characters kept; punctuation/whitespace stripped
3. Pinyin lists aligned via `SequenceMatcher` (handles insertions, deletions, substitutions)
4. Each aligned pair classified:
   - **correct**: full pinyin match (e.g., "ni3" == "ni3")
   - **tone_wrong**: same initial+final, different tone (e.g., "ma1" vs "ma3")
   - **wrong**: different syllable entirely
   - **missed**: character in expected but not transcribed
5. Score = count(correct) / count(total expected characters)

## Design Decisions

- **Two pinyin libraries**: `pypinyin` (Python, server) for authoritative comparison; `pinyin-pro` (JS, client) for display only. pypinyin has better polyphonic character disambiguation.
- **Modular transcription**: abstract interface so we can swap Whisper → FunASR → anything else via env var.
- **Next.js proxy**: frontend rewrites `/api/*` to backend, so only one port needs tunneling for phone access.
- **No tone sandhi**: we compare against dictionary tones, not surface pronunciation. Pedagogically correct for learners.
