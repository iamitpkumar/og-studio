# Motion OS — UI and UX implementation brief

Version 1.0 · 30 September 2026 · Companion to the implementation plan

## 1. Experience direction

The interface should make powerful production feel calm and immediate. The user chooses a product, expresses an outcome, and watches a strong video take shape. Give the finished creative work the largest visual presence. Expose a control only when it helps the next decision.

Reference inspected: Relite's local onboarding page and its CSS/font definitions. Carry forward rounded floating surfaces, considered spacing, soft depth, strong Manrope headings and easy-to-read body type. Use original colors, composition and video-specific interactions. The owner now explicitly requests liquid glass; this updates the previous plain white/violet direction.

## 2. Proposed visual system: pearl, deep ink and cool teal

| Token | Proposed value / rule |
| --- | --- |
| Canvas | `#F4F6F7`, softly lit pearl with restrained static blue-green tint |
| Strong surface | `#FFFFFF`, opaque where text density is high |
| Glass surface | White at 76–90% opacity over a controlled background |
| Primary text | `#16272C`, deep blue-green ink |
| Secondary text | `#52636B`; verify every rendered combination |
| Primary action | `#126B70`, white label; darker hover |
| Decorative highlight | `#80D5CA`, pale aqua used for light/reflection, not small body text |
| Secondary accent | `#6D66A8`, muted iris reserved for selected creative affordances |
| Borders | Fine cool-gray boundary plus a subtle white upper-edge highlight |
| Radius | 12 px fields, 20 px cards, 28 px major floating panels |
| Elevation | Soft neutral shadow, subtle inner highlight; limit stacked layers |
| Heading font | Self-hosted Manrope, 500–650 weights |
| Body font | Self-hosted DM Sans, 400–600 weights |
| Time/numbers | Tabular numerals; monospace reserved for technical diagnostics |

These are proposed tokens, not validated contrast results. Validate contrast against the actual composite background. Target WCAG 2.2 AA contrast: 4.5:1 normal text and 3:1 large text; required control boundaries need appropriate non-text contrast. [WCAG reference](https://www.w3.org/TR/WCAG22/)

Use liquid-glass treatment for the top bar, composer shell, floating review toolbar and selected sheets. Use opaque interiors for transcript text, forms and dense menus. Blur approximately 16–24 px on a few bounded surfaces; no full-screen constantly animated blur. Supply solid fallbacks for reduced transparency/performance constraints. Glass must never distort the video preview or change perceived product color.

Typography: 44–56 px creation heading on desktop, 32–36 px on compact layouts, 24–28 px page headings, 16 px body, 14 px controls. Avoid shrinking metadata below 12 px. Use a 4/8 px spacing system with 24–32 px panel spacing. License-check font assets and include script-appropriate fallback fonts for every enabled locale. Do not assume Latin font files support Hindi, Arabic or all other languages.

## 3. Screen composition

### Create

Compact floating top bar: wordmark, Create / Products / Library / Activity, and settings. Main content is a centered 760–880 px composer with a selected-product capsule and asset thumbnails. Heading: “What should we create?” Prompt: “Describe the video you have in mind.”

Below the prompt, show editable chips for goal, language, length and format. Put additional settings behind “More options”. Primary action: **Create video**. Supporting copy can show an approved budget or “Uses your existing assets”. Recent productions appear below as playable covers. Avoid charts, job IDs, decorative statistics and a permanent editing timeline.

### Product profile

Show the product hero, approved promise, assets, brand voice and default CTA. Tabs: Overview, Assets, Voice & style, Facts. The profile should communicate context the director will use. Offer one compact setup flow for missing required information. Show extracted-but-unconfirmed facts as suggestions, not approved material.

### Creating

Replace the composer with a persistent production card and progressively available scene thumbnails. Stage language: “Shaping the story”, “Finding the right shots”, “Creating visuals”, “Adding voice and captions”, “Reviewing the cut”. Show real counts and completed milestones. Display early stills as storyboard frames, not as a finished playable draft.

The user can leave, return, cancel, or inspect the plan. A provider failure explains the affected shot and provides Retry / Use existing asset when valid. No simulated progress bar. Queued, offline, missing permission, budget-limited and awaiting input states need deliberate layouts.

### Review

Large color-neutral player; for vertical video use an uncluttered portrait stage with adjacent concise context rather than stretching it. Title and revision above; Export and Make a change below. A prompt field supports “Make the opening more direct” or “Use a calmer voice”.

Scene strip appears through **Scenes**. Selecting a scene opens a contextual sheet for copy, media, duration and style. **Advanced editing** reveals a compact timeline. Undo/redo and compare are available, but never compete with playback. An AI critique appears as specific issues only when actionable, not as a self-awarded quality score.

### Export

Show output format, actual resolution, selected revision and destination. Allow subtitle sidecars and editable project package. Distinguish preview and final render plainly. Export preparation persists as a job; failed verification cannot display “Ready”. No public publishing control in local MVP.

## 4. Interaction rules

- Persist composer drafts and edits. A reload must not lose a production or duplicate submission.
- Use progressive disclosure rather than separate wizards for every production stage.
- Auto mode uses saved facts and approvals. Interrupt only when the missing answer materially changes the output or authorized cost/data use.
- Make provider-unavailable and missing-product-asset states useful with next actions.
- Display scene-scoped changes and protected material when reviewing a consequential edit.
- Keep keyboard focus predictable across sheets and progress transitions; announce meaningful job status without announcing every event.
- Provide 44 px preferred touch targets, visible focus rings, clear labels, and keyboard alternatives to reordering.
- UI motion: roughly 160–240 ms entrances and 120–180 ms control feedback; transform/opacity first. Reduced motion uses immediate or subtle state changes. Avoid ambient looping animation during review.
- Preview colors remain isolated from app tint; brand colors affect video, not the whole app shell.

## 5. Responsive and performance acceptance

At 1440×900: comfortable primary workflow and large preview. At 1280×800: creation and review remain usable without crowded side panels. At 768 px: one contextual pane at a time. At 390 px: product selection, prompt, job monitoring and playback work; advanced timeline can require desktop explicitly.

Test at 200% zoom, with long product names, mixed-language text, an empty library, unavailable media and a provider failure. Tab through the full creation/review flow. Keep the composer usable while media loads. Do not ship heavy decorative WebGL or displacement effects on the critical path.

Design completion evidence: implemented Create/Product/Review screens, representative loading/error/empty states, desktop and compact screenshots, keyboard walkthrough, contrast measurements, reduced-motion behavior, and owner review of the actual UI. A static mockup alone does not satisfy M1.
