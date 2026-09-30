# AI VIDEO STUDIO
## Complete product, architecture and implementation plan

**Version:** 1.0  
**Prepared:** 16 September 2026  
**Scope:** Private, local-first AI-assisted video production for real estate, e-commerce, manufacturing and technology clients.  
**Primary deliverables:** Editable video projects and ready-to-post 9:16, 16:9 and 1:1 exports.

> **Product thesis:** Build a production system, not a single-model video generator. Specialized AI stages turn a client brief into an editable, verifiable video. Independent stages, immutable outputs and selective reruns make quality improvements affordable and repeatable.

---

# 1. Executive decisions

1. **Start local on Windows.** Run the dashboard, API, database, job worker and renderer on the owner's PC. Cloud AI generation still needs internet access and paid API credentials. No public server or cPanel deployment is necessary for private testing.
2. **Build one shared engine with industry-specific workflows.** Real estate, fashion/e-commerce, manufacturing/fragrance and SaaS use the same projects, assets, timeline, model gateway and renderer; only their briefs, templates and QA checks differ.
3. **TypeScript-first.** Next.js/React frontend; Fastify API; PostgreSQL and Prisma; Redis/BullMQ initially; Remotion and FFmpeg for deterministic composition/rendering. Integrate installed HyperFrames/GSAP for reusable motion compositions after verifying its CLI, render compatibility and licensing.
4. **Use supported provider APIs, not consumer website automation as production infrastructure.** OpenAI API, Anthropic API, video/voice/avatar providers, and optional coding-agent integrations. ChatGPT/Claude subscriptions, Codex access and API entitlements are separate; check each provider's current availability and terms.
5. **A prompt produces an editable project, never only a flattened MP4.** Agents output versioned structured artifacts. Users can edit an individual scene, caption, voiceover or B-roll and regenerate affected outputs only.
6. **Human approval gates.** Require explicit approval for third-party likeness/voice usage, factual property claims, product fidelity, legal disclosures and final client delivery.
7. **Avoid overbuilding.** Demonstrate one 20–30 second end-to-end vertical video first; grow into a robust 30–90 second, multi-industry production tool. A 24-hour prototype is possible only with narrow scope and ready API credentials; production readiness is not a 24-hour promise.

# 2. Product scope and users

**Primary user:** Owner/operator producing videos for multiple client brands. Initial access: one local admin account, no public registrations, subscriptions, payment gateway or multi-tenant SaaS.

**Primary video formats:** 1080×1920 vertical, 1920×1080 landscape, 1080×1080 square; adjustable FPS (default 30), duration target 15–90 seconds; MP4 H.264/AAC delivery. 4K and other codecs are later enhancements after benchmarks.

**Core screens:** Dashboard; Clients & Brand Kits; Projects; Brief Wizard; Script & Storyboard; Asset Library; Avatar Studio; Video Generator; Timeline Editor; Motion Template Library; Sound & Captions; Review/QA; Render Queue; Export History; Settings/Providers/Costs.

**Project entities:** client, brand kit, property/product fact sheet, brief, reference, script, storyboard, scene, asset, generation request, timeline, edit operation, QC report, render, export, provenance and usage record.

## 2.1 Industry-specific workflows

| Studio | Inputs | Outputs and differentiators | Critical checks |
|---|---|---|---|
| Real estate | Approved property facts, room/site photos, videos, map/floor plans, logo, agent script | Walkthrough, flat/house tour, plot promotion, neighborhood explainer, launch ad, construction update; room labels, floorplan cards, verified feature callouts | Do not fabricate room dimensions, road access, construction stage, permissions, distances, pricing or property views. Mark AI reconstructions illustrative. |
| Fashion/e-commerce | Original product photos, exact fabric/print/fit reference, model consent, size chart, brand kit | Model showcase, UGC-style talking presenter, outfit try-on, close-up product clips, social ad | Preserve garment colors, print, neckline, sleeve length, proportions; avoid invented product claims and fake personal testimonials. |
| Manufacturing / fragrance | Product imagery, approved ingredient and production information, factory footage | Product showcase, ingredient story, manufacturing overview, B2B explainer, premium brand film | Verify composition, compliance and performance claims; do not simulate real factory footage as documentary evidence. |
| Tech / SaaS | Approved UI captures, product copy, demo recording, logo | Feature demo, founder presentation, onboarding, release short, product explainer | Keep UI screens and advertised capabilities accurate; use actual recordings where appropriate. |

