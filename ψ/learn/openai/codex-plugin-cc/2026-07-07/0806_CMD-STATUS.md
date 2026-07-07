# Codex Status Command

## Overview

`/codex status` displays active and recent Codex jobs, including execution status, phase, elapsed time, and monitoring capabilities.

## Two Code Paths

### Path 1: Specific Job (`/codex status <job-id>`)
- Resolution via exact ID or prefix matching
- Optional `--wait` polling (2s intervals, 4min timeout)
- Enrichment with progress preview, elapsed time, phase inference
- Full job details with action hints

### Path 2: Overview (`/codex status`)
- Session-filtered job listing
- Three buckets: running, latest finished, recent (max 8)
- Runtime status and review gate configuration

## Options

| Option | Purpose |
|--------|---------|
| `[job-id]` | View specific job details |
| `--wait` | Poll until completion (requires job-id) |
| `--timeout-ms` | Max polling duration (default 240s) |
| `--all` | Show all historical jobs |
| `--json` | JSON output |

## Data Sources

1. **Job State File** (`jobs/{id}.json`) -- Full metadata
2. **Progress Log File** (`jobs/{id}.log`) -- Timestamped events
3. **Job State Index** (`state.json`) -- Summary for fast listing
4. **Session Runtime Status** -- Broker endpoint detection

## Phase Inference

Inferred from log content when not explicitly set:
- "Starting codex" -> `starting`
- "Running tool:" -> `investigating`
- "Running command:" -> `verifying` (if test/lint) or `running`
- "Applying" -> `editing`
- "Turn completed" -> `finalizing`

## Job Status Values

| Status | Meaning |
|--------|---------|
| `queued` | Waiting in background queue |
| `running` | Execution in progress |
| `completed` | Finished successfully |
| `failed` | Execution failed |
| `cancelled` | User cancelled |
