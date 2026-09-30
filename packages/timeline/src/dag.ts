import type { EditOperationType } from "@ai-studio/schemas";

export type InvalidationTarget = 
  | "caption_overlay"
  | "scene_preview"
  | "final_render"
  | "avatar_render"
  | "audio_mix"
  | "speech_alignment";

export interface InvalidationResult {
  dirtyTargets: InvalidationTarget[];
  preservedTargets: string[];
  requiresPaidRegeneration: boolean;
  affectedSceneIds: string[];
}

/**
 * Calculates which stages and cached outputs must be invalidated
 * based on the Master Plan Stage Repeatability DAG rules.
 */
export function calculateDirtyNodes(
  operationType: EditOperationType,
  sceneIds: string[]
): InvalidationResult {
  switch (operationType) {
    case "setCaptionStyle":
    case "updateText":
      return {
        dirtyTargets: ["caption_overlay", "scene_preview", "final_render"],
        preservedTargets: ["source_footage", "avatar_render", "audio_mix", "speech_alignment"],
        requiresPaidRegeneration: false,
        affectedSceneIds: sceneIds
      };

    case "replaceAsset":
    case "trimClip":
      return {
        dirtyTargets: ["scene_preview", "final_render"],
        preservedTargets: ["narration_audio", "speech_alignment", "captions", "avatar_render"],
        requiresPaidRegeneration: false,
        affectedSceneIds: sceneIds
      };

    case "setVoiceover":
      return {
        dirtyTargets: ["speech_alignment", "caption_overlay", "avatar_render", "audio_mix", "scene_preview", "final_render"],
        preservedTargets: ["source_footage", "motion_graphics"],
        requiresPaidRegeneration: true,
        affectedSceneIds: sceneIds
      };

    case "setMusic":
    case "adjustMix":
      return {
        dirtyTargets: ["audio_mix", "final_render"],
        preservedTargets: ["all_video_tracks", "avatar_render", "captions", "voiceover"],
        requiresPaidRegeneration: false,
        affectedSceneIds: sceneIds
      };

    case "insertScene":
    case "deleteScene":
    case "reorderScene":
      return {
        dirtyTargets: ["scene_preview", "final_render", "audio_mix", "caption_overlay"],
        preservedTargets: ["approved_unaffected_scenes"],
        requiresPaidRegeneration: false,
        affectedSceneIds: sceneIds
      };

    default:
      return {
        dirtyTargets: ["scene_preview", "final_render"],
        preservedTargets: [],
        requiresPaidRegeneration: false,
        affectedSceneIds: sceneIds
      };
  }
}
