# AI Video Studio — CAPTIONS.md

**Status:** Implementation-ready functional, visual, and technical specification  
**Version:** 1.0  
**Companion:** `AI_Video_Studio_DESIGN.md` (light-only application UI)  
**Ownership:** Caption Director agent + transcript editor + timeline/rendering engine  
**Goal:** Make speech-led videos readable, intentional, memorable, visually integrated, editable, and reliably synchronized. This document specifies original reusable techniques; do not reproduce another service's exact templates, logos, or proprietary layouts.

---

## 0. Non-negotiable principles

1. **Captions are editorial compositions, not generic subtitles.** Timing, word emphasis, hierarchy, layout, imagery, presenter visibility, and negative space matter together.
2. **The source transcript is authoritative for spoken content.** Do not silently invent, paraphrase, or delete speech. An optional *editorial rewrite* is a separate, user-approved operation and may require new narration.
3. **Word-level timing is the canonical alignment unit**, with phrase- and scene-level groupings derived from it. Store confidence and provenance; don't pretend an estimated alignment is exact.
4. **Presenter-first placement.** Avoid faces, mouths, key gestures, garment details, product labels, floor-plan measurements, prices and CTAs. Do not obstruct critical visual evidence.
5. **Safe and accessible by default.** Strong contrast, reasonable reading density, safe areas, legible small-screen previews, reduced-motion mode, and language-aware wrapping.
6. **Deterministic rendering.** An agent chooses/configures validated templates. The renderer produces predictable output from versioned data. Don't allow arbitrary agent-generated JSX/HTML to run in the ordinary caption pipeline.
7. **Scene-scoped regeneration.** Restyling captions must not regenerate approved avatars, B-roll or voice; correcting one word must not invalidate the entire film unnecessarily.
8. **Client-specific branding stays inside video.** The *application* remains light, minimal and premium per `DESIGN.md`; video caption styles can be light, dark, colorful, bold or cinematic as brand and scene require.
9. **User approval before consequential changes.** Flag uncertain names, numbers, product claims, addresses, property prices, legal wording and questionable transcription.
10. **No promises of perfect detection.** Subject masks, occlusion and tracked text require QA and fallback rendering.

## 1. Scope and terminology

- **Transcript:** ordered spoken words with text, start/end times, speaker IDs and confidence.
- **Token:** speech-aware word or punctuation unit; a rendered word may comprise multiple script glyphs.
- **Phrase / caption group:** short editorial unit comprised of source word IDs, shown together.
- **Emphasis:** special typography/motion on a selected word or phrase; emphatic text may have a distinct layer.
- **Caption track:** time-based sequence of groups referencing media time. Separate from optional on-screen labels, fact cards and CTA graphics.
- **Burned-in captions:** rendered into MP4 pixels; **sidecar captions:** SRT/VTT for accessibility or platform support.
- **Karaoke highlight:** progress through a displayed phrase using word timestamps.
- **Behind-person caption:** typography composited behind a foreground subject through a validated segmentation/matte pipeline.
- **Active safe area:** the region that avoids both content obstacles and platform-specific interface overlays.

### Output artifacts

Each caption job should produce: `transcript.json`, `captions.json`, optional `captions.srt`, optional `captions.vtt`, transcript review report, optional segmentation/matte references, template ID/version, preview frames, and a render manifest. Preserve originals and derived files separately.

## 2. End-to-end pipeline

