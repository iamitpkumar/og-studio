import test from "node:test";
import assert from "node:assert/strict";
import { compileStoryboardToTimeline } from "../src/compiler.ts";
import { calculateDirtyNodes } from "../src/dag.ts";

test("compileStoryboardToTimeline creates synchronized canonical timeline tracks", () => {
  const mockStoryboard = {
    id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    projectId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    version: 1,
    title: "Skyline Real Estate Tour",
    totalDurationMs: 15000,
    scenes: [
      {
        id: "sc_1",
        order: 0,
        title: "Grand Entrance",
        narrativeGoal: "Hook viewer with foyer",
        shotType: "wide_establishing",
        targetDurationMs: 5000,
        narrationScript: "Step into ultra-luxury living.",
        visualDescription: "Sweeping view of double-height foyer",
        captionStyleId: "bold-stack",
        associatedFactIds: [],
        approvalState: "approved"
      },
      {
        id: "sc_2",
        order: 1,
        title: "Designer Kitchen",
        narrativeGoal: "Showcase Italian quartz countertops",
        shotType: "medium_shot",
        targetDurationMs: 10000,
        narrationScript: "Custom quartz islands with bespoke lighting.",
        visualDescription: "Chef's kitchen pan",
        captionStyleId: "bold-stack",
        associatedFactIds: [],
        approvalState: "approved"
      }
    ],
    updatedAt: new Date().toISOString()
  };

  const timeline = compileStoryboardToTimeline(mockStoryboard, undefined, { aspectRatio: "9:16" });

  assert.equal(timeline.aspect_ratio, "9:16");
  assert.equal(timeline.duration_ms, 15000);
  assert.equal(timeline.width, 1080);
  assert.equal(timeline.height, 1920);

  const videoTrack = timeline.tracks.find(t => t.type === "video");
  assert.ok(videoTrack);
  assert.equal(videoTrack.clips.length, 2);
  assert.equal(videoTrack.clips[0].start_ms, 0);
  assert.equal(videoTrack.clips[1].start_ms, 5000);
});

test("calculateDirtyNodes respects Master Plan stage repeatability rules", () => {
  // Rule: Changing a caption should not regenerate the avatar or voice
  const captionEdit = calculateDirtyNodes("setCaptionStyle", ["sc_1"]);
  assert.deepEqual(captionEdit.dirtyTargets, ["caption_overlay", "scene_preview", "final_render"]);
  assert.ok(captionEdit.preservedTargets.includes("avatar_render"));
  assert.ok(captionEdit.preservedTargets.includes("source_footage"));
  assert.equal(captionEdit.requiresPaidRegeneration, false);

  // Rule: Replacing B-roll preserves narration audio and speech alignment
  const brollEdit = calculateDirtyNodes("replaceAsset", ["sc_2"]);
  assert.deepEqual(brollEdit.dirtyTargets, ["scene_preview", "final_render"]);
  assert.ok(brollEdit.preservedTargets.includes("narration_audio"));
  assert.ok(brollEdit.preservedTargets.includes("captions"));

  // Rule: Changing voiceover invalidates speech alignment, lip-sync, and audio mix
  const voiceEdit = calculateDirtyNodes("setVoiceover", ["sc_1"]);
  assert.ok(voiceEdit.dirtyTargets.includes("speech_alignment"));
  assert.ok(voiceEdit.dirtyTargets.includes("avatar_render"));
  assert.ok(voiceEdit.dirtyTargets.includes("audio_mix"));
  assert.equal(voiceEdit.requiresPaidRegeneration, true);
});
