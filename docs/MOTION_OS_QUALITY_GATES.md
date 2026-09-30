# Motion OS — Quality gates and local production trials

Version 1.0 · 30 September 2026

Goal: prove that prompt-to-video produces useful, specific, natural-feeling creative work with low correction effort. These thresholds are proposed starting acceptance criteria, not claims of current performance. Calibrate against the owner's approved reference work at M0 and record any change before scoring the release candidate.

## 1. Define the measured output

**First pass:** assembly before automatic critique/repair. **First draft:** complete playable output after at most two budgeted automatic repair passes, before user edits. Record both; never hide internal failures behind the first-draft acceptance number.

**No-edit acceptance:** reviewer would use the draft as delivered. **Light-edit acceptance:** only a copy correction, shot swap or small pacing change, requiring at most two minutes of human work for a short. Script rewrites, narration replacement or reconstruction count as substantial revision regardless of time. For 2–5 minute videos, track a separate provisional five-minute light-edit ceiling.

Save the prompt, product/brand revisions, exact source assets, model/template versions, raw first pass, presented first draft, final export, QA issues, automated repairs, human edits, cost and elapsed times. Technical fixture materials can be synthetic and labeled; real-production trials use authorized real brand material.

## 2. Hard gates — every accepted export

| Area | Gate and evidence |
| --- | --- |
| Facts and brand | No invented product capability, price, size, testimonial, address or contact detail; claim IDs trace to approved records |
| Product fidelity | Packaging, UI, logo, color and relevant shape match references; generated shots cannot silently substitute a different product |
| Required message | Intended objective and CTA appear accurately; key promise is resolved |
| Captions | No missing critical words, wrong numbers/names, clipping, unsupported glyphs or sustained visible drift; confidence is recorded honestly |
| Layout | No critical text outside configured safe areas; no captions covering essential product evidence or the presenter's face |
| Audio | Speech is intelligible; no clipping, missing channels, unintended silence or abrupt truncation; pronunciation of key names verified |
| Export | File decodes fully; dimensions, duration, frame rate and streams match manifest; no unexpected black/frozen/missing-media segment |
| Rights and processing | Asset usage and any real-person consent cover the requested output; provider upload policy respected |
| Reproducibility | Export resolves to a saved revision, frozen assets and pinned render inputs |

A hard-gate failure cannot be averaged away by excellent aesthetic ratings. Automated checks are evidence for their specific property, not proof of overall quality.

## 3. Human creative rubric

Score each dimension 1–5: 1 unusable, 2 major rework, 3 usable with meaningful revision, 4 publishable with minor refinement, 5 strong as delivered. Score videos blind to provider/template where practical. Require notes for scores below 4.

| Dimension | Weight | What the reviewer evaluates |
| --- | --- | --- |
| Story and persuasion | 25% | Specific hook, causal progression, clear value, evidence, payoff and CTA |
| Product/brand fit | 15% | Correct identity, believable claims, consistent tone and appropriate audience |
| Visual design | 15% | Hierarchy, spacing, contrast, typography, art direction and consistency |
| B-roll and continuity | 15% | Relevant shots at the right moments, visual continuity, faithful product detail |
| Motion and pacing | 10% | Motion supports comprehension; cuts and rests feel intentional |
| Voice and audio | 10% | Natural phrasing, pronunciation, expressive restraint, music and SFX balance |
| Captions | 10% | Accurate timing, meaningful grouping/emphasis, placement, readability and language handling |

Additionally ask: “Would you publish this?”, “What is the single weakest moment?”, and “Did anything feel generic or artificially assembled?” Record naturalness separately on the same 1–5 scale. Naturalness refers to craft and plausibility, not concealing required synthetic-media disclosures.

## 4. Trial matrix

Pick two or three actual products. Use these archetypes until the owner supplies names:

| Track | Briefs | Required variation |
| --- | --- | --- |
| Software/product marketing | 4 | 15-second hook, 30-second feature demo, 60-second explanation, deliberately sparse brief |
| Physical product / UGC | 4 | Product voiceover ad, detail-led proof, uploaded creator footage, product-fidelity stress case |
| Longer explanation | 4 | 2-minute explanation, 5-minute chapter piece, localized adaptation, dense technical/factual brief |

Use 9:16 and 16:9, at least one non-default locale selected by the owner, long names, uneven source audio and a mix of abundant/sparse assets. Hold four briefs out while tuning; evaluate all 12 once the release candidate is frozen. Repeat the matrix in a second round after fixes, keeping failed runs in the metrics. Report format/locale subgroups as counts because the sample is small.

