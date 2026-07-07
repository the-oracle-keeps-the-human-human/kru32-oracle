# Workspace and Filesystem Management

## Overview

Manages working directories, file tracking, and workspace isolation through coordinated modules: `workspace.mjs`, `state.mjs`, `tracked-jobs.mjs`, `fs.mjs`.

## Workspace Root Resolution

Uses git repository root with fallback to cwd:
```javascript
export function resolveWorkspaceRoot(cwd) {
  try { return ensureGitRepository(cwd); }
  catch { return cwd; }
}
```

## State Directory Isolation

Formula: `{stateRoot}/{workspace-slug}-{sha256-hash[:16]}/`
- Symlinks resolved via `fs.realpathSync.native()`
- Multiple clones get separate state via different hashes
- Sanitized naming for filesystem safety

## File Utilities (fs.mjs)

- `ensureAbsolutePath(cwd, maybePath)` -- Normalize relative paths
- `readJsonFile(filePath)` / `writeJsonFile(filePath, value)` -- JSON with 2-space indent + trailing newline
- `safeReadFile(filePath)` -- Returns empty string if missing
- `isProbablyText(buffer)` -- Null-byte scanning (first 4096 bytes)
- `readStdinIfPiped()` -- Detects piped stdin
- `createTempDir(prefix)` -- Unique temp directories

## Job Tracking

- Jobs tagged with `CODEX_COMPANION_SESSION_ID` from environment
- `createJobRecord()` -- Creates with timestamp and session ID
- `generateJobId(prefix)` -- Format: `{prefix}-{timestamp-base36}-{random-base36}`
- `runTrackedJob()` -- Full lifecycle management with error handling
- `createJobProgressUpdater()` -- Selective update optimization

## State Persistence

- `updateState(cwd, mutate)` -- Load-mutate-save pattern
- `upsertJob(cwd, jobPatch)` -- Upsert with timestamp tracking
- `saveState(cwd, state)` -- Prune to 50 jobs, clean orphaned files

## Session Isolation

Optional `CODEX_COMPANION_SESSION_ID` enables per-session job filtering. Jobs without session ID visible to all sessions.
