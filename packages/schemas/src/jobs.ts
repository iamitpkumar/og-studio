import { z } from "zod";

export const AssetTypeSchema = z.enum([
  "video",
  "image",
  "audio_voiceover",
  "audio_music",
  "audio_sfx",
  "transcript",
  "matte_mask",
  "logo",
  "document"
]);
export type AssetType = z.infer<typeof AssetTypeSchema>;

export const AssetSourceSchema = z.enum([
  "user_upload",
  "ai_generated",
  "licensed_stock",
  "derived_render"
]);
export type AssetSource = z.infer<typeof AssetSourceSchema>;

export const AssetSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  project_id: z.string().uuid(),
  type: AssetTypeSchema,
  source: AssetSourceSchema.default("user_upload"),
  filename: z.string().min(1),
  file_path: z.string().min(1),
  mime_type: z.string(),
  size_bytes: z.number().int().min(0),
  checksum_sha256: z.string(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  duration_ms: z.number().int().optional(),
  fps: z.number().optional(),
  has_audio: z.boolean().default(false),
  provenance_info: z.record(z.any()).default({}),
  created_at: z.string().datetime().default(() => new Date().toISOString())
});
export type Asset = z.infer<typeof AssetSchema>;

export const StageStatusSchema = z.enum([
  "pending",
  "running",
  "waiting_for_approval",
  "completed",
  "failed",
  "cancelled"
]);
export type StageStatus = z.infer<typeof StageStatusSchema>;

export const StageIdSchema = z.enum([
  "00_intake",
  "01_source_analysis",
  "02_creative_direction",
  "03_script_and_claims",
  "04_storyboard",
  "05_production_planner",
  "06_asset_creation",
  "07_timing_and_transcript",
  "08_editing",
  "09_graphics_and_audio",
  "10_quality_control",
  "11_render_and_delivery"
]);
export type StageId = z.infer<typeof StageIdSchema>;

export const StageRunSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  project_id: z.string().uuid(),
  stage_id: StageIdSchema,
  status: StageStatusSchema.default("pending"),
  input_artifact_ids: z.array(z.string()).default([]),
  output_artifact_ids: z.array(z.string()).default([]),
  model_id: z.string().optional(),
  cost_cents: z.number().int().default(0),
  error_message: z.string().optional(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional()
});
export type StageRun = z.infer<typeof StageRunSchema>;

export const RenderJobSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  project_id: z.string().uuid(),
  timeline_id: z.string().uuid(),
  quality: z.enum(["draft_preview", "final_delivery"]).default("draft_preview"),
  status: StageStatusSchema.default("pending"),
  progress_percent: z.number().min(0).max(100).default(0),
  output_path: z.string().optional(),
  error_message: z.string().optional(),
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  completed_at: z.string().datetime().optional()
});
export type RenderJob = z.infer<typeof RenderJobSchema>;
