import React from "react";
import { Composition } from "remotion";
import { VerticalSocial } from "./compositions/VerticalSocial";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VerticalSocial"
        component={VerticalSocial}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: "Skyline Luxury Penthouse",
          templateId: "bold-stack",
          showSafeAreas: false
        }}
      />
      <Composition
        id="LandscapeWide"
        component={VerticalSocial}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Skyline Luxury Penthouse",
          templateId: "editorial-serif",
          showSafeAreas: false
        }}
      />
      <Composition
        id="SquareSocial"
        component={VerticalSocial}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          title: "Skyline Luxury Penthouse",
          templateId: "glass-caption-card",
          showSafeAreas: false
        }}
      />
    </>
  );
};
