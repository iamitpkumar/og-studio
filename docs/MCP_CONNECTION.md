# Connect an assistant to the local editor

The server uses the official MCP TypeScript SDK 1.31.0 and stdio. Each process is restricted to one existing project ID. Find that ID in the project's JSON download or `?project=` URL. Start the web app and worker with `node scripts/dev.mjs` before requesting previews.

## Codex

Configure this project in Codex's MCP settings, or add a server table to its trusted project configuration. Example paths for this workstation:

```toml
[mcp_servers.motion_os]
command = 'D:\NodeJs\node.exe'
args = ['D:\OG Studio\scripts\editor-mcp.mjs', '--project', 'REPLACE_WITH_PROJECT_ID']
startup_timeout_sec = 30
tool_timeout_sec = 60
```

Alternatively, run `codex mcp add motion_os -- D:\NodeJs\node.exe "D:\OG Studio\scripts\editor-mcp.mjs" --project REPLACE_WITH_PROJECT_ID` in PowerShell. This writes client configuration; review the project ID first. We have not modified your global Codex settings. Configuration fields were checked against [official Codex MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) and the installed CLI's help.

## Claude Code

The installed Claude Code CLI supports this command:

```powershell
claude mcp add --scope local --transport stdio motion_os -- D:\NodeJs\node.exe "D:\OG Studio\scripts\editor-mcp.mjs" --project REPLACE_WITH_PROJECT_ID
```

Use the command from this repository and reopen Claude Code after configuration. Its default local scope is specific to this workspace. No Claude settings were changed during implementation.

## Workflow and boundaries

Select the intended title in Motion OS, then tell the assistant: “Inspect the connected project. Change only the selected title to ‘Made for more’, preserve my other edits, render a preview, and inspect its frames when complete.”

Tools: `inspect_project`, `search_media`, `edit_timeline`, `propose_clip`, `render_preview`, `export_status`, and `inspect_export_frames`.

The adapter applies at most five property operations to currently selected clips. Any unselected, structural, destructive or larger edit is stored as a proposal in Director. The assistant cannot call an approval tool, change project scope, import arbitrary paths, read unrelated files or run scripts. The human reviews proposed operations in the editor. Track locks, asset ownership and stale-revision checks apply to all entry points. Retrying an edit against an old revision fails safely; inspect again before submitting a new edit.

Preview requests return a job ID immediately. A running worker creates the MP4 and contact sheet, checks dimensions/timing and fully decodes the result. Only `completed` means those checks passed. `inspect_export_frames` returns an actual image through MCP. Contact sheets are useful for inspection but do not establish subjective creative quality or audio synchronization by themselves.

MCP transports use the [official SDK](https://ts.sdk.modelcontextprotocol.io/). These local controls scope what the Motion OS tools can do; they do not sandbox the assistant's unrelated shell or filesystem tools. Use the client's permissions when granting an assistant broader machine access.

## Verification scope

`tests/editor-mcp.test.mjs` launches the real stdio server as a child process and connects a real SDK client. It covers tool discovery, selected title edits, unchanged manual content, stale rejection, approval gating, unknown project/job rejection, queued render state, and rejection of code operations. The live acceptance script connects that same server to a real imported-media project and requests a new MP4.

Installed CLI versions observed: Codex 0.159.2 and Claude Code 2.1.22. Their command syntax was checked locally. A vendor-hosted model conversation through either client has not been run; protocol-level tests must not be described as that stronger compatibility test.