**Avatar options:** user-owned digital twin with documented consent; licensed stock/synthetic presenters; scripted voice-only narration; picture-in-picture presenter; presenter with captions and supporting B-roll. Keep voice-clone consent and provider policy requirements explicit.

# 3. Production experience

**Entry points:** (A) Auto Director: brief → draft storyboard → approval → production → editable first cut; (B) Manual Studio: create blank project, insert footage/assets and templates, edit timeline; (C) AI Editor: natural-language commands applied to selected project/scenes.

**Brief Wizard fields:** client, project type, format, target length, platform, audience, language, tone, CTA, deliverable count, reference video(s), required shots, forbidden claims, assets, avatar/voice preference, visual style, caption style, music policy, budget ceiling and delivery priority. Upload reference videos only with appropriate rights.

**Review modes:** storyboard approval, asset selection, rough cut, final export. Auto Director can batch routine decisions but must not silently invent missing source facts or silently publish.

# 4. End-to-end stage architecture

Each stage consumes *named immutable input versions* and writes a *typed, validated output*. The orchestrator records stage state (`pending`, `running`, `waiting_for_approval`, `completed`, `failed`, `cancelled`), dependencies, attempts, cost and outputs. Stage outputs are content-addressed where practical.

| Stage | Agent / service | Input → output | Approval / failure strategy |
|---|---|---|---|
| 00 Intake | Brief parser | Prompt/files → normalized brief, missing facts, constraints | Ask for material omissions; reject unsupported requests |
| 01 Source analysis | Vision + metadata services | Assets → descriptions, dimensions, timestamps, transcript, provenance | Flag questionable source or missing rights |
| 02 Creative direction | Director agent | Brief + references → style, narrative hook, pacing, treatment | Human approves creative direction on major jobs |
| 03 Script & claims | Writer + fact checker | Treatment + approved fact sheets → script and claim map | Unsupported claims blocked; copy approval |
| 04 Storyboard | Storyboard agent | Script → scene graph, shot list, time budget | Editable scene-by-scene approval |
| 05 Production planner | Scheduling/cost agent | Approved scene graph → provider tasks, budgets, dependencies | Show estimates before paid jobs |
| 06 Asset creation | Parallel avatar, image, video, TTS services | Shot specifications → clips/audio/images | Retry failed shots; select alternates |
| 07 Timing and transcript | Speech alignment + media tools | Approved audio/clips → word timestamps, shot lengths | Flag misalignment / missing media |
| 08 Editing | Timeline planner | Scene graph + assets → timeline JSON | Editable non-destructive rough cut |
| 09 Graphics/audio | Template engine + mixer | Timeline → graphics, captions, transitions, sound mix | Brand safe area and caption checks |
| 10 Quality control | Automated tests + multimodal reviewer | Preview + facts → issue report | Block critical issues, suggest targeted fixes |
| 11 Render & delivery | Remotion/FFmpeg workers | Approved timeline → MP4, thumbnail, captions, project snapshot | Technical probe, verify files, export |

**Parallelism:** Avatar, B-roll and audio generation can run concurrently only after prerequisites are approved. Transcription depends on final audio; captions depend on word alignment; final rendering depends on approved media and timeline. Avoid unnecessary generation before the storyboard is locked.

**Stage repeatability:** Changing a caption should not regenerate the avatar. Replacing B-roll should invalidate its scene preview and final render but preserve approved script/audio. Changing narration invalidates related avatar/lip-sync, word timing and captions. Use a dependency DAG and dirty-node propagation.

# 5. AI model gateway and agent design

## 5.1 Interfaces

Define adapter capabilities rather than brand-specific code in the core: `analyzeText`, `analyzeImage`, `analyzeVideo`, `generateStructuredPlan`, `generateImage`, `generateVideo`, `generateAvatar`, `synthesizeSpeech`, `transcribeAudio`, `getJobStatus`, `cancelJob`, `downloadAsset`.