1. **Ingest:** probe video/audio via FFprobe; preserve source time base, framerate, sample rate, rotation, channel count, pixel aspect ratio and duration. Normalize a working audio copy without overwriting source.
2. **Transcribe:** use the configured speech-to-text service/model; store language, speaker hypotheses, text confidence, timestamps and model version. If timestamps are segment-level only, run a separate word aligner.
3. **Review:** highlight low-confidence words, named entities, numbers, currency, measurement units and code-switching. The user can correct text while preserving the original audio.
4. **Align:** produce monotonic word start/end times; correct drift against audio and identify overlaps, pauses and non-speech. If edited transcript departs materially from original audio, require re-alignment or new narration.
5. **Editorial grouping:** split into readable phrase groups by punctuation, syntax, pauses, speed and visual composition. Grouping never changes the underlying transcript.
6. **Style selection:** choose brand-safe template, typography tokens, emphasis plan, animation intensity and placement strategy.
7. **Scene analysis:** detect person/product/face approximate regions and foreground matte where needed; use confidence-gated detection and per-scene safe zones.
8. **Composition:** place groups in approved caption lanes, respecting subject and platform UI safe areas; run text shaping and line-break tests before motion.
9. **Preview:** render representative frames at start, peak emphasis and exit; preview on mobile-sized display and at native resolution.
10. **QA:** automated contrast/overflow/timestamp/overlap checks plus human review of semantic accuracy, face/garment/property occlusion and style.
11. **Export:** render burned-in captions, and optionally SRT/VTT; save sidecars and manifest with the final MP4.

### Retry and invalidation rules

| Change | Recompute | Preserve |
|---|---|---|
| Fix transcription typo without timing change | caption text/layout/preview | audio, source footage, avatar |
| Fix word timing | affected group sync/animation and dependent exports | script, unrelated groups |
| Change caption template | layout/effects/caption render | transcription and all source media |
| Replace scene B-roll | obstacle masks, placement, render for affected scenes | transcript/voice if unchanged |
| Change narration audio | affected transcription/alignment/group timings | unrelated scenes |
| Change output aspect ratio | layout and safe-area checks, export | source media and word IDs |
| Change client brand kit | template tokens and affected previews | underlying words and audio |

## 3. Caption Director agent responsibilities

Inputs: production brief, approved script, transcript/alignment, brand kit, scene plan, subject regions, output ratio, platform safe-area profile, available template registry, user preferences. Outputs: a validated `CaptionPlan` with groups, templates, timing, emphasis, positions, mask strategy and audit notes.

Agent tasks:
- Classify scene type: talking head, full-frame property, product demonstration, avatar inset, screen recording, cinematic montage, outro.
- Choose caption density and whether subtitles should appear in every scene. Silence, music and heavily visual passages may need no captions.
- Pick important *spoken* words to emphasize, not arbitrary invented slogans; separate promotional on-screen graphics from transcript captions.
- Propose safe lane (bottom/mid/upper/side) based on subject and platform profile; when uncertain prefer a conventional readable bottom caption without occlusion.
- Recommend motion intensity based on brand, speaking rate and scene movement.
- Return an explanation of deliberate deviations and any human-approval flags.

Agent **must not**: alter spoken quotations, fabricate figures, insert unsupported property claims, claim that a synthetic testimonial came from a real buyer, or assume missing masks are accurate. Marketing claims and speaker consent must be reviewed through project-level gates.

## 4. Caption style library — original template registry

Use descriptive original IDs and version them (`caption.bold-stack@1.0.0`). Each template specifies typography, max lines, line break behavior, entry/exit motion, focus-word treatment, background treatment, anchoring, collision constraints and reduced-motion behavior.

| Style ID | Visual composition | Suitable use | Cautions |
|---|---|---|---|
| `clean-bottom` | Solid high-contrast lower-third text, subtle shadow or scrim | Explainers, interviews, accessibility baseline | Avoid platform UI overlays |
| `bold-stack` | 1–2 bold lines with occasional enlarged keyword | Hooks, UGC, real estate | Do not make every word enormous |
| `single-word-punch` | Short isolated impact word then return to normal phrase layout | Opening hooks and pivots | Use sparingly; preserve reading continuity |
| `editorial-serif` | Serif headline paired with clean sans supporting text | Luxury property, fragrance | Check serif legibility on small screens |
| `kinetic-phrase` | Phrases move subtly as a unit; active keyword changes weight | Founder/tech short videos | Avoid competing movement with rapid B-roll |
| `karaoke-highlight` | Stable caption position, individual word progresses through highlight | Education, fast speech | Never bounce each word unnecessarily |
| `behind-subject` | Large typography behind masked presenter | Talking head hero moments | Requires confident matte and spill QA |
| `side-note` | Left/right aligned phrase in available negative space | Wide interviews, architecture | Fall back when scene subject moves |
| `glass-caption-card` | Text on restrained translucent panel with border and subtle blur | Bright complex footage and feature callouts | Never use weak contrast or heavy blur everywhere |
| `property-metric` | Verified short label/number paired with supporting text | Property dimensions and prices | Treat fact card separately from transcript; require source |
| `product-detail` | Compact callout placed away from garment/product | Fashion and manufacturing | Do not hide fit, print, label or product texture |
| `minimal-outline` | Stroked type when composition demands it | Selected hero shots | Stroke alone may fail contrast |
| `neon-accent` | Neutral type with restrained accent/glow | Tech and energetic ads | Avoid eye-straining glow/flash |
| `multiline-editorial` | Asymmetric typography with intentional line hierarchy | Scripted promos | Ensure logical reading order |
| `quiet-documentary` | Simple static captions with gentle fade | Testimonials and informative tours | Avoid stylization that trivializes speech |

