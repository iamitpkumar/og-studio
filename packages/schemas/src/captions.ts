import { z } from "zod";

export const CaptionStyleIdSchema = z.enum([
  "clean-bottom",
  "bold-stack",
  "single-word-punch",
  "editorial-serif",
  "kinetic-phrase",
  "karaoke-highlight",
  "behind-subject",
  "side-note",
  "glass-caption-card",
  "property-metric",
  "product-detail",
  "minimal-outline",
  "neon-accent",
  "multiline-editorial",
  "quiet-documentary"
]);
export type CaptionStyleId = z.infer<typeof CaptionStyleIdSchema>;

export const WordTokenSchema = z.object({
  id: z.string().default(() => `w_${crypto.randomUUID().slice(0, 8)}`),
  text: z.string(),
  start_ms: z.number().int().min(0),
  end_ms: z.number().int().min(0),
  confidence: z.number().min(0).max(1).default(1.0),
  speaker_id: z.string().optional()
});
export type WordToken = z.infer<typeof WordTokenSchema>;

export const CaptionAnchorSchema = z.enum([
  "top-center",
  "center",
  "lower-center",
  "bottom-third",
  "left-margin",
  "right-margin",
  "custom"
]);
export type CaptionAnchor = z.infer<typeof CaptionAnchorSchema>;

export const CaptionGroupSchema = z.object({
  id: z.string().default(() => `grp_${crypto.randomUUID().slice(0, 8)}`),
  scene_id: z.string().optional(),
  word_ids: z.array(z.string()).min(1),
  start_ms: z.number().int().min(0),
  end_ms: z.number().int().min(0),
  template_id: CaptionStyleIdSchema.default("bold-stack"),
  emphasis_word_ids: z.array(z.string()).default([]),
  anchor: CaptionAnchorSchema.default("lower-center"),
  position_y_percent: z.number().min(0).max(100).default(78),
  position_x_percent: z.number().min(0).max(100).default(50),
  subject_mask_asset_id: z.string().optional(),
  review_state: z.enum(["draft", "approved", "flagged"]).default("draft"),
  custom_text_override: z.string().optional()
});
export type CaptionGroup = z.infer<typeof CaptionGroupSchema>;

export const CaptionTrackSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  project_id: z.string().uuid(),
  language: z.string().default("en-IN"),
  is_primary: z.boolean().default(true),
  source_audio_asset_id: z.string().optional(),
  words: z.array(WordTokenSchema).default([]),
  groups: z.array(CaptionGroupSchema).default([]),
  version: z.number().int().min(1).default(1),
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  updated_at: z.string().datetime().default(() => new Date().toISOString())
});
export type CaptionTrack = z.infer<typeof CaptionTrackSchema>;

export const SafeAreaProfileSchema = z.object({
  id: z.enum([
    "instagram-reel",
    "youtube-short",
    "youtube-landscape",
    "generic-9x16",
    "generic-1x1",
    "generic-4x5"
  ]),
  top_inset_percent: z.number().default(12),
  bottom_inset_percent: z.number().default(16),
  side_inset_percent: z.number().default(8),
  right_controls_width_percent: z.number().default(14)
});
export type SafeAreaProfile = z.infer<typeof SafeAreaProfileSchema>;