Each adapter reports model/version, capability flags, accepted inputs, maximum duration/resolution, price estimate where available, latency estimate, output rights and provider status. **Do not assume** every provider supports true multi-angle scene reconstruction, image-to-video, face consistency, exact camera control or API access: verify before enabling a feature.

**Suggested initial candidates (subject to API documentation, account access, current prices and terms):** OpenAI or Anthropic for planning, HeyGen or another licensed avatar API, one supported video-generation API for B-roll, ElevenLabs or compatible TTS for voice, and supported transcription API/local model. Codex/coding agents maintain templates and application code; routine edits use a restricted command API, not unrestricted generated source code.

## 5.2 Specialist agents

- Intake agent: extracts intent, constraints, missing information, input rights.
- Brand and fact agent: maintains approved client facts, vocabulary, logo usage, restricted claims.
- Creative director: proposes narrative arc, hook, visual language and rhythm.
- Scriptwriter: writes narration and on-screen text; attaches claim references.
- Storyboard agent: creates scene timing, shot requirements and transitions.
- Asset director: decomposes scenes into provider-ready shots, validates product/property fidelity.
- Avatar and voice director: selects consented presenter/voice and aligns delivery.
- Editing director: builds timeline and applies natural-language edits through tools.
- Motion designer: selects and parameterizes reviewed templates; proposes new templates for separate approval.
- Audio designer: balances speech, music and sound effects.
- QC reviewer: inspects factual, technical, identity, brand and visual issues.

Agents may share the same underlying LLM initially. Logical specialization comes from distinct tools, schemas, instructions, budgets and evaluations, not from paying for a different model for every role.

## 5.3 Agent message contract

Use JSON Schema/Zod with explicit `schema_version`, `project_id`, `stage_id`, `input_artifact_ids`, `model_id`, `skill_version`, `prompt_version`, `output`, `warnings`, `claims`, `estimated_cost`, `created_at`. No free-form prose as the sole inter-stage contract. Validate output; retry schema repair at most a bounded number of times, then request human intervention.

**Example scene record:**

```json
{
  "schema_version": "1.0",
  "scene_id": "scene_004",
  "start_ms": 18000,
  "duration_ms": 6000,
  "narration_asset_id": "audio_12",
  "visual_asset_id": "clip_37",
  "caption_template_id": "caption_bold_02",
  "motion_template_id": "glass_property_card_01",
  "fact_ids": ["property_fact_21"],
  "safe_area": "vertical_social",
  "approval_state": "approved"
}
```

## 5.4 Router, budgets and fallback

Choose providers by needed capability, approved content policy, output quality tests, format, credits, estimated price and observed success rate. Set project and stage spending caps; queue expensive jobs for approval. Provider fallback is permitted only when equivalent functionality and consent/rights are verified. Log API responses without storing secrets; hash prompt inputs if needed for privacy.

# 6. AI editing: natural language → safe operations

User example: "Replace the kitchen shot in scene four, keep my narration and captions, slow the opening, and add a frosted-glass price card."

1. Resolve scene references and inspect current timeline.
2. Agent proposes a typed edit plan and affected dependencies.
3. Validate required assets, facts, style parameters and spend.
4. Show preview/diff for high-impact edits; require approval for paid regeneration.
5. Apply commands to a new project revision; never mutate source assets.
6. Regenerate only dirty nodes; render proxy then full-quality output.
7. Support undo/redo and compare versions.

**Allowed commands:** `insertScene`, `deleteScene`, `reorderScene`, `trimClip`, `replaceAsset`, `setVoiceover`, `setCaptionStyle`, `addMotionTemplate`, `setMusic`, `adjustMix`, `setTransition`, `setCameraTreatment`, `updateText`, `renderPreview`, `renderFinal`.

**Security:** AI never gets raw shell access, SQL, unrestricted filesystem writes or arbitrary executable code by default. New generated effects/templates undergo code review and sandboxed test renders before activation. Use a permissioned tool registry with validated parameters.

# 7. Video engine and motion design

