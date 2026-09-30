import React from "react";
import type { CaptionStyleId, WordToken } from "@ai-studio/schemas";
import { CleanBottom } from "./CleanBottom";
import { BoldStack } from "./BoldStack";
import { EditorialSerif } from "./EditorialSerif";
import { KaraokeHighlight } from "./KaraokeHighlight";
import { GlassCaptionCard } from "./GlassCaptionCard";

export interface CaptionDispatcherProps {
  templateId: CaptionStyleId | string;
  words: WordToken[];
  emphasisWordIds?: string[];
  currentTimeMs: number;
}

export const CaptionDispatcher: React.FC<CaptionDispatcherProps> = ({
  templateId,
  words,
  emphasisWordIds = [],
  currentTimeMs
}) => {
  switch (templateId) {
    case "editorial-serif":
      return <EditorialSerif words={words} emphasisWordIds={emphasisWordIds} currentTimeMs={currentTimeMs} />;
    case "karaoke-highlight":
      return <KaraokeHighlight words={words} currentTimeMs={currentTimeMs} />;
    case "glass-caption-card":
      return <GlassCaptionCard words={words} emphasisWordIds={emphasisWordIds} currentTimeMs={currentTimeMs} />;
    case "clean-bottom":
      return <CleanBottom words={words} emphasisWordIds={emphasisWordIds} currentTimeMs={currentTimeMs} />;
    case "bold-stack":
    default:
      return <BoldStack words={words} emphasisWordIds={emphasisWordIds} currentTimeMs={currentTimeMs} />;
  }
};
