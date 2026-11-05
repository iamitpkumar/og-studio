'use client';
import { useRef, useEffect, useState } from 'react';

interface HyperFramesPlayerProps {
  projectId: string;
  revision: number;
  frame: number;
  fps: number;
  width: number;
  height: number;
  scale: number;
  zoom: number;
  playing: boolean;
  speed: number;
  safe: boolean;
  onSelectClip: (clipId: string) => void;
  onSeek: (frame: number) => void;
}

export default function HyperFramesPlayer({
  projectId,
  revision,
  frame,
  fps,
  width,
  height,
  scale,
  zoom,
  playing,
  speed,
  safe,
  onSelectClip,
  onSeek,
}: HyperFramesPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const lastSentFrame = useRef<number>(-1);

  // Sync seek and playhead with iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !ready) return;
    if (lastSentFrame.current !== frame) {
      lastSentFrame.current = frame;
      iframe.contentWindow.postMessage({ type: 'hf:seek', time: frame / fps }, '*');
    }
  }, [frame, fps, ready]);

  // Sync play/pause with iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !ready) return;
    iframe.contentWindow.postMessage(
      { type: playing ? 'hf:play' : 'hf:pause', speed },
      '*'
    );
  }, [playing, speed, ready]);

  // Listen for iframe events
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'hf:ready') {
        setReady(true);
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'hf:seek', time: frame / fps },
          '*'
        );
      } else if (data.type === 'hf:element_clicked' && data.clipId) {
        onSelectClip(data.clipId);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [frame, fps, onSelectClip]);

  const previewUrl = `/api/editor/projects/${projectId}/preview-html?v=${revision}`;

  return (
    <div
      className="composition-sizer hyperframes-sizer"
      style={{
        width: width * scale * zoom,
        height: height * scale * zoom,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="hyperframes-canvas-wrap"
        style={{
          width,
          height,
          transform: `scale(${scale * zoom})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <iframe
          ref={iframeRef}
          key={`${projectId}-${revision}`}
          src={previewUrl}
          title="HyperFrames Live Composition Preview"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            pointerEvents: playing ? 'none' : 'auto',
          }}
        />
        {safe && <div className="safe-area" />}
      </div>
    </div>
  );
}