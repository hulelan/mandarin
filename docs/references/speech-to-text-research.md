# Speech-to-Text Model Research

Research conducted 2026-03-30 on STT options for Mandarin Chinese.

## Model Comparison

| Model | Type | Mandarin Accuracy | Cost | Latency | Notes |
|-------|------|-------------------|------|---------|-------|
| **OpenAI Whisper API** | Cloud | ~95-97% | $0.006/min | Batch (2-5s) | Current default. Simple, reliable. |
| **Whisper (local)** | Local | Same model | Free | ~5-10s/segment | Needs good GPU. `faster-whisper` for speed. |
| **FunASR/Paraformer** | Local | Excellent for Chinese | Free | TBD | Alibaba DAMO Academy. Purpose-built for Mandarin. Often beats Whisper on Chinese. |
| **SenseVoice** | Local | Good | Free | TBD | FunAudioLLM. Multilingual with strong Chinese. |
| **Google Cloud STT (Chirp 3)** | Cloud | ~95-97% | Pay-per-use | Streaming capable | Word-level timestamps + confidence scores. More complex setup. |
| **ElevenLabs Scribe** | Cloud | Very good | Pay-per-use | Fast | Character-level timestamps. Supports regional accents. |
| **AssemblyAI** | Cloud | Good | $0.0025/min | <300ms streaming | Best latency for real-time. |

## Current Choice: Whisper API

Selected for MVP because:
- Simplest integration (one API call)
- Good Mandarin accuracy out of the box
- `language="zh"` hint prevents misidentification
- Cheap enough for personal use

## Next to Try: FunASR/Paraformer

- Specifically optimized for Mandarin Chinese
- Runs locally (no API key, no cost, no latency to cloud)
- Already stubbed in the codebase (`services/transcription/funasr_backend.py`)
- Install: `pip install funasr torch torchaudio`
- Model: `paraformer-zh` (auto-downloads ~1GB on first use)

## Key Technical Notes

- Always pass `language="zh"` to Whisper — without it, short phrases may be misidentified as another language
- Whisper returns characters, not pinyin — we convert to pinyin server-side for comparison
- For streaming (future): Google Cloud STT or AssemblyAI are better suited than batch Whisper
