# /codex cancel Command

## Overview

Terminates active background Codex jobs through graceful cancellation:
1. Interrupt Codex turn at app server level
2. Terminate background worker process (and children)
3. Update job status to "cancelled"
4. Log the cancellation event

## Flow

1. Parse arguments (optional job-id, --json)
2. Resolve cancelable job (queued/running only)
3. Send `turn/interrupt` RPC to app server
4. `terminateProcessTree(job.pid)` -- platform-aware
5. Update job state (status=cancelled, pid=null, completedAt)
6. Render cancellation report

## Job Resolution

- No reference + 1 active job in session -> auto-cancel
- No reference + multiple active -> error requiring job-id
- Explicit reference -> exact or prefix matching
- Only active (queued/running) jobs cancellable

## Process Termination

- **Windows**: `taskkill /PID /T /F` -> fallback `process.kill()`
- **Unix**: `kill(-pid, SIGTERM)` (process group) -> fallback `kill(pid, SIGTERM)`

## Two Cancellation Mechanisms

1. **Codex Turn Interrupt** -- Graceful API-level stop (reduces resource waste)
2. **Process Termination** -- Hard kill fallback (ensures job stops even if server unresponsive)

Both attempted in sequence for maximum reliability.

## State Updates

Three independent updates:
- Log file: Timestamped "Cancelled by user" line
- Job file: Full record with cancelledAt timestamp
- State index: Fast-lookup update via upsertJob()

## Error Scenarios

| Scenario | Error |
|----------|-------|
| No active jobs | "No active Codex jobs to cancel." |
| Multiple active | "Multiple Codex jobs are active. Pass a job id." |
| Job not found | "No active job found for {reference}." |