**Remotion:** React/TypeScript compositions, reusable templates, frame-based timing, caption overlays and final sequence control. **FFmpeg:** probe, trim, transcode, concatenate where appropriate, loudness normalization, audio mixing, subtitle extraction and output validation. **HyperFrames + GSAP:** advanced HTML-based motion compositions, kinetic typography, dynamic cards and transitions; integrate as an optional composition/render pathway after compatibility tests. Avoid overlapping two independent timeline authorities: store all timing in a canonical timeline JSON and compile it into the selected renderer.

## 7.1 Motion template library

- Glass UI: frosted cards, transparent panels, controlled blur, light refraction accents, property price/feature cards.
- Kinetic typography: word-by-word reveal, masked headline, tracking/scale entrance, punchy product hook.
- Presenter-aware layout: foreground presenter mask, text behind subject where segmentation quality allows, otherwise safe fallback layout.
- Real estate: room label, floorplan spotlight, location route, amenity grid, verified metric counters, comparison split screen.
- E-commerce: product spotlight, fabric/ingredient detail card, model plus product cutaway, offer strip and CTA.
- SaaS: screen framing, cursor focus, annotated feature highlight, UI zoom and step indicator.
- Audio-reactive motion: restrained beat sync; speech intelligibility must take priority.

**Premium-design rules:** define a DESIGN.md per brand (fonts, palette, movement, caption positions and forbidden treatments); layout keyframes before animation; consistent safe areas; deliberate easing; limited simultaneous effects; avoid generic stock overlays. Preserve accessibility and legibility on small screens.

## 7.2 Camera directions and limitations

Real source video permits authentic trims, zooms, reframes and stabilized crops. Generated alternative viewpoints are **synthetic**, may change architecture, garments or product packaging, and must be treated as illustrative rather than verified footage. Provide controls for pan, tilt, push-in, orbit and tracking only where the selected method genuinely supports them; avoid promising physically accurate reconstruction from a single image.

## 7.3 Captions and audio

Word-level timestamps from forced alignment/transcription; editable transcript; preset caption families; speaker-safe placement; multilingual font shaping tests. Separate tracks for voice, music and SFX. Duck music under speech; apply loudness checks and clipping detection. Source licensed music and keep license evidence. Export optional SRT/VTT plus burned-in captions.

# 8. Data model and storage

**Relational tables:** `users`, `clients`, `brand_kits`, `projects`, `briefs`, `sources`, `fact_sheets`, `facts`, `scripts`, `storyboards`, `scenes`, `assets`, `asset_versions`, `generation_jobs`, `stage_runs`, `stage_dependencies`, `timelines`, `timeline_versions`, `edit_operations`, `approvals`, `qc_reports`, `render_jobs`, `exports`, `provider_configs`, `usage_events`, `skill_versions`.

**Identifiers:** UUID/ULID; DB holds metadata and filesystem/S3 object references, not large video blobs. Store asset checksum, MIME type, size, dimensions, frame rate, duration, source provider, consent/license status, project association and creation time. Use private storage with project-based paths and encrypted API keys.

**Local storage example:**

```text
video-studio/
  apps/web/
  apps/api/
  packages/schemas/
  packages/agent-gateway/
  packages/workflow/
  packages/timeline/
  packages/render-templates/
  workers/render/
  workers/media/
  skills/
  infra/
  data/assets/{project-id}/
  data/previews/{project-id}/
  data/exports/{project-id}/
```

Keep a write-ahead/history record of editing changes; nightly DB backups and separate asset backup. Set asset retention and cleanup rules for high-volume intermediates. For future shared deployment, use S3-compatible storage and signed URLs.

# 9. Local Windows deployment and later scaling

**Initial:** Windows 11 PC; local Next.js and Fastify services; PostgreSQL and Redis via Docker Desktop/WSL2 or native supported installs; FFmpeg available to render workers; Remotion/Chromium runtime verified; local assets on a dedicated disk; use a Windows startup script or process supervisor. Heavy AI generation occurs in provider clouds; rendering uses local CPU/GPU as supported by the actual renderer. Measure performance on the owner's machine rather than assuming a GPU automatically accelerates all Remotion output.

**Later optional:** Keep cPanel hosting only for a lightweight dashboard/API if technically appropriate; use AWS Lightsail or EC2 for dedicated workers and S3 for storage. Avoid rendering heavy videos on shared cPanel hosting. Add hosted Redis/PostgreSQL as needed; use VPN/private access and TLS for remote operations.