### Template configuration contract

Required fields: `id`, `version`, `category`, `supported_ratios`, `supports_rtl`, `max_lines`, `max_visible_words`, `min_font_px_at_1080w`, `type_scale`, `weight`, `tracking`, `line_height`, `colors`, `background_mode`, `anchor`, `entry`, `exit`, `word_highlight`, `supports_subject_mask`, `fallback_template`, `reduced_motion_variant` and `validation_rules`. Fonts must be licensed and bundled appropriately; do not distribute font files separately to end users.

## 5. Typography and layout specifications

These are **starter ranges for visual testing**, not universal standards. Use a layout system based on composition height, text width and preview readability; don't blindly scale by video width.

- Default vertical 1080×1920: baseline body caption approximately 56–76 px depending on font, display area, group length and visual content; hook typography can be substantially larger when brief.
- Default landscape 1920×1080: baseline 48–70 px depending on expected viewing size and composition.
- Aim for one or two lines for spoken captions. Three lines only with explicit template support and careful viewing tests.
- Prefer approximately 3–7 words per visible phrase, but use natural syntax and speech rate rather than rigid word count.
- Favor short, grammatical line breaks: avoid orphaned articles, splitting a proper noun or separating a number from its unit.
- Typography tokens: family, size, weight, letter spacing, line height, casing policy, stroke thickness, shadow, underline/marker, background/scrim and animated emphasis.
- Keep visual hierarchy intentional: normal words first, one focal phrase or word, and on-screen CTA/fact cards on their own graphics tracks.
- Preserve original spelling for verified proper names; support Indian English, Hindi, English/Hindi code-switching and future scripts with appropriate text shaping.
- Text should wrap after measuring actual glyph bounds; do not estimate width by character count. Emoji and complex scripts need shaping-aware measurement and tests.
- Use one line of emphasis at a time unless an approved style explicitly permits otherwise.

### Contrast and readability

- Default to WCAG-inspired text contrast targets where practical: 4.5:1 for normal text and 3:1 for large text against the *effective video background*; high-motion backgrounds need scrims/plates or adaptive fallback.
- Because the video background changes, sample multiple frames across the caption's lifespan, not only its entry frame.
- Shadows and outlines are supports, not substitutes for a consistently readable fill/plate.
- Ensure opacity, blur and bloom never reduce the critical word below usable contrast.
- Run review at 25% preview, phone-sized preview and export resolution; use actual subtitles on the final encoded frame.

## 6. Platform safe areas and collision avoidance

- Store safe-area profiles per destination and aspect ratio (`instagram-reel`, `youtube-short`, `youtube-landscape`, `generic-9x16`, `generic-1x1`, `generic-4x5`). Platform overlays change: treat these as configurable presets, not eternally correct hardcoded pixel positions.
- Starter `generic-9x16` design region: keep essential caption elements within roughly 8% horizontal inset and 12% vertical inset; allocate extra bottom/right exclusion for platform controls when exporting social variants. Validate with current placement guides before release.
- Mark manually protected polygons/boxes (face, product, logo, property price, architectural feature), and machine-predicted regions with confidence.
- Determine per-group placement from weighted costs: overlap with critical regions, distance from intended anchor, contrast, amount of motion, line count and reading continuity.
- Avoid sudden caption jumping. Retain stable anchoring within a scene; if relocation is unavoidable, switch at a sentence boundary with subtle transition.
- Allow user drag-to-reposition or choose layout lane; persist the override and don't overwrite it during automatic restyling.
- When no safe position exists: use high-contrast compact bottom plate, adjust text density, or request manual review rather than hiding critical visual content.

