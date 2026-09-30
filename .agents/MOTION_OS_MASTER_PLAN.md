# MOTION OS — Product and Technical Master Plan
Version: 0.1, architecture draft, 28 Sep 2026.

## 1. Mission and non-goals
A reusable local-first motion-video production workspace for PS Tech Global and client brands, evolving into an optionally hosted agent-accessible creation platform. A single prompt should create an editable storyboard and a video assembled from deterministic animations and optionally AI-generated assets. Preserve project data and reusable quality knowledge irrespective of the selected AI or render engine.

Non-goals for V1: invent a foundational video generation model, clone every After Effects editing feature, promise fully autonomous blockbuster-quality production, ship unreviewed shared self-modifying code, clone an external company's visual designs, or deliver subscription-based provider integrations without official allowed APIs.

## 2. Target users and example projects
Initial operator: one local PS Tech Global creator. Internal brands: OGFocus productivity demos, OGStart storefront template launches, OGINBOX email automation explainers. Client use cases: real estate area explainer using authorized project media, aromatics/manufacturing animated educational content, clothing fashion advertising using original product photography. Then freelancers, agencies and creator storefronts, each with isolated workspaces.

## 3. User journey
Select workspace/brand -> enter brief or provide visual reference -> choose ratio 9:16 / 16:9 / 4:5 / 1:1 -> select style preset or accept AI art direction -> review storyboard and copy -> review asset permissions/cost estimate -> generate editable scenes -> preview and edit text, colors, cuts, assets and animation presets -> run visual/audio QA -> approve render -> export -> capture optional feedback for future projects.

## 4. Technical modules
- Studio: brand selector, chat/director, searchable theme browser, asset manager, scene storyboard, property inspector, track-based timeline, preview player, render center, skills workshop, cost dashboard.
- Project Service: versioned scene schema, asset references, composition versions and immutable final exports.
- Brand Service: authoritative brand config including exact contact details/claims, palette, style prohibitions, restricted assets and approvals; data overrides from untrusted text prohibited.
- Creative Planner: provider-neutral prompt-to-structured-storyboard, explicit source attribution and scene specification.
- Theme/Components Registry: approved presets with preview clips, capability flags, version hashes, aspect coverage, engine support and license records.
- Renderer Orchestrator: adapter interface compiling the canonical spec into engine-native artifacts, preview renders and exports, with manifest and checksums.
- QA: deterministic lint rules, geometry/contrast/safe areas, frame sampling, video/audio checks, optional vision-based critique, human ratings.
- Knowledge Service: preference captures, error diagnoses, completed project summaries, brand-specific recipes, retrieval and proposed skill changes.
- Agent Gateway: REST and MCP exposing narrow, typed and authorized application actions.
- Provider Gateway: interfaces for LLMs, image, video, TTS, transcription and asset upload; each advertises availability, auth mode, cost estimations and permission flags.

## 5. Rendering and canonical format
VideoProject carries schemaVersion, project and brand IDs, format (width/height/fps), total duration in frames, scene list with stable IDs/startFrame/durationFrames/type/payload, asset IDs, audio tracks, style tokens and approvals. Store all timing in frames and convert between time units only at UI boundaries. Support 1080x1920 and 1920x1080 immediately, with 1080x1350 and 1080x1080 as later export presets. Keep safe-area settings separate from output resolution. Scenes have optional native source when a renderer-specific effect cannot be expressed portably. Do not automatically fallback between engines when visual semantics differ; require a preview and user approval.

Implement RendererAdapter methods validate(project), getCapabilities(), compile(project, assets, tokens), preview(frameRange/scale), render(output, jobConfig), inspect(report). First HyperFrames with seekable HTML compositions, GSAP/CSS animation and deterministic rendering. Second Remotion/React adapter, subject to commercial license. Optional future Blender/Three.js render pipelines and FFmpeg composites.