**Scaling trigger:** migrate when multiple concurrent renders, remote collaborators, uptime requirements or local storage pressure justify it. Do not introduce Kubernetes, public auth, billing or multi-region infrastructure into the MVP.

# 10. Reliability, privacy, copyright and safety

- Obtain documented consent for real-person avatars, face images and voice cloning; provide deletion/revocation workflow.
- Verify provider commercial-use rights, training/data-retention terms, music licenses, image ownership, and Remotion/HyperFrames licensing before client delivery or SaaS resale.
- Preserve product and property authenticity; label synthetic reconstruction/illustrations where relevant.
- Store API keys in environment/OS secret store; never ship keys to browser; restrict filesystem access and render-worker privileges.
- Validate uploads, MIME types, length, codec, file size and decompression limits; do not directly execute untrusted media metadata or arbitrary agent-generated code.
- Redact secrets and sensitive client data from logs. Track provenance of every claim and media item.
- Use idempotency keys, bounded retries, backoff, provider rate limits, cancellable jobs, cost caps and timeout recovery.
- Manual review for deceptive testimonials, unsupported claims, misleading property representations and unapproved identity usage.

# 11. Quality assurance and measurable acceptance criteria

**Functional:** Create client and brand kit; enter brief; upload assets; approve storyboard; generate/choose clips; create captions; preview; change one scene; undo; render and download with project snapshot.

**Technical:** MP4 decodes, A/V synchronization within defined tolerance, no missing frames/black frames, correct dimensions/FPS, no clipping, export metadata correct, captions inside safe areas, no unapproved resource requests.

**Creative:** Review hook clarity, shot continuity, visual/product fidelity, typography legibility, transition pacing, voice intelligibility and brand consistency. Record human scores per criterion; do not use one opaque overall AI quality score as a release gate.

**Regression fixture:** Maintain reference briefs and approved output frames for a property tour, fashion showcase, fragrance ad and SaaS explainer. Run automated checks and human comparisons when model, prompt, template or renderer versions change.

**MVP exit gate:** One actual 20–30-second client-style vertical video can be created end-to-end, edited without losing project data, exported successfully and reproduced after restarting the app. The resulting output still requires human creative review.

# 12. Development roadmap and deliverables

These are estimates for one focused developer aided by coding agents, **not guaranteed deadlines**.

| Phase | Window | Deliverable | Exit condition |
|---|---|---|---|
| 0 - Discovery | Day 0–1 | Provider/API and licensing matrix; reference outputs; concrete quality bar | Credentials and one viable pipeline confirmed |
| 1 - Local foundation | Days 1–3 | Monorepo, UI, API, database, storage, job queue, schemas | Project and assets persist across restarts |
| 2 - Thin vertical slice | Days 4–7 | One brief → storyboard → avatar/B-roll/voice → 20–30 sec MP4 | Complete video export verified |
| 3 - Editing foundations | Weeks 2–3 | Scene timeline, manual adjustments, caption presets, audio tracks, preview, version history | Edit and rerender one scene independently |
| 4 - Multi-agent pipeline | Weeks 4–5 | Agent gateway, specialist stages, validated artifacts, job DAG, budget caps | Interrupted job resumes safely; selective invalidation works |
| 5 - Industry studios | Weeks 6–8 | Real estate, e-commerce and manufacturing presets; tech templates; brand kits | 4 reference briefs produce editable first cuts |
| 6 - Advanced AI editor | Weeks 9–12+ | Natural-language editing, reviews, provider comparisons, optimized render cache | Typed commands, undo, QC gates and audit trail function |

**24-hour demo (strictly scoped):** Manual brief, one simple storyboard generated by an LLM, uploaded footage + one generated/stock presenter, narration, two caption styles, one brand outro, single 1080×1920 export. No sophisticated timeline, autonomous QC or generalized model router in this sprint.

## 12.1 First ten implementation tickets

