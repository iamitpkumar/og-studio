# Working notes — Opus 5.5 motion studio (from Movez course, 27 Sep 2026)

Source (read the full article here): https://x.com/0xMovez/status/2104216919033192746
Also: https://x.com/0xMovez/article/2104216919033192746
Author: Movez (@0xMovez). Substack: https://movez.substack.com/

These notes are a practical digest for PS TECH / Bob — not a verbatim copy of the article.

## Core idea
Opus writes a deterministic `seek(t)` / `draw(t)` program. Headless Chromium screenshots frames; ffmpeg stitches MP4. Prompt is ~10%; the harness (render, springs, beat grid, critique loop) is ~90%.

## 12-step outline
1. Pixels — model writes a program, not a video (routes A–D)
2. Setup — install studio (~10 min)
3. One-liner — showreel prompt pattern
4. Brand — point reel at product URL + real assets
5. Reference — style_guide.md + shotlist.md from ref frames
6. Spec — XML state list (UI morph, never cut)
7. Engine — index.html seek(t) + render.mjs + ffmpeg
8. Springs — closed-form, track() for multi-target values
9. Sound — beats.py / synthesize SFX on grid, −14 LUFS
10. Overnight — director brief (~9.5k–19k chars), gates + subagents
11. Critique — contact sheet, score 1–10, fix until 8+
12. Ship — multi-format layout(), package as skill, optional service

## Prompt size ladder (as reported)
- L1 one-liner ~150 chars, 15–50 min
- L2 brand reel ~350 chars, 30–45 min
- L3 state spec 1.5k–3k chars, ~1–2 h
- L4 director brief 9.5k–19k chars, 6–12 h autonomous

## Routes
- A Code-drawn: Canvas/SVG + Playwright (Opus default)
- B Framework: Remotion or HyperFrames
- C Mixed: image/video models + JS composite
- D Footage edit: real clips + captions

## Install (digest)
```bash
# Runtime
brew install node ffmpeg python   # or apt on Linux
pip install numpy librosa soundfile

mkdir motion-studio && cd motion-studio && npm init -y
npm i -D playwright && npx playwright install chromium

# Optional frameworks
npx skills add remotion-dev/skills
npx skills add heygen-com/hyperframes

# Optional hand-drawn plugin
claude plugin marketplace add buildwithhanif/claude-animation-skill
claude plugin install claude-animation@claude-animation-skill

claude --model claude-opus-5-5
# /model → Opus 5.5; effort xhigh for one-shots, max for flagship
```

## House rules to put in CLAUDE.md (paraphrased)
- Pure `window.seek(t)`; no CSS transitions / timers / rAF in render mode
- Seeded RNG only (never Math.random)
- `node render.mjs` → H.264 yuv420p CRF 16
- Ban: centered title on gradient, everything fades in, corner labels, glow chrome, particle bursts
- Critique loop: contact sheet → score → fix worst 3 → only then full render
- Sound on measured beat grid; −14 LUFS

## Showreel one-liner (public pattern used by several creators)
make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.

## Key files in a studio folder
CLAUDE.md, index.html, render.mjs, beats.py, beats.json, sfx.mjs, lib/motion.js,
docs/style_guide.md, docs/shotlist.md, docs/review_log.md, out/*.mp4, out/contact.png

## Repos named in the course
- https://github.com/JohnHeibel/PDoomVideo
- https://github.com/JohnHeibel/ClaudeAnimationBase
- https://github.com/buildwithhanif/claude-animation-skill
- https://github.com/heygen-com/hyperframes
- https://www.remotion.dev/docs/ai/skills
- https://github.com/WinterArc21/Battle-of-Austerlitz-Film
- https://github.com/guanmo-ai/awesome-ai-motion
- https://github.com/athemeroy/awesome-opus-5-5-videos

## Render defaults mentioned
60 fps, 4 subframes (tmix), 1080×1920, CRF 16, 120 BPM, −14 LUFS

Pulled for Amit 28 Sep 2026 ~20:30 IST by Jarvis.
