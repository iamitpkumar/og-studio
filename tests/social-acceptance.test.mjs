import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

mkdirSync('data/test-runs', { recursive: true });
process.env.MOTION_DATA_DIR = mkdtempSync(join(process.cwd(), 'data/test-runs/social-acc-'));

const store = await import('../apps/web/src/server/editor-store.mjs');
const { approve } = await import('../apps/web/src/server/editor-director.mjs');
const { compileTimeline } = await import('../apps/web/src/server/editor-renderer.mjs');

test('social video end-to-end acceptance: 9:16 vertical, Hormozi captions, hook badge, and iframe bridge', async () => {
  // 1. Create a 9:16 vertical project
  let state = store.createProject({ name: 'Viral Reel 9:16' });
  state = store.edit(state.project.id, {
    expectedRevision: state.revision,
    requestKey: 'set-ratio-9-16',
    operations: [
      {
        type: 'UpdateProject',
        sequence: { width: 1080, height: 1920, fps: 30, durationFrames: 180 },
      },
    ],
  });

  assert.equal(state.project.sequence.width, 1080);
  assert.equal(state.project.sequence.height, 1920);

  // 2. Connect MCP client
  const client = new Client({ name: 'agent-social-client', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve('scripts/editor-mcp.mjs'), '--project', state.project.id],
    env: { ...process.env, MOTION_DATA_DIR: process.env.MOTION_DATA_DIR },
    stderr: 'pipe',
  });

  try {
    await client.connect(transport);
    const catalog = await client.listTools();
    assert.equal(catalog.tools.length, 10);

    const call = async (name, args = {}) => {
      const res = await client.callTool({ name, arguments: args });
      assert.ok(!res.isError, res.content[0].text);
      return JSON.parse(res.content[0].text);
    };

    // 3. Propose Hormozi captions
    const captionsTrack = state.project.tracks.find((t) => t.kind === 'captions');
    assert.ok(captionsTrack, 'Captions track exists');

    const capProp = await call('generate_social_captions', {
      expectedRevision: state.revision,
      requestKey: 'req-caps-1',
      label: 'Add Hormozi animated captions',
      trackId: captionsTrack.id,
      text: 'Stop scrolling and watch this trick',
      preset: 'hormozi',
      startFrame: 0,
      durationFrames: 150,
    });
    assert.equal(capProp.status, 'approval_required');

    // Approve the proposal
    approve(state.project.id, {
      expectedRevision: state.revision,
      messageId: capProp.proposalId,
    });

    let current = await call('inspect_project');
    assert.equal(current.revision, state.revision + 1);
    const captionClip = current.project.tracks
      .find((t) => t.id === captionsTrack.id)
      ?.clips.find((c) => c.kind === 'captions');
    assert.ok(captionClip, 'Caption clip was added');
    assert.equal(captionClip.caption.preset, 'hormozi');
    assert.equal(captionClip.caption.accent, '#ffd700');
    assert.ok(captionClip.words.length > 0);

    // 4. Propose Hook Badge motion graphic
    const textTrack = state.project.tracks.find((t) => t.kind === 'text');
    assert.ok(textTrack, 'Text track exists');

    const badgeProp = await call('add_motion_graphic', {
      expectedRevision: current.revision,
      requestKey: 'req-badge-1',
      label: 'Add hook badge header',
      trackId: textTrack.id,
      template: 'hook-badge',
      text: 'DON’T MISS THIS',
      startFrame: 0,
      durationFrames: 90,
    });
    assert.equal(badgeProp.status, 'approval_required');

    approve(state.project.id, {
      expectedRevision: current.revision,
      messageId: badgeProp.proposalId,
    });

    current = await call('inspect_project');
    const badgeClip = current.project.tracks
      .find((t) => t.id === textTrack.id)
      ?.clips.find((c) => c.design?.preset === 'hook-badge');
    assert.ok(badgeClip, 'Hook badge clip was added');
    assert.equal(badgeClip.animation.preset, 'rise');

    // 5. Propose Progress Bar motion graphic
    const barProp = await call('add_motion_graphic', {
      expectedRevision: current.revision,
      requestKey: 'req-bar-1',
      label: 'Add retention progress bar',
      trackId: textTrack.id,
      template: 'progress-bar',
      startFrame: 0,
      durationFrames: 180,
    });
    assert.equal(barProp.status, 'approval_required');

    approve(state.project.id, {
      expectedRevision: current.revision,
      messageId: barProp.proposalId,
    });

    current = await call('inspect_project');
    const barClip = current.project.tracks
      .find((t) => t.id === textTrack.id)
      ?.clips.find((c) => c.design?.preset === 'progress-bar');
    assert.ok(barClip, 'Progress bar clip was added');

    // 6. Test timeline compilation with live iframe preview bridge
    const html = compileTimeline(current.project, [], { isLivePreview: true });
    assert.ok(html.includes('data-composition-id="main"'), 'Has HyperFrames composition id');
    assert.ok(html.includes('data-width="1080" data-height="1920"'), 'Has 9:16 vertical resolution');
    assert.ok(html.includes('hf:seek'), 'Has iframe postMessage seek handler');
    assert.ok(html.includes('hf:play'), 'Has iframe postMessage play handler');
    assert.ok(html.includes('hf:ready'), 'Posts ready message to parent');
    assert.ok(html.includes('gsap.min.js'), 'Includes local GSAP runtime');
  } finally {
    await client.close();
  }
});