The owner is the final creative reviewer. Prefer an additional reviewer unfamiliar with the implementation; each enabled language requires fluent review. Record disagreement rather than manufacturing consensus. Two or three showcase videos start the exercise; the repeated matrix tests reliability.

## 5. Adversarial and reliability scenarios

Run focused fixtures for:

- Misspelled brand name, unapproved price, contradictory source claims and a reference containing instructions to override brand policy.
- Long CTA, large currency values, mixed scripts, right-to-left layout when that locale is enabled, and fonts with missing glyphs.
- Speech over music, silence, fast speech, named entities, code-switching and an uncertain transcript.
- Variable-frame-rate footage, rotation metadata, 29.97 footage on a 30 fps composition, unusual sample rate and five-minute drift.
- Missing file/font, corrupted upload, failed download, disk full, offline provider and expired credentials.
- Provider timeout after submission, duplicate Create clicks, app reload, worker crash, cancelled generation and an interrupted final render.
- Edit voice versus edit captions versus replace footage: assert which jobs are invalidated and which paid assets remain untouched.
- Changing aspect ratio: rerun layout/safe-area checks without regenerating source media unnecessarily.
- Two tabs editing one revision; export while edits continue; cache isolation between brands and locale profiles.
- Backup restore on a clean test directory with manifest/hash checks.

## 6. Technical sampling and thresholds

Use representative start/middle/end frames of each scene and frames around entrances, exits and cuts. Also watch the entire final video with audio; contact sheets cannot expose all temporal glitches. Long-form review includes chapter joins, pauses and the ending.

Caption timing target: on a manually annotated sample of at least 30 word boundaries per relevant fixture, 95% should be within 100 ms and none should exceed 200 ms without a reviewed explanation. Treat this as a provisional editorial tolerance, not a universal language standard. Store original alignment precision; never make all confidence values 1.0 by default.

For social delivery, start with a configurable audio target around -16 LUFS integrated and true peak at or below -1 dBTP, adjusting the preset to the delivery context. Measure the actual output, but prioritize speech intelligibility over a single loudness number. Quiet and high-dynamic-range source material may need a different approved preset.

Pin renderer/browser/fonts and compare fixture pixels with declared tolerances. Exact binary hashes need not match across different hardware/encoders. Verify timing and stream properties independently. Human-approved fixture updates require an explanation of the changed appearance.

## 7. Local acceptance and release decision

Proposed gate across two 12-brief rounds:

- Zero unresolved hard-gate failures in videos marked accepted/export-ready.
- At least 10 of 12 first drafts per round accepted with no edits or light edits; at least 7 of 12 accepted with no edits. Report both rates and internal repair rates.
- Accepted outputs average at least 4/5 on the weighted creative rubric, with story, product fit and naturalness each at least 4/5. No weak dimension may hide inside the average.
- Each enabled format/locale has a reviewed passing example; any repeated subtype failure limits the declared release scope.
- Short-form median human correction time ≤2 minutes; longer pieces tracked separately.
- At least 95% completion in a separate 20-job local reliability suite excluding intentionally injected failures; injected failures must recover or stop safely and explicitly.
- No duplicate paid job caused by local retry logic; all submitted costs and reservations are traceable.
- Speed and cost are reported against the implementation plan's provisional targets, including cold/warm behavior and provider waits.
- Owner approves quality on real use cases and signs off the residual issue list. Local acceptance alone does not authorize hosting.

After the gate: continue production locally, document failures, then make the hosting decision separately. A missed creative gate triggers a focused correction cycle on the weakest layer. Do not respond by adding more manual editor controls unless repeated user behavior shows they are necessary.

## 8. Evaluation record template

For every run capture:

```text
Run ID / brief ID / product revision / date:
Format / duration / locale / hardware / versions:
Input assets and external-processing permissions:
First-pass defects / automatic repair count:
First-draft file / final export / manifest:
Hard-gate result and evidence:
Story / brand / design / B-roll / motion / audio / captions (1–5):
Naturalness (1–5) / would publish (yes/no):
No-edit / light-edit / substantial-revision:
Human editing minutes and exact corrections:
Planning / provider wait / assembly / QA / render times:
Estimated cost / actual cost / failed-attempt cost:
Weakest moment / root cause / proposed fix / holdout result:
Reviewer / owner decision / unresolved limits:
```