## 6. Suggested initial scene primitives
Kinetic title, gradient/shape transitions, brand intro/outro, feature card, device mockup screenshot pan, bullet sequence, step-by-step explainer, comparison columns, data stat/counter, logo reveal, caption/title templates, quote/testimonial, property image pan, product showcase, map route (based on validated geography), split-screen before/after. Each primitive ships with sample fixtures and animations for 9:16 and 16:9. The initial five are kinetic title, shape transition, feature card, UI screenshot pan and brand CTA.

## 7. Skill governance and memory
Scopes: core engine skills, renderer technical skills, studio-design standards, business/domain recipes, brand policies, project-specific notes and user preferences. All SKILL.md files use YAML metadata: stable ID/name, purpose, owner, version, scope, tags, dependencies, permissions and verified engine versions. Index with DB metadata and content hash; skill contents remain regular local files under source control. SOL.md governs platform strategy and safety; AGENTS.md can point external agents to the same canonical policy. Do not duplicate conflicting copies of instructions for each model.

At job start retrieve relevant rules by scope and semantic intent plus required core rules; maintain a trace of what governed each output. On correction create a feedback event citing project, scene, issue and user-provided expected fix. Distill into: transient comment, brand rule, reusable template change, skill update or code bug. Low-risk personal preferences may be saved if enabled. High-impact/global skill updates: propose diff, attach evidence and before/after fixture, run regression tests, request human approval, create new version, rollout with rollback. Log rejections to prevent repeatedly proposing identical incorrect changes.

For improvement evaluation store blind A/B outputs on a benchmark set. Track manual revisions needed, first-draft acceptance, render success, objective QA defects, time-to-approved-output, credits per accepted video, repeat requests and brand-rule compliance. Do not optimize on self-assigned aesthetic scores alone, or learn from client assets across accounts without consent.

## 8. Security, privacy and cost controls
Local-only by default. No automatic uploading of client references or proprietary videos to AI services. Treat files, prompts and downloaded skills as untrusted inputs. Run composition code and third-party skills in isolated worker processes/containers where feasible; block unsanctioned filesystem/network access, cap CPU/memory/time, restrict shell execution, scan dependencies and pin versions. Maintain an allowlist of tools accessible to agents. Store secrets in environment or encrypted secret store, never in SOL.md or repo. Audit privileged actions. In SaaS use tenant-level authorization, isolated asset paths/buckets, signed uploads/downloads, render quotas, rate limiting and clear deletion/export controls. Verify music, stock and reference-media licenses and AI vendor terms.

## 9. Agent neutrality
Expose a stable JSON/REST API for every action. Add local stdio MCP server to wrap safe operations; remote HTTP MCP with current OAuth-compatible authorization after SaaS identity is implemented. External agent capability depends on official client support. Codex/Claude/Hermes/Cursor integrations should be validated individually. Grok, Muse and other consumer assistants cannot be assumed to provide agent or model APIs; label unavailable integrations as research. Distinguish model API access from consumer subscription. Never automate third-party accounts in violation of service terms.

Initial MCP commands: list_projects, get_project, list_brands, get_brand_policy, create_project, attach_asset, plan_storyboard, update_scene, list_themes, apply_theme, get_preview, render_video, render_status, record_feedback, propose_skill_update. Write side effects only to the selected user's workspace; confirmation gates for paid generation, public export, shared skill publishing or asset deletion.

## 10. Local-first deployment
Recommended repo root `D:\\MotionOS` (adjust if D: space is constrained). Use WSL2 for predictable Node, CLI and rendering behavior while keeping accessible Windows project folder or WSL-native storage; benchmark video IO before choosing storage. Dev commands eventually `pnpm install`, `docker compose -f docker-compose.dev.yml up -d`, `pnpm dev`, `pnpm test`, `pnpm demo:render`. Keep Postgres backup script and content-addressed filesystem manifest. Prefer a local web app in Edge/Chrome before introducing Tauri. Keep services bound to localhost by default.

## 11. Suggested relational data entities
users, organizations, memberships, brands, brand_revisions, asset_records, asset_versions, rights_records, projects, project_revisions, scene_specs, style_tokens, template_registry, template_versions, skills, skill_versions, skill_proposals, evaluations, render_jobs, generation_jobs, providers, provider_secrets_refs, feedback_events, memories, audit_events, publishing_events. Include organization ID on tenant-owned tables and enforce authorization for every lookup. Use JSONB for evolving scene payloads with schemaVersion and migrations; relational metadata for indexing and permissions.

