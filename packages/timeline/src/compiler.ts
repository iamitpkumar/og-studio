import type { Storyboard, CaptionTrack, CanonicalTimeline, TimelineTrack, TimelineClip } from "@ai-studio/schemas";

export interface CompileOptions {
  aspectRatio?: "9:16" | "16:9" | "1:1" | "4:5";
  fps?: number;
  width?: number;
  height?: number;
}

export function compileStoryboardToTimeline(
  storyboard: Storyboard,
  captionTrack?: CaptionTrack,
  options: CompileOptions = {}
): CanonicalTimeline {
  const aspectRatio = options.aspectRatio ?? "9:16";
  const fps = options.fps ?? 30;
  const width = options.width ?? (aspectRatio === "9:16" ? 1080 : aspectRatio === "16:9" ? 1920 : 1080);
  const height = options.height ?? (aspectRatio === "9:16" ? 1920 : aspectRatio === "16:9" ? 1080 : 1080);

  const videoClips: TimelineClip[] = [];
  const voiceClips: TimelineClip[] = [];
  const captionClips: TimelineClip[] = [];

  let currentCursorMs = 0;

  for (const scene of storyboard.scenes) {
    const sceneDuration = scene.targetDurationMs;

    videoClips.push({
      id: `clip_vid_${scene.id}`,
      scene_id: scene.id,
      asset_id: scene.sourceAssetId || scene.generatedAssetId,
      start_ms: currentCursorMs,
      duration_ms: sceneDuration,
      source_in_ms: 0,
      source_out_ms: sceneDuration,
      speed: 1.0,
      volume: 1.0,
      is_muted: false,
      metadata: {
        narrativeGoal: scene.narrativeGoal,
        shotType: scene.shotType,
        visualDescription: scene.visualDescription
      }
    });

    if (scene.narrationScript) {
      voiceClips.push({
        id: `clip_voice_${scene.id}`,
        scene_id: scene.id,
        start_ms: currentCursorMs,
        duration_ms: sceneDuration,
        source_in_ms: 0,
        source_out_ms: sceneDuration,
        speed: 1.0,
        volume: 1.0,
        is_muted: false,
        metadata: {
          script: scene.narrationScript
        }
      });
    }

    currentCursorMs += sceneDuration;
  }

  if (captionTrack && captionTrack.groups.length > 0) {
    for (const group of captionTrack.groups) {
      captionClips.push({
        id: `clip_cap_${group.id}`,
        scene_id: group.scene_id,
        start_ms: group.start_ms,
        duration_ms: group.end_ms - group.start_ms,
        source_in_ms: 0,
        speed: 1.0,
        volume: 1.0,
        is_muted: false,
        metadata: {
          templateId: group.template_id,
          wordIds: group.word_ids,
          emphasisWordIds: group.emphasis_word_ids,
          positionYPercent: group.position_y_percent
        }
      });
    }
  }

  const tracks: TimelineTrack[] = [
    {
      id: "track_video_main",
      type: "video",
      name: "Main Footage",
      is_locked: false,
      is_muted: false,
      volume: 1.0,
      clips: videoClips
    },
    {
      id: "track_voice_main",
      type: "voiceover",
      name: "Speech / Voiceover",
      is_locked: false,
      is_muted: false,
      volume: 1.0,
      clips: voiceClips
    },
    {
      id: "track_captions_main",
      type: "captions",
      name: "Dynamic Captions",
      is_locked: false,
      is_muted: false,
      volume: 1.0,
      clips: captionClips
    }
  ];

  return {
    id: crypto.randomUUID(),
    project_id: storyboard.projectId,
    version: storyboard.version,
    aspect_ratio: aspectRatio,
    width,
    height,
    fps,
    duration_ms: currentCursorMs,
    tracks,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
