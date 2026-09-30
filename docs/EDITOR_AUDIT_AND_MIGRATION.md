# Motion OS editor audit and migration

Date: 1 October 2026. The owner's editor-first engineering prompt supersedes the earlier prompt-first UX plan. Audit completed before new editor application code.

## Repository audit

| Area | Evidence | Assessment |
| --- | --- | --- |
| Frontend | Next.js 15.5.25, React 19, TypeScript, Tailwind 3, Lucide; `apps/web` | Working creation/review flow; no professional timeline or canvas manipulation. Preserve self-hosted Manrope/DM Sans and restrained glass styling. No shadcn dependency currently. |
| Backend | Next route handlers, Node 22.13, native SQLite, independent worker | Local-only host/origin guards, request body limits, durable render jobs, leases and failure recovery work. No user/tenant identity yet; keep loopback binding. |
| Persistence | `data/motion-os/studio.sqlite`, immutable scene revisions | Product snapshots, scene locks, stale revision detection and idempotency tested. Schema v2 is contiguous scene based and cannot model independent tracks. |
| Earlier database | Prisma 6.19.3 schema, `data/studio.db` | Preserved. Generated client restored; regression test now uses an isolated temporary database. No automatic migration or merging of private project data. |
| Timeline package | Zod millisecond schema and storyboard compiler | Reusable concepts and tests. No complete editing reducer, frame operations, command journal, or interactive timeline. Keep legacy exports; introduce a versioned frame model alongside them. |
| HyperFrames | 0.8.96 CLI, GSAP 3.14.2, HTML scene compiler | Actual 15s vertical and square MP4 exports completed. Worker checks layout then probes output. Current compiler uses five scene types and cannot edit arbitrary footage. Preserve it as the v2 adapter. |
| Remotion | `packages/video-templates` | Existing composition and five caption implementations are retained. Defaults are hardcoded real-estate demonstration copy, not production footage. Not connected to the new local worker. Commercial licensing review remains a launch prerequisite. |
| Assets | Product-scoped PNG/JPEG/WebP uploads, hashes | Originals stored locally. Missing video/audio ingestion, metadata probing, proxies, thumbnails, searchable folders/tags and timeline asset references. |
| AI | Optional OpenAI-compatible JSON scene planner | Requires environment credentials and explicit external processing preference. No live provider validation performed. No persistent conversation, scoped timeline operations or MCP server. |
| Quality | Frame timing validation, HTML escaping, HyperFrames check, ffprobe | Technical checks work; subjective visual quality is not certified. Square decorative geometry can overlap copy. No beat analysis, audio QA or benchmark feedback loop. |
| Documents | `.agents` master/design/caption plans, Movez notes; three `docs/MOTION_OS_*` plans | Read. `SOL.md`, repository `AGENTS.md`, `README.md`, `MOTION_OS_MOVEZ_INTEGRATION.md` were absent. The pasted storage instruction applies. No project-specific skills directory exists. Installed HyperFrames skills remain external tools, not bundled application skills. |
| Source control | `git status` reports no repository | Initialize source control for incremental checkpoints; exclude private databases, originals, exports, keys and generated caches. No remote publishing requested. |

Baseline checks: 10 persistence/request/legacy database tests and 5 schema/timeline tests pass; TypeScript and Next production build pass. The bundled pnpm wrapper attempts network installation even for test scripts; direct Node test commands are reliable. Prisma `db push` failed with an uninformative schema-engine error; isolated regression setup now uses generated migration SQL and native SQLite, then verifies real Prisma queries. No mocked success is counted.

## Public reference research

Reviewed https://www.cardboard.ai/ and https://www.cardboard.ai/changelog on 1 October 2026. Their public documentation describes a media library, independent timeline tracks, trimming/splitting, scrubbing, direct canvas changes, persistent Director chat and bring-your-own Claude/Codex agents. These inform workflow priorities only. No Cardboard source, branding, UI assets or undocumented APIs are incorporated. Public claims do not prove compatibility with any particular installed agent version.

## Architecture decision

Retain Next/React, SQLite, the local filesystem, FFmpeg and HyperFrames. Add a renderer-neutral v3 frame timeline and one pure validated operation reducer. Browser controls, HTTP services and later MCP calls must enter the same reducer and transactional repository. Do not add PostgreSQL, queues requiring infrastructure, billing or remote access at this milestone.

Model: sequence settings → ordered independent tracks → clip instances referencing immutable assets. Clips carry source in-frame, start/duration, text/caption content, transform, animation and audio settings. All timings are integer sequence frames. Revisions store full immutable snapshots plus operation journals; optimistic version checks reject stale clients. Undo/redo creates a new revision while restoring a prior snapshot; it never erases history.

Media: preserve original bytes under content hashes; probe actual formats; derive browser-friendly video/audio and thumbnails separately. Reject unsupported or invalid media. Project asset links prevent cross-project references. Stream media with HTTP byte ranges for seeking. No arbitrary filesystem paths in browser or agent commands.

Rendering: select adapter by schema version. Keep v2 scene renderer intact. The v3 adapter compiles the same saved timeline into HyperFrames media clips and deterministic transform/text animation. The browser preview reads the same frame/easing contract. Validate dimensions, duration, streams and missing assets; final export pins a saved revision. Remotion stays optional and unchanged.

## Incremental migration

1. Keep existing databases, revisions, exports and media untouched. Preserve the current creator under `/create`.
2. Add independent editor tables in the current local database. Default `/` becomes project workspace/editor. New projects use v3 only.
3. Explicit “Open in editor” migration copies a legacy v2 composition to a new v3 project; retain source project/revision IDs and all original records. Preserve the legacy renderer as a composition asset where a lossless conversion is unavailable. Never silently reinterpret legacy visuals.
4. Build real media import, multitrack editing, text/captions, playback, revisions and export before AI/MCP.
5. Add conversation/proposed operations and provider adapters after command tests pass. Add scoped stdio MCP after shared-service tests pass; do not claim Codex/Claude compatibility until a real client handshake and edit cycle are demonstrated.
6. Advanced motion, scoped brand memory, approved skill publication, learning and commercial services remain separate acceptance gates.

## Acceptance evidence to record

Use explicit synthetic fixtures (two videos, one image, one audio file), never counterfeit client assets. Import originals, insert on tracks, trim/rearrange, add title/captions, play/scrub, reopen, undo/redo, render MP4 and inspect representative frames plus audio. Keep operation, serialization, isolation, stale-write and render tests. Distinguish programmatic integration tests from actual browser gestures. Record unfinished requirements candidly in milestone status.
