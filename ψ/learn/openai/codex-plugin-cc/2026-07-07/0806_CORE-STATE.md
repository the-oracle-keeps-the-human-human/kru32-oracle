# Core State Management: Codex Plugin

## Overview

Per-workspace, file-based state system tracking job execution, configuration, and operational history.

## Storage Location

```
{PLUGIN_DATA_ENV}/state/{workspace-slug}-{workspace-hash}/
```

Where workspace-hash = first 16 chars of SHA256 of canonical workspace root path.

## State Schema

```json
{
  "version": 1,
  "config": { "stopReviewGate": false },
  "jobs": [{ "id": "...", "kind": "task", "status": "completed", ... }]
}
```

## Job File Management

- `state.json` -- Summary for fast listing
- `jobs/{jobId}.json` -- Full record with result and rendered fields
- `jobs/{jobId}.log` -- Timestamped progress log

## State Mutation Functions

- `setConfig(cwd, key, value)` -- Update workspace configuration
- `upsertJob(cwd, jobPatch)` -- Add or update job records
- `createJobProgressUpdater(workspaceRoot, jobId)` -- Track phase/threadId/turnId changes
- `runTrackedJob(job, runner, options)` -- Orchestrate full job execution

## Job Lifecycle Transitions

```
queued -> running (startedAt, phase="starting", pid set)
       -> completed (phase="done", pid cleared, result stored)
       -> failed (phase="failed", pid cleared, error stored)
       -> cancelled (phase="cancelled", pid cleared)
```

## Pruning

Maximum 50 jobs retained. Pruning by `updatedAt` timestamp, removes both JSON and log files.

## Session Isolation

Jobs tagged with `CODEX_COMPANION_SESSION_ID` for multi-session workspace support.
