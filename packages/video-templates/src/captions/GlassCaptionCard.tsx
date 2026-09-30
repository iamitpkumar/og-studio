import React from "react";
import type { WordToken } from "@ai-studio/schemas";

export interface GlassCaptionCardProps {
  words: WordToken[];
  emphasisWordIds?: string[];
  currentTimeMs: number;
}

export const GlassCaptionCard: React.FC<GlassCaptionCardProps> = ({ words, emphasisWordIds = [] }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "19%",
        left: "8%",
        right: "8%",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none"
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.18)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1.5px solid rgba(255, 255, 255, 0.4)",
          borderRadius: "24px",
          padding: "18px 32px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
          textAlign: "center"
        }}
      >
        {words.map((word, idx) => {
          const isEmphasized = emphasisWordIds.includes(word.id);
          return (
            <span
              key={word.id}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "44px",
                fontWeight: isEmphasized ? 800 : 600,
                color: isEmphasized ? "#5848D9" : "#FFFFFF",
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                marginRight: idx < words.length - 1 ? "10px" : "0px"
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