1. Initialize pnpm monorepo with `apps/web`, `apps/api`, `packages/schemas`, `workers/render` and lint/test tooling.
2. Set up PostgreSQL/Prisma schema for clients, projects, scenes, assets and jobs.
3. Add local file ingestion with FFprobe metadata and checksum deduplication.
4. Build project dashboard, brief form and brand-kit editor.
5. Implement JSON Schema/Zod contracts for brief, script, storyboard and timeline.
6. Connect one LLM adapter and generate a validated storyboard from a brief.
7. Build a simple Remotion scene composition and one branded vertical template.
8. Integrate one avatar or video generation API with polling/webhook support as documented.
9. Add FFmpeg media prep, audio mix, caption overlay and 1080×1920 export.
10. Run an end-to-end fixture, verify rendered frames/audio, measure provider usage and document failures.

# 13. Budget and performance model

**Do not invent fixed per-video prices.** Provider pricing changes and depends on model, duration, resolution, retries and subscription/API access. Track `estimated_cost` before every job and `actual_cost` afterward where provider reporting allows.

**Per-video cost =** avatar seconds × avatar rate + generated B-roll seconds × video rate + image generations + TTS characters/minutes + LLM tokens + transcription + retries + allocated compute/storage. Separate ongoing software subscriptions from metered API charges; consumer-plan credits may not apply to APIs.

**Operational controls:** max spend/project, max retries/shot, preview-quality generation first, reuse approved assets, cache prompts and renders by artifact hash, stop loss on provider failure, compare planned vs actual spend. Record wall-clock time by stage and end-to-end; optimize proven bottlenecks, not assumed ones.

# 14. Recommended decisions and outstanding validations

**Lock now:** private local-first scope; TypeScript stack; structured stage contracts; canonical timeline JSON; approval gates; asset/version history; one provider per capability to start; deterministic rendering.

**Validate before implementation:** available avatar/B-roll APIs and account limits; commercial licensing for Remotion/HyperFrames and assets; local machine render throughput; whether video providers expose genuine alternative-view functionality; source footage consent; accurate client data and music licensing.

**Defer:** public SaaS, billing, marketplace, mobile app, 4K pipeline, real-time multi-user editing, automatic publishing and full Temporal migration.

# 15. Definition of success

Within the initial validation period, the owner can select a client, describe a video, approve a storyboard, generate and reuse compliant media, make targeted natural-language or manual edits, preview a high-quality 30–90 second composition, resolve review flags, and export a branded social-ready video while retaining an editable, reproducible project and an understandable cost record.

---

## Appendix A - Working session: sample brief

**Client:** Real estate project. **Objective:** 45-second vertical flat tour. **Inputs:** approved property specification, actual footage, developer logo, contact details, optional consented presenter. **Constraints:** use only verified room sizes and amenities; synthetic establishing shots labeled illustrative. **Style:** elegant, cinematic; large restrained titles; translucent glass information cards; spoken captions positioned outside the presenter's face; voice forward in mix. **Deliverables:** MP4 1080×1920, thumbnail, caption SRT, editable timeline snapshot, fact/asset provenance report.

## Appendix B - System test scenarios

- Provider job fails halfway: bounded retry, then one scene marked failed while approved others persist.
- Source footage replaced: dependency graph invalidates only impacted previews/renders.
- User says "keep voice unchanged": command plan preserves narration asset ID.
- Unsupported property claim: fact checker creates blocking QC issue.
- Avatar consent missing: avatar generation is disabled.
- AI requests custom code: code quarantined until review and sandbox test.
- Render machine restarts: committed outputs remain; incomplete jobs safely restart.
- Duplicate request: idempotency prevents double billing where provider supports it.
- Missing font or codec: preflight fails with actionable diagnostic rather than silent corrupt export.

## Appendix C - Reference documentation to verify during implementation

- OpenAI API: https://platform.openai.com/docs/
- Anthropic API: https://docs.anthropic.com/
- Remotion: https://www.remotion.dev/docs/
- FFmpeg: https://ffmpeg.org/documentation.html
- PostgreSQL: https://www.postgresql.org/docs/
- Prisma: https://www.prisma.io/docs
- BullMQ: https://docs.bullmq.io/
- Temporal: https://docs.temporal.io/
- HeyGen API: https://docs.heygen.com/
- ElevenLabs API: https://elevenlabs.io/docs

*The links above are implementation starting points, not a certification of current API capabilities, pricing or license eligibility. Confirm relevant terms before spending or shipping.*