## 7. Behind-person text: production specification

**Layer order:** background video → behind-person caption layer → subject foreground matte/composite → optional front caption accents and graphics.

1. Extract or produce a segmentation mask for the correct subject at consistent dimensions/time base.
2. Evaluate mask confidence at edges, hair, hands, motion blur, crossing objects and translucent clothing.
3. Apply temporal smoothing with edge-aware constraints so the mask does not flicker or lag behind motion.
4. Place large type primarily behind torso/available negative space; do not conceal spoken content under the subject so completely it becomes unreadable.
5. Control overlap deliberately: maintain sufficient *visible* glyph area and a front-layer fallback for critical words.
6. Detect scene cuts, subject exits, rapid motion and low-confidence matte frames; automatically revert to a normal caption style when needed.
7. Preview at least opening, middle and ending frames and frames near arm/hair movement. Human reviewer approves hero-style masks.
8. Don't hallucinate a reconstructed background or manufacture architectural details to make room for typography. Occlusion is compositing, not scene reconstruction.

Performance strategy: cache low-res masks for editor previews; generate final-res masks/render only when requested; reuse matte where source footage hasn't changed.

## 8. Motion and timing grammar

- Default entry animations: approximately 150–320 ms; default exits: approximately 120–250 ms. These are starting values, tune to speech and frame rate.
- Ease naturally; no universal bounce, shake or elastic spring. Use impact motion deliberately for hooks only.
- Keep the phrase stable while the speaker is delivering it; animate the transition between phrases more than each individual word.
- Karaoke highlighting follows real word timestamps, not uniform time splitting.
- Do not flash text faster than a person can read. Avoid strobing effects; supply reduced-motion variants with fades or hard cuts.
- A caption begins at or just before the relevant spoken segment when editorially justified and exits near its end. Allow small lead/lag adjustments, but never create misleading association with a different statement.
- Overlapping speakers require speaker-specific captions or manual resolution; don't interleave words into one unintelligible line.
- Account for pauses: avoid freezing an emphasized final word across a long unrelated silence unless intentional.
- For cuts and speed changes, map source timestamps to composition timestamps using a time-remap transform; never assume source time equals final timeline time.
- Audio waveform/beat analysis may shape nonverbal text motion, but transcript captions must remain speech synchronized.

## 9. Transcript editor and caption UI (light-only app)

### Primary layout

- Compact light top bar: project name, save/sync status, undo/redo, preview quality, export.
- Main center: video preview with safe-zone overlay toggle, mask debug toggle, guides and selectable caption boxes.
- Left collapsible panel: transcript paragraphs with word/phrase timestamps, uncertain-word highlights, speaker labels and search.
- Right contextual inspector: style, font, emphasis, placement, animation, background and brand controls. Hide when nothing selected.
- Bottom expandable timeline: video, avatar, voice, captions, overlays, music and markers; don't permanently expose advanced tracks in guided mode.

### Core interactions

1. Click transcript word → seek preview and highlight corresponding word/frame.
2. Edit transcript word → show original vs corrected text and decide whether timing still matches.
3. Split/merge groups → preserve original word IDs and deterministic timing boundaries.
4. Select phrase → change template, drag position or emphasize a word.
5. Select multiple groups → batch apply a template with clear preview and undo.
6. Search and replace → preview impacted occurrences before applying.
7. Change aspect ratio → reflow layout and reopen collision validation.
8. Pin an approved group → agent cannot alter it without explicit unlock/confirmation.
9. Regenerate selected scene captions → preserve other scenes and all approved source media.
10. Undo/redo → persist commands, not only ephemeral UI state.

### Accessible controls

Everything selectable must have keyboard access, a visible focus ring, accessible labels and a non-drag alternative for rearranging groups. Ensure screen-reader status announcements for transcription, alignment, preview render and failures. A reduced-motion setting affects editor animations as well as exported caption template variants when requested.

