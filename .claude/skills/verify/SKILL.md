---
name: verify
description: Build, run, and visually verify the PakSoc app (Vite + React in app/) with headless Chrome screenshots
---

# Verifying changes in this repo

The app lives in `app/`. All commands run from there.

## Build & serve

```powershell
cd app
npm run build        # tsc && vite build (~7s)
npm run preview      # serves dist/ at http://localhost:4173 (run in background)
```

`npm run dev` also works but preview exercises the production bundle (PWA
service worker, chunking) which is what matters here.

## Screenshot with headless Chrome

Chrome is at `C:\Program Files\Google\Chrome\Application\chrome.exe`
(Edge fallback: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`).

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --headless=new --disable-gpu --user-data-dir="<scratch>\profile-N" `
  --window-size=1440,900 --hide-scrollbars --virtual-time-budget=9000 `
  --screenshot="<scratch>\out.png" "http://localhost:4173/"
```

Gotchas learned the hard way:

- **Fresh `--user-data-dir` per invocation** — reusing one silently produces
  no output file. Screenshots also intermittently fail to write on the first
  try or when two Chrome instances run in parallel; run sequentially and
  retry once before assuming breakage.
- **`--virtual-time-budget=9000` is required** — the ambient canvases
  (`DustCanvas`, `MouseSpotlight`) mount via `requestIdleCallback` and draw
  on rAF; without virtual time the screenshot fires before they exist.
- **Viewport width must be ≥1024 to see canvas effects** — `AmbientBackground`
  treats `(max-width: 1023px), (pointer: coarse)` as a "lite device" and
  renders CSS gradient layers only.
- `--force-device-scale-factor=2` works for zoomed inspection of tiny
  effects (stars, grain). `--force-prefers-reduced-motion` verifies the
  reduced-motion path (ambient background hidden entirely).
- `--dump-dom` (same flags) is the quickest way to confirm ambient DOM
  nodes mounted (`ambient-dust`, `ambient-aurora-ribbon`, ...).

## What to eyeball

- Homepage `/` — hero countdown ticking, events row, social wall, ambient
  background (aurora gradients + star/dust canvas behind everything).
- Mobile (390x844) — lite background path, no horizontal scroll.
- The homepage fetches real Supabase data; no local env needed for a
  visual pass.
