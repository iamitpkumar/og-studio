import React from "react";
import type { WordToken } from "@ai-studio/schemas";

export interface EditorialSerifProps {
  words: WordToken[];
  emphasisWordIds?: string[];
  currentTimeMs: number;
}

export const EditorialSerif: React.FC<EditorialSerifProps> = ({ words, emphasisWordIds = [] }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "20%",
        left: "8%",
        right: "8%",
        textAlign: "center",
        pointerEvents: "none"
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "20px 32px",
          background: "linear-gradient(180deg, rgba(20,20,24,0.7) 0%, rgba(10,10,14,0.9) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "18px",
          backdropFilter: "blur(12px)"
        }}
      >
        {words.map((word, idx) => {
          const isEmphasized = emphasisWordIds.includes(word.id);
          return (
            <span
              key={word.id}
              style={{
                fontFamily: isEmphasized ? "'Playfair Display', Georgia, serif" : "'Inter', sans-serif",
                fontStyle: isEmphasized ? "italic" : "normal",
                fontSize: isEmphasized ? "54px" : "42px",
                fontWeight: isEmphasized ? 700 : 400,
                color: isEmphasized ? "#F7DFB9" : "#FFFFFF",
                letterSpacing: isEmphasized ? "0.02em" : "0.01em",
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
