# Real production pipeline

Updated 1 October 2026. Motion OS stays local at `http://127.0.0.1:3100`. Existing projects and original media remain preserved.

## Reference and visual system

Reviewed Moonshot's public [caption gallery](https://makemoonshot.co/caption-templates), [animated captions](https://makemoonshot.co/animated-captions), and [caption generator](https://makemoonshot.co/ai-caption-generator). These inform active-word emphasis, legibility, cue grouping and style choice. Poster images and public page descriptions were inspected; interactive video playback was unavailable. No proprietary templates, brand assets or source code were copied.

The editor now has six original caption treatments: Signal, Punch, Marker, Glow, Editorial and Typewriter. Speech transcription supplies word timestamps; imported SRT/VTT and manually typed captions use explicitly labelled estimated timings until corrected. Words, cue text and frame timings remain editable. Six title designs provide a hero headline, lower third, chapter break, translucent card, kinetic words and proof point. Chapter and card treatments are actual rendered elements, not gallery placeholders. Subject segmentation and captions behind a presenter are not implemented.

Preview and export use `packages/timeline/src/production.mjs` for word states, title styling, transition geometry and audio gain. The renderer writes only changed properties to its seekable GSAP timeline. Manual actions, API edits, Director proposals and MCP operations enter the same validated command layer.

## Import and finished output

Imports now default to placing media on an unlocked compatible timeline track, retain the full source duration, and expose an option to keep a file in the library. A new empty timeline adopts the imported duration rather than adding unwanted padding. It can also match the first video’s aspect ratio at up to 1920 pixels on the longest side. Sequence settings provide **Fit duration to clips** to remove a leftover empty tail after edits. The inspector’s **Fit layer to canvas** restores a source layer’s frame bounds after a canvas change; existing custom framing remains preserved until chosen. Import errors remain visible and successfully imported files stay available after a partial batch failure.

Exports pin a saved revision, use original source ranges, burn in titles/captions/transitions, mix audio and encode an actual MP4. A final master limiter protects peaks at approximately −1.5 dB; this final limiter runs during export. Native-element preview does not currently reproduce the master limiter. The finished-video panel contains a playable preview, a real download, frame inspection and current/earlier revision labels. Missing encoded files produce a retryable failure; offline workers are identified. Completion requires successful encoding, dimensions/duration checks and a full FFmpeg decode.

Per-clip dissolve, push, wipe and iris treatments control reveals/exits. **Blend with previous shot** creates a genuine 12-frame overlap between adjacent footage clips on the selected track, with complementary audio fades. Associated independent narration or captions must be repositioned separately. Generated scenes overlap only within the previous shot's spare narration-free tail; otherwise they use a cut.

## Provider-backed production

Open **Production → AI settings**. Keys are saved in the local ignored `.env.local`, never returned to browser requests, included in exports, or committed. Saving settings takes effect without restarting. Explicit external-processing opt-in is required.

| Action | Actual provider work | Local result |
| --- | --- | --- |
| Caption footage | Extract the selected source range, then [timed Whisper transcription](https://developers.openai.com/api/docs/guides/speech-to-text) | Editable speech transcript and word-timed caption proposal |
| Create a video | AI script/shot plan, [speech synthesis](https://developers.openai.com/api/docs/guides/text-to-speech), [Runway Gen-4.5 footage](https://docs.dev.runwayml.com/guides/using-the-api/), transcription of generated voice | Saved footage/audio originals plus titles and captions in a proposed timeline |
| Generate B-roll | Runway text-to-video task | Downloaded, probed, locally saved shot in the media library and a timeline proposal |

The writing endpoint/model are configurable. Speech routes must support the OpenAI-compatible timed transcription and TTS contracts; changing the writing endpoint alone does not guarantee speech compatibility. Runway footage uses its separate API key. Sora is not used: its API was [retired on 24 September 2026](https://developers.openai.com/api/docs/deprecations).

Production jobs record stages, provider task IDs, saved asset IDs, transcripts and failures. Generated outputs are downloaded into local storage because [Runway output URLs expire](https://docs.dev.runwayml.com/assets/outputs/). No placeholders replace failed provider responses. Cancelling an active Runway task requests provider cancellation. Interrupted paid generation is not automatically retried. Completed productions require application of the proposed edit against its exact revision; applying a film/B-roll proposal queues a verified export. Local rendering continues while a provider task waits.

Current limits: captions process up to twenty minutes per selected clip and 480 groups; generated short films target 4–60 seconds and up to eight shots, each 2–10 seconds. Narration may extend a shot within the ten-second provider limit. Exact final timing is in the saved sequence. Long-form generation, reference-product image conditioning, music selection/ducking, creator avatars, advanced motion templates and brand asset selection in the new Production panel remain separate work.

## Acceptance

`node --test tests/production.test.mjs` checks full imported duration, deterministic caption seeking, valid split/trim/corrected words, overlapping transitions, locked tracks, render escaping, complementary gain, opt-in/key requirements, queue isolation and stale revisions. Provider contract tests use explicitly controlled responses. A worker test performs actual FFmpeg extraction and creates a timed proposal, then proves that a source change preserves the transcript without applying stale captions. A complete film-worker contract also ingests real encoded provider-response media and produces a valid editable sequence. These controlled responses are not live provider tests.

`scripts/verify-production.mjs` imports a real photographic [MDN flower sample](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video), looped to twenty seconds for duration testing, with offline Windows SAPI engineering-test speech. It inserts six burned-in caption styles, kinetic/lower-third titles and an overlapping dissolve, exports and downloads the MP4, checks range seeking, frame duration, dimensions, audio signal and full decode. Its evidence and fixtures are ignored under `data/test-runs/production-acceptance`. Estimated test cues are labelled; this is not an AI-generated commercial video or a speech-sync benchmark.

Live provider credentials are absent, so live AI generation and transcript accuracy remain unverified. Browser automation cannot start in this environment; actual browser gesture/playback acceptance and preview/export pixel comparison remain outstanding. Cross-country creative quality must be judged on the owner's two-to-three real brand projects before deployment. The application is not published.
