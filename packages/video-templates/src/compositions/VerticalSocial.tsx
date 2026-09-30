import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { WordToken, CaptionStyleId } from "@ai-studio/schemas";
import { CaptionDispatcher } from "../captions/CaptionDispatcher";

export interface SceneVisualItem {
  id: string;
  title: string;
  narrativeGoal: string;
  visualDescription: string;
  durationInFrames: number;
  bgGradient: string;
}

export interface VerticalSocialProps {
  title: string;
  scenes?: SceneVisualItem[];
  words?: WordToken[];
  templateId?: CaptionStyleId;
  emphasisWordIds?: string[];
  showSafeAreas?: boolean;
}

export const VerticalSocial: React.FC<VerticalSocialProps> = ({
  title = "Skyline Luxury Penthouse",
  scenes = [
    {
      id: "sc_1",
      title: "Double-Height Foyer",
      narrativeGoal: "Hook audience with dramatic entrance",
      visualDescription: "Imported Italian marble flooring with custom crystal chandelier",
      durationInFrames: 90,
      bgGradient: "linear-gradient(135deg, #1A1C29 0%, #0D0E15 100%)"
    },
    {
      id: "sc_2",
      title: "Panoramic Living Room",
      narrativeGoal: "Showcase wrap-around skyline views",
      visualDescription: "Floor-to-ceiling glass windows overlooking the city skyline at sunset",
      durationInFrames: 90,
      bgGradient: "linear-gradient(135deg, #2E1A47 0%, #150D24 100%)"
    },
    {
      id: "sc_3",
      title: "Private Rooftop Infinity Pool",
      narrativeGoal: "Deliver unforgettable luxury CTA",
      visualDescription: "Heated infinity pool with teak deck and glass balustrades",
      durationInFrames: 120,
      bgGradient: "linear-gradient(135deg, #0C2836 0%, #06151D 100%)"
    }
  ],
  words = [
    { id: "w1", text: "Welcome", start_ms: 200, end_ms: 700, confidence: 1.0 },
    { id: "w2", text: "to", start_ms: 720, end_ms: 900, confidence: 1.0 },
    { id: "w3", text: "unmatched", start_ms: 950, end_ms: 1500, confidence: 1.0 },
    { id: "w4", text: "luxury.", start_ms: 1550, end_ms: 2300, confidence: 1.0 },
    { id: "w5", text: "Experience", start_ms: 3200, end_ms: 3800, confidence: 1.0 },
    { id: "w6", text: "skyline", start_ms: 3850, end_ms: 4500, confidence: 1.0 },
    { id: "w7", text: "views", start_ms: 4550, end_ms: 5200, confidence: 1.0 },
    { id: "w8", text: "above", start_ms: 5300, end_ms: 5800, confidence: 1.0 },
    { id: "w9", text: "all.", start_ms: 5850, end_ms: 6600, confidence: 1.0 },
    { id: "w10", text: "Book", start_ms: 7200, end_ms: 7600, confidence: 1.0 },
    { id: "w11", text: "your", start_ms: 7650, end_ms: 7900, confidence: 1.0 },
    { id: "w12", text: "private", start_ms: 7950, end_ms: 8500, confidence: 1.0 },
    { id: "w13", text: "tour.", start_ms: 8550, end_ms: 9300, confidence: 1.0 }
  ],
  templateId = "bold-stack",
  emphasisWordIds = ["w3", "w4", "w6", "w12", "w13"],
  showSafeAreas = false
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  // Determine current active scene
  let accumulatedFrames = 0;
  let activeScene = scenes[0];
  let sceneLocalFrame = frame;

  for (const scene of scenes) {
    if (frame >= accumulatedFrames && frame < accumulatedFrames + scene.durationInFrames) {
      activeScene = scene;
      sceneLocalFrame = frame - accumulatedFrames;
      break;
    }
    accumulatedFrames += scene.durationInFrames;
  }

  // Camera zoom motion simulation (subtle push-in)
  const scale = interpolate(sceneLocalFrame, [0, activeScene.durationInFrames], [1, 1.06], {
    extrapolateRight: "clamp"
  });

  // Filter words active near current window (active phrase)
  const visibleWords = words.filter(
    (w) => currentTimeMs >= w.start_ms - 200 && currentTimeMs <= w.end_ms + 400
  );

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#000000",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Background Visual Layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: activeScene.bgGradient,
          transform: `scale(${scale})`,
          transition: "background 0.4s ease"
        }}
      >
        {/* Subtle architectural grid / ambient lighting effect */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 50% 30%, rgba(88, 72, 217, 0.25) 0%, transparent 70%)"
          }}
        />
      </div>

      {/* Branded Watermark / Property Identifier */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "8%",
          right: "8%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "rgba(255, 255, 255, 0.85)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#5848D9",
              boxShadow: "0 0 12px #5848D9"
            }}
          />
          <span style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {title}
          </span>
        </div>
        <div
          style={{
            padding: "8px 18px",
            borderRadius: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(10px)",
            fontSize: "22px",
            fontWeight: 500
          }}
        >
          {activeScene.title}
        </div>
      </div>

      {/* Synchronized Captions */}
      {visibleWords.length > 0 && (
        <CaptionDispatcher
          templateId={templateId}
          words={visibleWords}
          emphasisWordIds={emphasisWordIds}
          currentTimeMs={currentTimeMs}
        />
      )}

      {/* Safe Area Guides (Debug overlay) */}
      {showSafeAreas && (
        <div
          style={{
            position: "absolute",
            top: "12%",
            bottom: "16%",
            left: "8%",
            right: "8%",
            border: "2px dashed rgba(255, 255, 0, 0.5)",
            pointerEvents: "none"
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              color: "#FFE600",
              fontSize: "20px",
              fontWeight: 600
            }}
          >
            Reels / Shorts Safe Area (1080×1920)
          </span>
        </div>
      )}
    </div>
  );
};
