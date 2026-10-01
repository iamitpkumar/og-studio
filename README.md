# Motion OS — local editor

A local Windows video workspace at `http://127.0.0.1:3100`. The main route is the editor; the earlier product-to-video creator remains at `/create`. Future production address: `editor.ogstart.com`. Nothing is deployed there by this implementation.

## Start

Requires Node 22.13 or later in the Node 22 line, pnpm, and Chrome or Chromium. Dependencies are pinned in `pnpm-lock.yaml`. Run from this repository:

```powershell
pnpm install --frozen-lockfile
node scripts/dev.mjs
```

The command starts the loopback web service and local render worker. Keep it running during exports. FFmpeg and ffprobe are package dependencies; HyperFrames uses the installed Chrome. No API key is needed for editing, local command proposals, or rendering. An initial Chromium installation may be needed on another machine.

## Edit

Create a project, import media, then drag a library item to a track or use its + button. Drag a timeline clip to move it and its edges to trim it. Select a clip for text, transform, animation, audio and timing controls. Titles and captions have independent tracks. SRT/VTT import and SRT export are supported.

Space toggles playback; arrows step frames; Shift+arrow steps a second; S splits a selected clip; Delete removes it; Ctrl+Z and Ctrl+Shift+Z undo and redo. Edits save locally as immutable revisions. Export creates a real H.264 MP4 and an inspection contact sheet from the saved revision.

Director is a persistent conversation. Without a provider it is explicitly a limited local command helper: select a title and enter `Change selected text to “Made for more”`, `Make it fade`, or `Trim to 3 seconds`. Review the proposed operations before applying. The optional AI provider adapter uses the creator's processing preference and `.env.local` settings described in `.env.example`; its live creative performance has not been validated.

## External assistants

See [MCP connection guide](docs/MCP_CONNECTION.md). The server is pinned to one existing project. It shares the editor's command validation, revisions, history, locks and asset isolation. It does not execute agent code or expose arbitrary files. Broad or destructive edits require review in Director.

## Data and verification

Original media, SQLite records, proxies and exports are in ignored `data/motion-os`. Keep this directory when updating the app. Earlier `data/studio.db` and the legacy creator remain intact. Do not expose this development service to the public internet; it has no multi-user authentication.

```powershell
node --test tests/studio.test.mjs tests/editor.test.mjs tests/editor-mcp.test.mjs packages/db/test/db.test.mjs
node --experimental-strip-types --test packages/schemas/test/schemas.test.mjs packages/timeline/test/timeline.test.mjs
node apps/web/node_modules/typescript/bin/tsc --noEmit --project apps/web/tsconfig.json
node scripts/build.mjs
```

The database regression test requires the generated Prisma client; run `pnpm run test:setup` on a fresh installation. Tests use isolated databases under ignored `data/test-runs`.

With the app running, `node scripts/create-editor-fixtures.mjs`, then `node scripts/verify-editor.mjs`, then `node scripts/verify-editor-mcp.mjs` exercise real media ingestion and MCP editing. After the export completes, `node scripts/verify-editor-mcp-export.mjs` retrieves the real contact sheet through MCP and verifies output metadata. They create explicitly synthetic test projects and queue actual exports. These scripts do not validate browser drag gestures or subjective production quality.

Read [SOL.md](SOL.md), the [architecture audit](docs/EDITOR_AUDIT_AND_MIGRATION.md), and [milestone status](docs/EDITOR_STATUS.md) before extending the system.

### Production controls

Open the editor’s **Production** tab to connect timed speech transcription, AI voice and Runway footage. Imports now default to full-source timeline placement; Titles and Captions provide original rendered treatments. Export shows the actual saved-revision MP4. Provider keys and opt-in are required for AI calls; local editing and export work without them. Read [production capabilities, evidence and current limits](docs/PRODUCTION_PIPELINE.md).
