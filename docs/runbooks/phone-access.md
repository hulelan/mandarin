# Accessing from Phone (cloudflared tunnel)

## Overview

Uses Cloudflare's free "quick tunnel" to expose your local dev servers via a public HTTPS URL. **No account needed.** The URL is random and changes each time you restart the tunnel.

## Prerequisites

- `cloudflared` installed: `brew install cloudflared`
- Backend + frontend already running locally (see `local-dev.md`)

## Steps

```bash
# Terminal 3 (after backend + frontend are running)
cloudflared tunnel --url http://localhost:3000
```

This prints a URL like:
```
https://random-words-here.trycloudflare.com
```

Open that URL on your phone. That's it.

## Why This Works

- The frontend (Next.js on :3000) proxies `/api/*` to the backend (:8000) via rewrites
- cloudflared only needs to tunnel port 3000
- cloudflared provides HTTPS, which is required for browser microphone access on mobile

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Mic doesn't work on phone | Make sure you're using the `https://` URL, not `http://` |
| "Evaluation failed" error | Check that the backend is running on port 8000 |
| Tunnel URL not loading | Restart cloudflared — the URL may have expired |
| Slow transcription | Normal — Whisper API takes 2-5 seconds per sentence |

## Limitations

- URL changes every time you restart cloudflared
- Requires your Mac to be on and running all 3 processes
- Free tier has no bandwidth guarantees
