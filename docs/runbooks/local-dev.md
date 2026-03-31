# Local Development

## Prerequisites

- Python 3.11+ (verified: 3.14.3 on this machine)
- Node.js / npm
- OpenAI API key (for Whisper transcription)

## First-Time Setup

```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Create .env with your API key
cp ../.env.example .env
# Edit .env → set OPENAI_API_KEY=sk-...

# Frontend
cd ../frontend
npm install
```

Or from the project root:
```bash
make install-backend
make install-frontend
```

## Running

**Two terminals needed:**

```bash
# Terminal 1 — Backend (port 8000)
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Or:
```bash
make backend   # Terminal 1
make frontend  # Terminal 2
```

Open http://localhost:3000

## Running Tests

```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v
```

Or: `make test`

## Architecture Quick Reference

- Frontend proxies `/api/*` → `localhost:8000` via Next.js rewrites (see `next.config.ts`)
- No CORS issues in dev because of the proxy
- Backend uses lazy-loaded transcription service (first request initializes it)

## Switching Transcription Backend

Edit `backend/.env`:
```
TRANSCRIPTION_BACKEND=whisper   # OpenAI Whisper API (default, needs API key)
TRANSCRIPTION_BACKEND=funasr    # Local FunASR/Paraformer (needs: pip install funasr torch torchaudio)
```
