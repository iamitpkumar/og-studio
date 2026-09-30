# Motion OS engineering entry point

Read `SOL.md` and `docs/EDITOR_AUDIT_AND_MIGRATION.md` before architectural work. Preserve existing project data and rendering systems. Use one validated command layer for manual, API and agent edits. Test frame timing, stale writes, asset isolation and actual rendering. Keep local services on loopback. Do not publish or deploy until explicitly requested.

Keep edits in this project. Prefer `D:\AI-Workspace\Codex` for standalone downloads and unrelated deliverables, subject to filesystem permissions. Do not relocate runtimes, credentials or app state. Project fixtures and test artifacts belong under ignored `data/test-runs`.
