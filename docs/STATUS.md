# Project Status

**Last updated:** 2026-03-30

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Backend (FastAPI) | ✅ Built | Evaluate endpoint, pinyin comparison, 15 tests passing |
| Transcription — Whisper API | ✅ Built | Needs OPENAI_API_KEY in .env |
| Transcription — FunASR/Paraformer | ⚠️ Stub | Code written, not tested (needs `pip install funasr torch`) |
| Frontend (Next.js) | ✅ Built | Text input, sentence display, pinyin annotations, recording, results |
| Audio recording — Manual mode | ✅ Built | MediaRecorder → WAV conversion |
| Audio recording — VAD mode | ❌ Not started | @ricky0123/vad-react planned |
| Tunnel (cloudflared) | ⚠️ Ready | Installed, not yet tested end-to-end |
| Phone access | ❌ Not tested | Blocked on: .env setup + first run |

## What Works End-to-End

Nothing has been tested end-to-end yet. All components are built but the backend hasn't been started with a real API key.

## Immediate Next Steps

1. Add `OPENAI_API_KEY` to `backend/.env`
2. Start backend + frontend, test locally
3. Run `cloudflared tunnel --url http://localhost:3000` for phone access
4. Test full flow: paste text → record → see results

## Known Issues

- None yet (no end-to-end testing done)
