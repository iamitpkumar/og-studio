'use client';
import { Plus, Upload, Download, Sparkles } from 'lucide-react';
import { captionPresets, titlePresets } from '../../../../packages/timeline/src/production.mjs';

export function TitleLibrary({ insert }: { insert: (preset: string) => void }) {
  return (
    <div className="template-list production-title-list">
      <p>Designed, editable title systems. Every treatment renders into your video.</p>
      {titlePresets.map(p => (
        <button key={p.id} className={`title-template production-title ${p.id}`} onClick={() => insert(p.id)}>
          <span>{p.text}</span>
          <small>{p.name}<Plus size={12} /></small>
        </button>
      ))}
    </div>
  );
}

export function CaptionLibrary({
  preset,
  setPreset,
  apply,
  importSubtitles,
  add,
  generate,
  pid,
  hasCaptions = false,
  insertPreset,
}: {
  preset: string;
  setPreset: (id: string) => void;
  apply: () => void;
  importSubtitles: () => void;
  add: () => void;
  generate: () => void;
  pid: string;
  hasCaptions?: boolean;
  insertPreset?: (id: string) => void;
}) {
  return (
    <div className="template-list production-caption-list">
      <p>Pick a caption system. Accurate word timing comes from speech recognition; imported subtitle timing can be edited.</p>
      <div className="caption-preset-grid">
        {captionPresets.map(p => {
          const isMarker = ['marker', 'vox'].includes(p.id);
          const isUpper = p.id === 'hormozi';
          return (
            <button
              key={p.id}
              className={`caption-preset ${preset === p.id ? 'selected' : ''} ${p.id}`}
              onClick={() => setPreset(p.id)}
            >
              <span>
                {isUpper ? 'MAKE ' : 'Make '}
                <b
                  style={{
                    color: isMarker ? '#10221d' : p.accent,
                    background: isMarker ? p.accent : undefined,
                  }}
                >
                  {isUpper ? 'EVERY' : 'every'}
                </b>
                {isUpper ? ' WORD COUNT.' : ' word count.'}
              </span>
              <strong>
                <span>{p.name}</span>
                <span
                  title={`Add ${p.name} caption`}
                  onClick={e => {
                    if (insertPreset) {
                      e.stopPropagation();
                      insertPreset(p.id);
                    }
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', padding: '2px', borderRadius: '3px' }}
                >
                  <Plus size={12} />
                </span>
              </strong>
            </button>
          );
        })}
      </div>
      <p>{captionPresets.find(p => p.id === preset)?.description}</p>
      <button className="editor-primary" onClick={apply}>
        {hasCaptions ? 'Apply style to captions' : 'Add caption with this style'}
      </button>
      <button className="editor-secondary" onClick={add}>
        <Plus size={13} />Write a caption
      </button>
      <button className="editor-secondary" onClick={generate}>
        <Sparkles size={13} />Transcribe actual speech
      </button>
      <button className="editor-secondary" onClick={importSubtitles}>
        <Upload size={13} />Import SRT / VTT
      </button>
      <a className="editor-link" href={`/api/editor/projects/${pid}/subtitles`}>
        <Download size={13} />Download SRT
      </a>
    </div>
  );
}
