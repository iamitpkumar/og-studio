import React from "react";
import type { WordToken } from "@ai-studio/schemas";

export interface BoldStackProps {
  words: WordToken[];
  emphasisWordIds?: string[];
  currentTimeMs: number;
}

export const BoldStack: React.FC<BoldStackProps> = ({ words, emphasisWordIds = [] }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "22%",
        left: "6%",
        right: "6%",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px 14px",
        textAlign: "center",
        pointerEvents: "none"
      }}
    >
      {words.map((word) => {
        const isEmphasized = emphasisWordIds.includes(word.id);
        return (
          <span
            key={word.id}
            style={{
              fontFamily: "'Inter', 'Montserrat', sans-serif",
              fontSize: isEmphasized ? "58px" : "46px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: isEmphasized ? "#FFE600" : "#FFFFFF",
              backgroundColor: isEmphasized ? "#181B27" : "rgba(24, 27, 39, 0.85)",
              padding: isEmphasized ? "6px 18px" : "4px 12px",
              borderRadius: "10px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
              display: "inline-block",
              transform: isEmphasized ? "scale(1.05)" : "scale(1)",
              transition: "transform 0.15s ease"
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};
