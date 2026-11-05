# Connect AI Agents to OG Studio (Motion OS)

OG Studio exposes a project-scoped Model Context Protocol (MCP) server over `stdio` using the official `@modelcontextprotocol/sdk` (TypeScript SDK v1.31.0). Each process is strictly scoped to one existing project ID. Find that ID in the project's JSON download or `?project=` URL.

Start the web app and render worker with `node scripts/dev.mjs` (or start the Next.js app on `http://127.0.0.1:3100`) before requesting live previews or exports.

---

## 1. Agent Configuration Guides

### Antigravity
Add the OG Studio MCP server to your Antigravity workspace or global MCP settings (`~/.gemini/antigravity/mcp.json` or project configuration):

```json
{
  "mcpServers": {
    "og_studio": {
      "command": "node",
      "args": [
        "D:\\OG Studio\\scripts\\editor-mcp.mjs",
        "--project",
        "YOUR_PROJECT_ID"
      ]
    }
  }
}
```

### Codex
Configure this project in Codex's MCP settings, or run PowerShell:

```powershell
codex mcp add motion_os -- D:\NodeJs\node.exe "D:\OG Studio\scripts\editor-mcp.mjs" --project YOUR_PROJECT_ID
```

Or add to Codex's configuration table (`config.toml`):

```toml
[mcp_servers.motion_os]
command = 'D:\NodeJs\node.exe'
args = ['D:\OG Studio\scripts\editor-mcp.mjs', '--project', 'YOUR_PROJECT_ID']
startup_timeout_sec = 30
tool_timeout_sec = 60
```

### Claude Code
Run in PowerShell from the repository root:

```powershell
claude mcp add --scope local --transport stdio motion_os -- D:\NodeJs\node.exe "D:\OG Studio\scripts\editor-mcp.mjs" --project YOUR_PROJECT_ID
```

### Grokbot & Cloud Work
Connect via stdio transport in your assistant's MCP client runner:

```json
{
  "name": "og_studio",
  "command": "node",
  "args": ["D:\\OG Studio\\scripts\\editor-mcp.mjs", "--project", "YOUR_PROJECT_ID"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 2. Complete Tool Catalog (10 Available Tools)

| Tool Name | Purpose | Direct or Proposal |
| :--- | :--- | :--- |
| `inspect_project` | Returns full project snapshot (sequence settings, tracks, clips, selection, revisions) | Read-only |
| `search_media` | Lists and filters media assets attached to the project by query or kind | Read-only |
| `edit_timeline` | Executes validated atomic timeline operations (up to 5 direct edits on selected clips) | Direct or Proposal |
| `propose_clip` | Proposes adding a new video, audio, image, text, or captions clip | Proposal |
| `generate_social_captions` | Generates word-level animated social captions (`hormozi`, `vox`, `neon`, `minimal`, `karaoke`) | Proposal |
| `add_motion_graphic` | Inserts social motion graphics (`hook-badge`, `top-banner`, `progress-bar`, `callout`) | Proposal |
| `tighten_silences` | Calculates speech boundaries and splits/trims dead air with 100ms `afade` crossfades | Proposal |
| `render_preview` | Queues an export job using the local HyperFrames renderer and FFmpeg pipeline | Direct (Queued) |
| `export_status` | Checks progress, status, and stages of an active or completed export job | Read-only |
| `inspect_export_frames` | Retrieves contact sheet image bytes (JPEG) of the rendered export for visual inspection | Read-only |

---

## 3. Viral Social Video Workflows

### 3.1 Generating Hormozi-Style Captions
Prompt your agent:
> *"Inspect the connected project. Add Hormozi-style animated captions to the captions track with the text 'Stop scrolling and watch this trick' across the first 5 seconds."*

The agent calls:
```json
{
  "name": "generate_social_captions",
  "arguments": {
    "expectedRevision": 1,
    "requestKey": "add-hormozi-caps",
    "label": "Add Hormozi animated captions",
    "trackId": "captions-track-id",
    "text": "Stop scrolling and watch this trick",
    "preset": "hormozi",
    "accent": "#ffd700",
    "startFrame": 0,
    "durationFrames": 150
  }
}
```

### 3.2 Adding a High-Impact Hook Badge
Prompt your agent:
> *"Add a 3-second hook badge at the top with text 'DON'T MISS THIS'."*

The agent calls:
```json
{
  "name": "add_motion_graphic",
  "arguments": {
    "expectedRevision": 2,
    "requestKey": "add-hook-badge",
    "label": "Add entrance hook badge",
    "trackId": "text-track-id",
    "template": "hook-badge",
    "text": "DON'T MISS THIS",
    "startFrame": 0,
    "durationFrames": 90
  }
}
```

### 3.3 Adding a Retention Progress Bar
Prompt your agent:
> *"Add an accent progress bar at the bottom across the entire sequence duration."*

The agent calls:
```json
{
  "name": "add_motion_graphic",
  "arguments": {
    "expectedRevision": 3,
    "requestKey": "add-progress-bar",
    "label": "Add retention progress bar",
    "trackId": "text-track-id",
    "template": "progress-bar",
    "startFrame": 0,
    "durationFrames": 180
  }
}
```

---

## 4. Safety, Scoping, and Approval Boundaries

1. **Strict Project Isolation**: Each MCP process is locked to a single `--project <id>`. Attempts to query or mutate other projects or jobs are rejected immediately.
2. **Selective Direct Edits vs. Director Proposals**:
   - Up to 5 property updates on clips the human currently has **selected** in the UI apply immediately.
   - Any structural change (adding clips, deleting clips, reordering tracks, splitting silences) is saved as a pending proposal in the **Director** panel.
   - The agent cannot approve its own proposal; the creator reviews and clicks "Apply proposed edit".
3. **Optimistic Concurrency & Revision Locking**:
   - Every edit must specify `expectedRevision`. If the timeline changed in the editor, stale operations fail safely with code 409.
4. **No Arbitrary Execution**:
   - The MCP server exposes no shell, filesystem read/write, or arbitrary code execution tools. All edits must pass through the pure timeline reducer.

---

## 5. Automated Verification

Run the test suite to verify the MCP layer and social presets:

```powershell
node --test tests/editor-mcp.test.mjs tests/social-acceptance.test.mjs tests/social-video.test.mjs
```
