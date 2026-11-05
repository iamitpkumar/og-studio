import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProject, newClip, applyOperations } from '../packages/timeline/src/editor.mjs';
import {
  captionPresets,
  titlePresets,
  captionSettings,
  captionLayout,
  titleLayout,
  textBoxStyle,
  textAtFrame,
  estimatedWords,
  captionsFromWords
} from '../packages/timeline/src/production.mjs';
import { compileTimeline } from '../apps/web/src/server/editor-renderer.mjs';
import { calculateSpeechSegments } from '../scripts/tighten-silences.mjs';

test('social caption presets include viral styles: Hormozi, Vox, Neon Pop, Minimal, Karaoke, Liquid Glass, Behind Subject', () => {
  const ids = captionPresets.map(p => p.id);
  assert.ok(ids.includes('hormozi'), 'hormozi preset missing');
  assert.ok(ids.includes('vox'), 'vox preset missing');
  assert.ok(ids.includes('neon'), 'neon preset missing');
  assert.ok(ids.includes('minimal'), 'minimal preset missing');
  assert.ok(ids.includes('karaoke'), 'karaoke preset missing');
  assert.ok(ids.includes('liquid-glass'), 'liquid-glass preset missing');
  assert.ok(ids.includes('behind-subject'), 'behind-subject preset missing');
  assert.ok(ids.includes('glass-card'), 'glass-card preset missing');
  assert.ok(ids.includes('cyber-neon'), 'cyber-neon preset missing');

  const hormozi = captionPresets.find(p => p.id === 'hormozi');
  assert.equal(hormozi.accent, '#ffd700');

  const liquid = captionPresets.find(p => p.id === 'liquid-glass');
  assert.equal(liquid.accent, '#64f4d2');

  const behind = captionPresets.find(p => p.id === 'behind-subject');
  assert.equal(behind.accent, '#ffd700');
});

test('social motion graphics presets include Hook Badge, Top Banner, Progress Bar, Callout, Liquid Glass, Frost HUD, Prismatic, Behind Title', () => {
  const ids = titlePresets.map(p => p.id);
  assert.ok(ids.includes('hook-badge'), 'hook-badge preset missing');
  assert.ok(ids.includes('top-banner'), 'top-banner preset missing');
  assert.ok(ids.includes('progress-bar'), 'progress-bar preset missing');
  assert.ok(ids.includes('callout'), 'callout preset missing');
  assert.ok(ids.includes('liquid-glass'), 'liquid-glass title preset missing');
  assert.ok(ids.includes('frost-hud'), 'frost-hud title preset missing');
  assert.ok(ids.includes('prismatic-glass'), 'prismatic-glass title preset missing');
  assert.ok(ids.includes('behind-title'), 'behind-title preset missing');

  const p = emptyProject();
  const badgeLayout = titleLayout('hook-badge', p.sequence);
  assert.ok(badgeLayout.y > 0);
  assert.ok(badgeLayout.width > 500);

  const bannerLayout = titleLayout('top-banner', p.sequence);
  assert.equal(bannerLayout.y, 0);
  assert.equal(bannerLayout.x, 0);

  const liquidLayout = titleLayout('liquid-glass', p.sequence);
  assert.ok(liquidLayout.width > 500);
  assert.ok(liquidLayout.y > 0);

  const behindLayout = titleLayout('behind-title', p.sequence);
  assert.ok(behindLayout.width >= 900);
});

test('liquid-glass caption renders frosted glassmorphism and specular glow', () => {
  const p = emptyProject();
  const c = newClip(p, 'captions');
  c.durationFrames = 60;
  c.text = 'Liquid Glass Reality';
  c.caption = { ...captionSettings('liquid-glass'), timing: 'transcribed' };
  c.words = [
    { text: 'Liquid', startFrame: 0, endFrame: 20 },
    { text: 'Glass', startFrame: 20, endFrame: 40 },
    { text: 'Reality', startFrame: 40, endFrame: 60 }
  ];

  const style = textBoxStyle(c);
  assert.ok(String(style.backdropFilter).includes('blur(24px)'));
  assert.ok(String(style.boxShadow).includes('inset'));
  assert.equal(style.borderRadius, '36px');

  // Seek to frame 25
  const words = textAtFrame(c, 25);
  assert.ok(words);
  assert.equal(words[1].active, true);
  assert.equal(words[1].style.color, '#64f4d2');
});