## 10. Natural-language caption editing

Examples and their safe operations:

| User instruction | Structured operation | Approval / safeguard |
|---|---|---|
| “Make captions bigger.” | `setCaptionTypography` scoped to selected groups/project | Preview overflow and collisions |
| “Put text behind the presenter.” | `setCaptionLayerMode(behind-subject)` | Require adequate mask confidence; preview fallback |
| “Highlight the property price.” | `setEmphasis` on verified spoken term or separate fact card | Verify price/source and currency |
| “Use fewer animations.” | `setMotionIntensity(low)` | Preserve word timing |
| “Fix the spelling of the project.” | `correctTranscriptWord` | Re-align if audio differs; record correction |
| “Move captions up.” | `setCaptionAnchor` | Respect face and platform safe zones |
| “Apply a luxury style.” | `applyTemplate(editorial-serif)` | Check brand/contrast and selected scope |
| “Translate to Hindi.” | `createTranslatedCaptionTrack` | Treat as new reviewed track, not replacement of source |

AI must return an explicit plan: target groups, proposed operations, affected outputs, costs if regeneration incurs paid API calls, checks required and reversible commit ID. Preview before committing changes that have substantial visual or cost impact.

## 11. Data model and schemas

Database entities: `transcript`, `transcript_revision`, `word`, `speaker`, `caption_track`, `caption_group`, `caption_style`, `caption_override`, `caption_render`, `mask_asset`, `review_flag`, `approval`, `timeline_operation`.

Example **illustrative** normalized representation (implement with Zod/JSON Schema and migrations):

```json
{
  "schema_version": "1.0.0",
  "project_id": "project_001",
  "scene_id": "scene_004",
  "caption_track_id": "track_en_01",
  "language": "en-IN",
  "source_audio_asset_id": "audio_004",
  "source_timebase": "milliseconds",
  "words": [
    {"id":"w1","text":"Discover","start_ms":350,"end_ms":780,"confidence":0.98,"speaker_id":"speaker_1"},
    {"id":"w2","text":"more","start_ms":790,"end_ms":1030,"confidence":0.96,"speaker_id":"speaker_1"}
  ],
  "groups": [
    {
      "id":"group_1",
      "word_ids":["w1","w2"],
      "start_ms":350,
      "end_ms":1100,
      "template":{"id":"bold-stack","version":"1.0.0"},
      "emphasis_word_ids":["w1"],
      "anchor":"lower-center",
      "position_override":null,
      "subject_mask_asset_id":null,
      "review_state":"draft"
    }
  ],
  "output":{"aspect_ratio":"9:16","width":1080,"height":1920,"fps":30}
}
```

Production schema rules:
- IDs are stable across text corrections where possible; edits create revisions, not silent overwrites.
- `start_ms >= 0`, `end_ms > start_ms`, within source media duration; group spans must agree with referenced words subject to explicit display padding.
- Group word IDs must exist, remain chronologically ordered, and not accidentally duplicate across primary-caption groups.
- Template ID/version must exist in registry and support the chosen aspect ratio/script direction.
- Position uses normalized coordinates or design-space units, not untracked browser pixels.
- Store provenance: STT/alignment provider, model version, confidence, review flags and user edits.
- Save render manifests with font IDs, asset hashes, template versions, output settings and job identifiers.

### Suggested service interfaces

```ts
interface CaptionProvider {
  transcribe(input: AudioAsset, options: TranscriptionOptions): Promise<Transcript>;
  align(transcript: Transcript, audio: AudioAsset): Promise<AlignedTranscript>;
}
interface CaptionDirector {
  plan(input: CaptionPlanningInput): Promise<CaptionPlan>;
}
interface CaptionRenderer {
  preview(plan: CaptionPlan, range: TimeRange): Promise<PreviewAsset>;
  render(plan: CaptionPlan, output: RenderProfile): Promise<RenderAsset>;
}
```

Adapter output is validated, normalized, versioned and checked before entering the composition engine. External API credentials are stored securely server-side or in local secure configuration; never embed keys in browser bundles, logs or project exports.

