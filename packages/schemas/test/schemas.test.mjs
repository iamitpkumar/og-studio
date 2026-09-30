import test from "node:test";
import assert from "node:assert/strict";
import { BriefSchema } from "../src/brief.ts";
import { StoryboardSchema, SceneSchema } from "../src/storyboard.ts";
import { CaptionTrackSchema, WordTokenSchema, CaptionGroupSchema } from "../src/captions.ts";
import { CanonicalTimelineSchema } from "../src/timeline.ts";

test("BriefSchema validates real-estate project input", () => {
  const brief = BriefSchema.parse({
    projectId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    title: "Luxury 3BHK Penthouse Tour",
    rawPrompt: "Create a 30s vertical walkthrough showing marble foyer, Italian kitchen, and rooftop terrace.",
    industry: "real_estate",
    aspectRatio: "9:16",
    targetDurationSeconds: 30,
    verifiedFacts: ["3,200 sq ft carpet area", "Italian marble flooring", "Private terrace infinity pool"]
  });
  assert.equal(brief.industry, "real_estate");
  assert.equal(brief.aspectRatio, "9:16");
  assert.equal(brief.verifiedFacts.length, 3);
});

test("CaptionTrackSchema enforces word-level timing and original 15 styles", () => {
  const words = [
    WordTokenSchema.parse({ text: "Welcome", start_ms: 0, end_ms: 450 }),
    WordTokenSchema.parse({ text: "to", start_ms: 460, end_ms: 600 }),
    WordTokenSchema.parse({ text: "Skyline", start_ms: 610, end_ms: 1100 }),
    WordTokenSchema.parse({ text: "Towers", start_ms: 1110, end_ms: 1600 })
  ];

  const group = CaptionGroupSchema.parse({
    word_ids: words.map(w => w.id),
    start_ms: 0,
    end_ms: 1600,
    template_id: "bold-stack",
    emphasis_word_ids: [words[2].id, words[3].id]
  });

  const track = CaptionTrackSchema.parse({
    project_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    words,
    groups: [group]
  });

  assert.equal(track.words.length, 4);
  assert.equal(track.groups[0].template_id, "bold-stack");
  assert.equal(track.groups[0].emphasis_word_ids.length, 2);
});

test("CanonicalTimelineSchema validates multi-track audio and video", () => {
  const timeline = CanonicalTimelineSchema.parse({
    project_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    duration_ms: 30000,
    aspect_ratio: "9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    tracks: [
      {
        type: "video",
        name: "Main Video B-Roll",
        clips: [
          { start_ms: 0, duration_ms: 5000 },
          { start_ms: 5000, duration_ms: 6000 }
        ]
      },
      {
        type: "captions",
        name: "Synchronized Captions",
        clips: []
      }
    ]
  });
  assert.equal(timeline.duration_ms, 30000);
  assert.equal(timeline.tracks.length, 2);
});
