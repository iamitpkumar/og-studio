import React from "react";
import type { WordToken } from "@ai-studio/schemas";

export interface CaptionProps {
  words: WordToken[];
  emphasisWordIds?: string[];
  currentTimeMs: number;
}

export const CleanBottom: React.FC<CaptionProps> = ({ words }) => {
  const text = words.map(w => w.text).join(" ");

  return (
    <div
      style={{
        position: "absolute",
        bottom: "16%",
        left: "8%",
        right: "8%",
        display: "flex",
        justifyContent: "center",
        textAlign: "center",
        pointerEvents: "none"
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.72)",
          backdropFilter: "blur(6px)",
          color: "#FFFFFF",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "44px",
          fontWeight: 600,
          lineHeight: 1.35,
          padding: "16px 28px",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          letterSpacing: "-0.01em"
        }}
      >
        {text}
      </div>
    </div>
  );
};
