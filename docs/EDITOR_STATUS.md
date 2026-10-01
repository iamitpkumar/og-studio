# Local editor milestone status

Updated 1 October 2026. This is an engineering MVP, not a production-quality certification.

## Implemented

- Editor workspace with a real media library, actual layered media preview, independent tracks, drag/trim/split controls, editable titles, SRT/VTT captions, inspector, keyboard shortcuts and safe-area guides.
- Local immutable originals, hashes, metadata probing, browser proxies, thumbnails and audio waveforms; folder/tag search and byte-range streaming.
- Shared validated frame-based operations, project-scoped asset references, locks, transactional revisions, autosave, persistent undo/redo and stale-write rejection.
- HyperFrames adapter for real footage, images, text, captions, transforms, deterministic entrances/keyframes and audio, plus durable export jobs pinned to saved revisions.
- Persistent Director proposals, limited local command helper, optional AI adapter and explicit approval before proposed edits apply.
- Project-scoped stdio MCP server using the same repository and reducer. Structural/bulk/unselected edits require Director approval.
- Existing `/create`, legacy database and earlier rendering code preserved. Git checkpoints record the audit and editor implementation.

## Evidence

The synthetic acceptance project imported two actual videos, one image and one WAV. Its API test verifies source hashes, independent tracks, trim/split/rearrangement, animated title, SRT cues, undo/redo and reopening, Director approval, HTTP byte ranges, origin checks and asset isolation.

Project `4b6c0418-b77a-4b75-9e2e-7e7b0a06ddb7`, revision 12, exported job `14b3ae1b-72a7-4cf1-800a-294c782bc6af`: 1920×1080, 30 fps, 300 frames, 10 seconds, H.264 with stereo AAC. HyperFrames lint reported zero errors/warnings; full FFmpeg decode succeeded. A contact sheet was inspected. The content is explicit engineering test patterns, not client footage or a visual-quality benchmark.

That render took about 103 seconds, with browser capture the largest cost. HyperFrames reported a browser-close timeout after frame capture and forced shutdown; the resulting MP4 still passed validation. Export speed needs further work before a rapid-production claim.

Real MCP client tests passed for handshake, tool discovery, selected edits, stale revisions, proposal approval, project/job scope and rejected code execution. The live MCP acceptance changed only the selected title at revision 13; export `17339917-3fee-4118-8c5a-1da04b718b6f` completed at 1920×1080, 30 fps, 300 frames and 10 seconds with audio. The contact sheet was retrieved through MCP and visually inspected; it shows the new title with the original footage, overlay and captions. This render took 66.7 seconds. All 25 automated tests pass; TypeScript and the final production build pass.

## Outstanding gates

1. Browser gesture, playback/scrubbing and layout acceptance: the computer-use runtime fails to start in this environment. API tests and compilation do not substitute for these checks. Inspect the desktop editor and narrow layouts when browser automation is restored.
2. Live AI Director: no provider credentials or live generation test. It must be judged on real local brand projects before quality claims.
3. Codex/Claude model-session compatibility: SDK client handshake/edit tests pass; installed vendor CLI syntax is verified, but actual model-driven sessions are unverified.
4. Legacy “Open in editor” conversion remains planned. Existing projects remain available under `/create`; no automatic migration has rewritten them.
5. Advanced captions, generated B-roll, beat analysis, transitions, sophisticated motion/reference intelligence, layered quality evaluation, Skills Workshop and governed brand-memory learning are later milestones.
6. Browser/export pixel comparison, audio listening/sync assessment and the two-to-three-country creative benchmark have not been completed. Playback currently uses native media elements and frame-based transforms, not a guaranteed frame-locked professional audio engine.
7. Commercial deployment, authentication, collaboration, subscriptions and metering remain gated on local acceptance. The app remains on loopback, not `editor.ogstart.com`.

Local source/export files and test evidence are ignored by Git. Preserve the data directory; do not commit private assets or credentials.
