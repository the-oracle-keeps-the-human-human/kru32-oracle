# Codex Process Management Architecture

## Overview

Multi-layered process management: low-level execution (`process.mjs`), job lifecycle tracking (`tracked-jobs.mjs`), and job control/status (`job-control.mjs`).

## Process Spawning: runCommand()

Uses `spawnSync` for synchronous execution. Platform-aware shell handling (Windows forces shell=true). Returns normalized result with status, signal, stdout, stderr, error.

Variants:
- `runCommandChecked()` -- Throws on failure
- `binaryAvailable()` -- Probes system for available commands

## Process Termination: terminateProcessTree()

| Platform | Primary | Fallback | Signal |
|----------|---------|----------|--------|
| Windows | `taskkill /PID /T /F` | `process.kill(pid)` | N/A |
| Unix | `kill -<pid> SIGTERM` (process group) | `kill <pid> SIGTERM` | SIGTERM |

Returns structured result: `{ attempted, delivered, method }`.

## Job Tracking (tracked-jobs.mjs)

- Session scoping via `CODEX_COMPANION_SESSION_ID`
- `createJobRecord()` -- Creates with timestamp and session ID
- `runTrackedJob()` -- Wraps execution with state management
- `createJobProgressUpdater()` -- Selective update optimization (only writes when values change)
- Log files with `appendLogLine()` and `appendLogBlock()`

## Job Control (job-control.mjs)

- Job states: queued, running, completed, failed, cancelled
- Phases: starting, reviewing, investigating, verifying, editing, finalizing
- Session filtering via environment variable
- Flexible job matching (exact ID, prefix, most recent)
- Status snapshots with enrichment (elapsed time, progress preview, phase inference)
- Job pruning: max 50 per workspace
