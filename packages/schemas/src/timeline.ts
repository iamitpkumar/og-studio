import { z } from "zod";
import { AspectRatioSchema } from "./brief.ts";

export const TrackTypeSchema = z.enum([
  "video",
  "avatar",
  "voiceover",
  "captions",
  "music",
  "sfx",
  "graphics_overlay"
]);
export type TrackType = z.infer<typeof TrackTypeSchema>;

export const TimelineClipSchema = z.object({
  id: z.string().default(() => `clip_${crypto.randomUUID().slice(0, 8)}`),
  scene_id: z.string().optional(),
  asset_id: z.string().optional(),
  start_ms: z.number().int().min(0),
  duration_ms: z.number().int().min(100),
  source_in_ms: z.number().int().min(0).default(0),
  source_out_ms: z.number().int().min(0).optional(),
  speed: z.number().min(0.1).max(10).default(1.0),
  volume: z.number().min(0).max(2).default(1.0),
  is_muted: z.boolean().default(false),
  metadata: z.record(z.any()).default({})
});
export type TimelineClip = z.infer<typeof TimelineClipSchema>;

export const TimelineTrackSchema = z.object({
  id: z.string().default(() => `track_${crypto.randomUUID().slice(0, 8)}`),
  type: TrackTypeSchema,
  name: z.string(),
  is_locked: z.boolean().default(false),
  is_muted: z.boolean().default(false),
  volume: z.number().min(0).max(2).default(1.0),
  clips: z.array(TimelineClipSchema).default([])
});
export type TimelineTrack = z.infer<typeof TimelineTrackSchema>;

export const CanonicalTimelineSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  project_id: z.string().uuid(),
  version: z.number().int().min(1).default(1),
  aspect_ratio: AspectRatioSchema.default("9:16"),
  width: z.number().int().default(1080),
  height: z.number().int().default(1920),
  fps: z.number().int().default(30),
  duration_ms: z.number().int().min(1000),
  tracks: z.array(TimelineTrackSchema),
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  updated_at: z.string().datetime().default(() => new Date().toISOString())
});
export type CanonicalTimeline = z.infer<typeof CanonicalTimelineSchema>;

export const EditOperationTypeSchema = z.enum([
  "insertScene",
  "deleteScene",
  "reorderScene",
  "trimClip",
  "replaceAsset",
  "setVoiceover",
  "setCaptionStyle",
  "addMotionTemplate",
  "setMusic",
  "adjustMix",
  "setTransition",
  "updateText",
  "renderPreview",
  "renderFinal"
]);
export type EditOperationType = z.infer<typeof EditOperationTypeSchema>;

export const EditOperationSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  project_id: z.string().uuid(),
  type: EditOperationTypeSchema,
  params: z.record(z.any()),
  diff_summary: z.string(),
  affected_scene_ids: z.array(z.string()).default([]),
  affected_track_ids: z.array(z.string()).default([]),
  requires_paid_regeneration: z.boolean().default(false),
  estimated_cost_cents: z.number().int().default(0),
  status: z.enum(["proposed", "approved", "applied", "rejected"]).default("proposed"),
  created_at: z.string().datetime().default(() => new Date().toISOString())
});
export type EditOperation = z.infer<typeof EditOperationSchema>;