## 12. Export contract

- Aspect ratios: 9:16, 16:9, 1:1, 4:5 at minimum; additional resolutions via named profiles.
- MP4 with burned-in captions; optional separate clean video and SRT/VTT exports. Keep both where client requires localization.
- Encode with correct frame rate, audio/video synchronization, pixel format and color metadata; check the output rather than assuming successful process exit means usable media.
- SRT/VTT should be derived from corrected timed words/groups, escape special syntax properly and avoid decorative visual-only copy being misrepresented as speech.
- Keep a clean master or editable project so new caption languages can be rendered later without AI regenerating source clips.
- Include output-specific platform-safe-area review because burned-in captions cannot be repositioned by the receiving platform.
- Capture per-scene render hashes so an unchanged segment can reuse cached results where the rendering architecture supports it.

## 13. Quality assurance and acceptance tests

### Automated checks

- [ ] No missing/duplicate word references; timestamps monotonic and in bounds.
- [ ] Transcript language and speaker mappings remain consistent.
- [ ] Caption groups do not unintentionally overlap or cover an incompatible scene cut.
- [ ] No cropped glyphs, overflow, unexpected three-line captions or unsafe text positions.
- [ ] Template fonts/fallbacks load and multilingual text shapes correctly.
- [ ] Contrast checked against representative frame samples; unreadable backgrounds trigger scrim/fallback.
- [ ] Mask confidence and temporal stability pass threshold before `behind-subject` mode is enabled.
- [ ] Exported audio and burned-in caption sync checked at opening, midpoint, ending and time-remap boundaries.
- [ ] SRT/VTT parse, chronological order and escape validation pass.
- [ ] Editing one scene does not alter pinned/approved scenes or bill for unrelated generation tasks.

### Human review checklist

- [ ] Correct pronunciation-derived words, brand names, measurements, prices and factual claims.
- [ ] Emphasis supports meaning and doesn't manipulate or reverse what the speaker says.
- [ ] Face, mouth, garment details, product, property evidence and CTA stay visible.
- [ ] Captions remain readable on actual phones and across bright/dark backgrounds.
- [ ] Motion enhances comprehension rather than overwhelming it.
- [ ] The presenter matte has no visible hair/hand halos or temporal flicker.
- [ ] Client's approved style, language and disclosure requirements are met.

### Golden test fixtures

Maintain short reproducible test scenes: slow single speaker, fast speaker, interruptions, overlapping dialogue, Hindi-English code-switch, numbers/prices, a speaker moving across frame, a bright-to-dark cut, a patterned kurti close-up, real-estate floorplan details, 9:16 platform overlays, 16:9 landscape and a long multilingual word. Review rendered frames visually after each template/renderer change.

## 14. Delivery stages for Codex

**C1 — Reliable baseline:** ingest, transcription, word-level alignment, correction UI, `clean-bottom` and SRT/VTT export. Demonstrate timing accuracy on a 30-second source clip.

**C2 — Premium template foundation:** reusable registry, `bold-stack`, `editorial-serif`, `karaoke-highlight`, `glass-caption-card`; template preview and batch application; 9:16 and 16:9 QA.

**C3 — Scene awareness:** subject boxes, collision avoidance, manual exclusion zones, safe-area profiles and stable placement; product/face occlusion tests.

**C4 — Depth & cinematic styles:** validated subject mattes, `behind-subject`, temporal smoothing, fallback paths and mask preview/debugging.

**C5 — Agent-powered editing:** Caption Director, validated edit-command schema, natural-language plans, diff/preview/commit, undo and scoped regeneration.

**C6 — Scale and localization:** multilingual track management, translated captions with review, caching, batch exports and regression fixture suite.

### Definition of done

A user can upload a video, review/correct the transcript, select an original premium style, adjust placement and emphasis, preview on a phone-sized frame, request a scoped AI caption edit, export a synchronized MP4 plus optional SRT/VTT, and reopen the project without losing editable timing or revisions. The light application UI follows `DESIGN.md` throughout.

---

**North star:** Captions should look art-directed while remaining faithful to speech, easy to read, straightforward to correct, and safe to regenerate independently from the rest of the video.
