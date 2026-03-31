# Design Decisions

Decisions made during initial build (2026-03-30) and their rationale.

## 1. Sentence-at-a-time vs Continuous Reading

**Decision:** Start with sentence-at-a-time, add continuous later.

**Why:** Sentence mode is simpler to implement correctly — we know exactly which text the user is trying to read. Continuous mode requires position tracking (where in the text is the user?) which adds complexity. Sentence mode is also more useful for beginners who want focused practice.

## 2. Two Separate Pinyin Libraries

**Decision:** `pypinyin` (Python, server-side) for comparison; `pinyin-pro` (JS, client-side) for display.

**Why:** `pypinyin` is the gold standard for Chinese polyphonic character disambiguation (characters like 了 that have multiple pronunciations depending on context). Using it server-side for the authoritative comparison ensures accuracy. `pinyin-pro` is used client-side only for displaying pinyin annotations above characters — instant, no round-trip needed.

## 3. Modular Transcription Interface

**Decision:** Abstract `TranscriptionService` base class with swappable backends.

**Why:** We want to experiment with different models. Whisper API is simplest to start, but FunASR/Paraformer (local, free, Chinese-optimized) is likely better long-term. The interface is `async def transcribe(audio_bytes) -> str` — any model that takes audio and returns Chinese text can plug in.

## 4. WAV as Audio Format

**Decision:** Convert all audio to 16kHz mono WAV before sending to backend.

**Why:** WAV is universally supported by all STT models. Converting in the browser (MediaRecorder WebM → AudioContext decode → Float32 → WAV) means the backend doesn't need to handle format conversion. 16kHz is the standard for speech recognition.

## 5. Next.js Proxy Instead of Direct CORS

**Decision:** Frontend rewrites `/api/*` to backend via `next.config.ts`, rather than the frontend calling the backend directly.

**Why:** This means only one port (3000) needs to be exposed for phone access (via cloudflared tunnel). No CORS configuration needed in production-like setups. The frontend uses relative URLs (`/api/evaluate`) which just work regardless of how it's hosted.

## 6. No Tone Sandhi in Comparison

**Decision:** Compare against dictionary tones, not surface pronunciation.

**Why:** In Mandarin, two consecutive third tones cause the first to become second tone (e.g., "你好" is pronounced "ní hǎo" not "nǐ hǎo"). But learners should know the dictionary tones. Marking a sandhi case as "tone wrong" is pedagogically acceptable — and avoids implementing sandhi rules for MVP.

## 7. No Database for MVP

**Decision:** No persistence. Each session is stateless.

**Why:** Adding a database adds complexity without helping the core use case (paste text, read, get feedback). Progress tracking is Phase 4 in the roadmap.
