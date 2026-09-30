import React from "react";
import type { WordToken } from "@ai-studio/schemas";

export interface KaraokeHighlightProps {
  words: WordToken[];
  currentTimeMs: number;
}

export const KaraokeHighlight: React.FC<KaraokeHighlightProps> = ({ words, currentTimeMs }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "18%",
        left: "6%",
        right: "6%",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px 12px",
        textAlign: "center",
        pointerEvents: "none"
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(10, 12, 18, 0.82)",
          padding: "18px 24px",
          borderRadius: "20px",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.12)"
        }}
      >
        {words.map((word) => {
          const isActive = currentTimeMs >= word.start_ms && currentTimeMs <= word.end_ms;
          const isSpoken = currentTimeMs > word.end_ms;

          let color = "rgba(255, 255, 255, 0.55)";
          let transform = "scale(1)";
          let fontWeight = 600;

          if (isActive) {
            color = "#00F5D4";
            transform = "scale(1.12)";
            fontWeight = 800;
          } else if (isSpoken) {
            color = "#FFFFFF";
          }

          return (
            <span
              key={word.id}
              style={{
                display: "inline-block",
                fontFamily: "'Inter', sans-serif",
                fontSize: "44px",
                fontWeight,
                color,
                transform,
                transition: "all 0.1s ease-out",
                margin: "0 6px"
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
