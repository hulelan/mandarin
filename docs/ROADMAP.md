# Roadmap

## Problem

When studying Mandarin by reading Chinese text (from PDFs, websites, etc.), there's no easy way to check if you're pronouncing the characters correctly. Existing apps are course-based — they don't let you bring your own text.

## Current State (MVP — Phase 1)

**Sentence-at-a-time mode:**
- Paste Chinese text → auto-split into sentences with pinyin annotations
- Select a sentence → record yourself reading it → get color-coded feedback
- Comparison at 3 levels: correct (green), tone wrong (orange), wrong syllable (red)

## Phase 2 — VAD & Continuous Reading

- Add Voice Activity Detection (VAD) using @ricky0123/vad-react
- Toggle between manual record/stop and auto-detect mode
- In VAD mode: just read continuously, speech segments auto-detected on pauses
- Sequential position tracking — cursor advances through sentences as you read

## Phase 3 — Local Models & PDF Input

- Test and integrate FunASR/Paraformer as local Chinese STT (free, no API key needed)
- PDF text extraction (paste from PDF is already possible, but proper upload + extraction)
- URL input — paste a webpage URL, extract Chinese text automatically

## Phase 4 — Learning Features

- Progress tracking per sentence (SQLite or similar)
- Spaced repetition — re-surface sentences you got wrong
- Per-character error history — show which characters you consistently mispronounce
- Overall accuracy stats over time

## Future Ideas (Unscoped)

- Tone contour visualization (pitch graph overlay showing your tones vs expected)
- Streaming transcription for real-time feedback as you speak
- Traditional Chinese support
- Export problem characters to Anki flashcards
- Multi-user support / accounts
