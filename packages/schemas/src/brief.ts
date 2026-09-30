import { z } from "zod";

export const IndustrySchema = z.enum([
  "real_estate",
  "ecommerce",
  "manufacturing",
  "saas",
  "general"
]);
export type Industry = z.infer<typeof IndustrySchema>;

export const AspectRatioSchema = z.enum(["9:16", "16:9", "1:1", "4:5"]);
export type AspectRatio = z.infer<typeof AspectRatioSchema>;

export const PlatformSchema = z.enum([
  "instagram_reels",
  "youtube_shorts",
  "youtube_landscape",
  "tiktok",
  "linkedin",
  "general"
]);
export type Platform = z.infer<typeof PlatformSchema>;

export const BrandKitSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  clientId: z.string().uuid(),
  name: z.string().min(1),
  primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).default("#5848D9"),
  secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).default("#181B27"),
  accentColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).default("#8B80F4"),
  fontFamily: z.string().default("Inter"),
  logoAssetId: z.string().optional(),
  contactDetails: z.string().optional(),
  approvedClaims: z.array(z.string()).default([]),
  forbiddenClaims: z.array(z.string()).default([]),
  voicePreference: z.string().optional(),
  pronunciationDictionary: z.record(z.string()).default({})
});
export type BrandKit = z.infer<typeof BrandKitSchema>;

export const ClientSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  name: z.string().min(1),
  industry: IndustrySchema.default("general"),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString())
});
export type Client = z.infer<typeof ClientSchema>;

export const BriefSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  projectId: z.string().uuid(),
  title: z.string().min(1),
  rawPrompt: z.string().min(1),
  industry: IndustrySchema.default("general"),
  aspectRatio: AspectRatioSchema.default("9:16"),
  targetDurationSeconds: z.number().int().min(5).max(180).default(30),
  platforms: z.array(PlatformSchema).default(["instagram_reels"]),
  targetAudience: z.string().optional(),
  language: z.string().default("en-IN"),
  tone: z.string().default("cinematic and premium"),
  ctaText: z.string().optional(),
  avatarPreference: z.enum(["none", "talking_head_hero", "picture_in_picture", "voice_only"]).default("none"),
  captionStyleId: z.string().default("bold-stack"),
  budgetCeilingCents: z.number().int().optional(),
  verifiedFacts: z.array(z.string()).default([]),
  forbiddenClaims: z.array(z.string()).default([])
});
export type Brief = z.infer<typeof BriefSchema>;
