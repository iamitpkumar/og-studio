import { z } from "zod";

export const ShotTypeSchema = z.enum([
  "wide_establishing",
  "medium_shot",
  "close_up",
  "macro_detail",
  "aerial_drone",
  "screen_recording",
  "talking_head_hero",
  "split_screen",
  "product_spotlight"
]);
export type ShotType = z.infer<typeof ShotTypeSchema>;

export const SceneApprovalStateSchema = z.enum([
  "draft",
  "pending_review",
  "approved",
  "rejected"
]);
export type SceneApprovalState = z.infer<typeof SceneApprovalStateSchema>;

export const SceneSchema = z.object({
  id: z.string().default(() => `scene_${crypto.randomUUID().slice(0, 8)}`),
  order: z.number().int().min(0),
  title: z.string().min(1),
  narrativeGoal: z.string().min(1),
  shotType: ShotTypeSchema.default("medium_shot"),
  targetDurationMs: z.number().int().min(1000).max(60000),
  narrationScript: z.string().default(""),
  onScreenText: z.string().optional(),
  visualDescription: z.string().min(1),
  sourceAssetId: z.string().optional(),
  generatedAssetId: z.string().optional(),
  captionStyleId: z.string().default("bold-stack"),
  motionTemplateId: z.string().optional(),
  associatedFactIds: z.array(z.string()).default([]),
  approvalState: SceneApprovalStateSchema.default("draft"),
  notes: z.string().optional()
});
export type Scene = z.infer<typeof SceneSchema>;

export const StoryboardSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  projectId: z.string().uuid(),
  version: z.number().int().min(1).default(1),
  title: z.string().min(1),
  totalDurationMs: z.number().int().min(1000),
  scenes: z.array(SceneSchema),
  approvedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().default(() => new Date().toISOString())
});
export type Storyboard = z.infer<typeof StoryboardSchema>;