test('behind-subject caption renders cinematic depth positioning and 3D shadow', () => {
  const p = emptyProject();
  const c = newClip(p, 'captions');
  c.durationFrames = 60;
  c.text = 'Depth Perception';
  c.caption = { ...captionSettings('behind-subject'), timing: 'transcribed' };
  c.transform = captionLayout(p.sequence, 'behind-subject');

  const style = textBoxStyle(c);
  assert.equal(style.fontWeight, 900);
  assert.equal(style.textTransform, 'uppercase');
  assert.ok(String(style.textShadow).includes('rgba(0,0,0,0.95)'));
  // Behind subject is placed higher (around chest/head level)
  assert.ok(c.transform.y < p.sequence.height * 0.5);
  assert.ok(c.transform.width >= p.sequence.width * 0.9);
});

test('hormozi caption renders bold uppercase with active scale bounce', () => {
  const p = emptyProject();
  const c = newClip(p, 'captions');
  c.durationFrames = 60;
  c.text = 'Make it count';
  c.caption = { ...captionSettings('hormozi'), timing: 'transcribed' };
  c.words = [
    { text: 'Make', startFrame: 0, endFrame: 20 },
    { text: 'it', startFrame: 20, endFrame: 40 },
    { text: 'count', startFrame: 40, endFrame: 60 }
  ];

  const style = textBoxStyle(c);
  assert.equal(style.fontWeight, 900);
  assert.equal(style.textTransform, 'uppercase');
  assert.ok(String(style.textShadow).includes('#101010'));

  // Seek to frame 25 (second word "it" active)
  const words = textAtFrame(c, 25);
  assert.ok(words);
  assert.equal(words[1].active, true);
  assert.equal(words[1].style.color, '#ffd700');
  assert.ok(String(words[1].style.transform).includes('scale'));
  assert.equal(words[1].style.fontWeight, 900);
});

test('vox editorial caption renders marker background fill on active word', () => {
  const p = emptyProject();
  const c = newClip(p, 'captions');
  c.durationFrames = 60;
  c.text = 'The real story';
  c.caption = { ...captionSettings('vox'), timing: 'transcribed' };
  c.words = [
    { text: 'The', startFrame: 0, endFrame: 20 },
    { text: 'real', startFrame: 20, endFrame: 40 },
    { text: 'story', startFrame: 40, endFrame: 60 }
  ];

  const style = textBoxStyle(c);
  assert.equal(style.fontFamily, 'Georgia,serif');

  const words = textAtFrame(c, 25);
  assert.ok(words);
  assert.equal(words[1].active, true);
  assert.equal(words[1].style.backgroundColor, '#baff83');
  assert.equal(words[1].style.color, '#10221d');
});

test('compileTimeline with live preview options injects postMessage iframe bridge', () => {
  const p = emptyProject();
  const c = newClip(p, 'captions');
  c.durationFrames = 60;
  c.text = 'Preview text';
  c.caption = captionSettings('hormozi');
  c.words = estimatedWords(c.text, 60);

  const next = applyOperations(p, [{ type: 'AddClip', trackId: p.tracks[3].id, clip: c }]);
  const html = compileTimeline(next, [], {
    isLivePreview: true,
    gsapUrl: '/gsap.min.js',
    fontUrl: '/fonts/manrope-latin.woff2'
  });

  assert.ok(html.includes('hf:seek'), 'iframe bridge hf:seek message missing');
  assert.ok(html.includes('hf:play'), 'iframe bridge hf:play message missing');
  assert.ok(html.includes('hf:ready'), 'iframe bridge hf:ready message missing');
  assert.ok(html.includes('hf:element_clicked'), 'element clicked bridge event missing');
  assert.ok(html.includes('/gsap.min.js'), 'custom gsapUrl missing');
});

test('calculateSpeechSegments accurately extracts voice intervals with safety padding', () => {
  const silences = [
    { start: 2.0, end: 3.5, duration: 1.5 },
    { start: 7.0, end: 8.5, duration: 1.5 }
  ];
  const totalDuration = 10.0;
  const segments = calculateSpeechSegments(silences, totalDuration, 0.1);

  assert.equal(segments.length, 3);
  // First segment: 0 to ~2.1
  assert.equal(segments[0].start, 0);
  assert.ok(Math.abs(segments[0].end - 2.1) < 0.05);

  // Second segment: ~3.4 to ~7.1
  assert.ok(Math.abs(segments[1].start - 3.4) < 0.05);
  assert.ok(Math.abs(segments[1].end - 7.1) < 0.05);

  // Third segment: ~8.4 to 10
  assert.ok(Math.abs(segments[2].start - 8.4) < 0.05);
  assert.equal(segments[2].end, 10.0);
});