## 12. Iterative roadmap and completion gates
**Phase 0 — Foundation (first 2–3 sessions):** repo, SOL.md/AGENTS.md, schemas, renderer benchmark, UI wireframe, source assets import strategy. Gate: both a canonical JSON fixture and a running local HyperFrames hello-world render.

**Phase 1 — Single-video vertical slice:** new project/brand, 5 scene primitives, 9:16 playback, single export workflow, real persistence. Gate: produce an original 15–30 second OGFocus demo end-to-end with correct branding using real assets only when supplied.

**Phase 2 — Everyday internal Studio:** storyboard UI, basic timeline and scene inspector, persistent revisions, preview at variable scales, 16:9 presets, brand hub, theme marketplace (internal), job statuses. Gate: build three distinct productions without developer intervention for basic edits.

**Phase 3 — Creative intelligence:** reference upload with extracted keyframes and safe descriptive analysis, search/retrieval, AI prompt planner, selective external providers, cost approval, batch export. Gate: a new approved brief outputs a storyboard and usable first render and allows per-scene rework.

**Phase 4 — Governed self-improvement:** skill workshop, feedback events, proposal diffs, golden render tests, A/B evaluation, project memory. Gate: show an improvement derived from a previous approved correction that also passes tests on other projects.

**Phase 5 — Agent integrations:** local MCP stdio, granular permissions, example integrations with Codex and Claude, renderer and model-agnostic API docs. Gate: two independent clients can edit the same project through our tool contract without corrupting revisions.

**Phase 6 — Private multi-user beta:** authentication, organizations, projects isolation, S3-compatible storage, Redis/BullMQ, managed worker provisioning, billing metering, export policies, remote MCP. Gate: tenant isolation and load tests; legal/vendor licensing cleared.

**Phase 7 — Public product:** self-service onboarding, curated template marketplace, creator payouts if relevant, team reviews, usage-based billing, support and observability. Gate: repeat paid users and accepted outputs justify operating costs.

## 13. Priority scoring for feature ideas
Use expected reuse across brands, measurable quality gain, implementation complexity, ongoing inference/render cost and compatibility risk. Foundational quality and editor workflows outrank novelty. Avoid shipping both engines fully at once; build HyperFrames first and prove adapter boundaries by compiling a small Remotion fixture later.

## 14. Business model hypothesis
Initial customer is our own agency; savings and quality are the first validation. Later: creator subscription for limited exports, professional subscription for brand kits and higher-resolution renders, agency workspace for multi-brand collaboration, metered add-on credits for external AI providers/rendering, developer API and MCP access. Keep costs in actual provider currency and measure gross margin per accepted production. Price only after production cost data exists.

## 15. Early milestones to track
First fully reproducible render; first five scene components; first two aspect ratios; first reusable client brand pack; first end-to-end external agent call; first human-approved proposed skill update; first 10 real productions; first client who can revise copy and scenes without writing code; first tenant-isolated remote render.

## 16. Vendor and technical source links (checked Sep 2026)
- HyperFrames project and license: https://github.com/heygen-com/hyperframes
- HyperFrames docs: https://hyperframes.heygen.com/quickstart
- Remotion official skills: https://github.com/remotion-dev/skills
- Remotion commercial licensing: https://www.remotion.dev/docs/license/pricing
- MCP specification news: https://blog.modelcontextprotocol.io/posts/2026-07-28/
- MCP authorization reference: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/basic/authorization/index.mdx
- OpenClaw skill workshop: https://docs.openclaw.ai/tools/skill-workshop
- OpenClaw learning design: https://docs.openclaw.ai/tools/self-learning
- BullMQ: https://docs.bullmq.io/
- Meta Muse agent announcement: https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/

All pricing and provider/API availability must be rechecked at implementation and commercial launch.
