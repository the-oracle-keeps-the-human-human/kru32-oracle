# Codex Companion Script: Architecture & Design

**Location**: `plugins/codex/scripts/codex-companion.mjs` (1074 lines)

## Architecture Overview

### 8 Major Subcommands

- `setup` -- Verify installation & auth; configure review gate
- `review` -- Standard Codex code review
- `adversarial-review` -- Pressure-test implementation choices
- `task` -- Delegate arbitrary work to Codex
- `transfer` -- Import Claude Code session
- `status` -- Show running/recent jobs
- `result` -- Retrieve final output
- `cancel` -- Terminate active background job
- `task-worker` -- Internal background executor

## Job Lifecycle

States: queued -> running -> completed/failed/cancelled

Job records stored as JSON with full metadata including session ID, thread/turn IDs, PID, log file, result payload, and rendered output.

## Execution Modes

### Foreground
- Create job, execute with progress callbacks
- Stream to stderr + log file
- Block until complete, set exit code

### Background
- Create job in "queued" state
- Spawn detached child process (`task-worker`)
- Return immediately with job ID
- Worker reads request from stored job file

## Prompt Templates

### Adversarial Review (`adversarial-review.md`)
- Skeptical stance, attack surface prioritization
- Structured JSON output with confidence scores
- Grounding rules preventing speculation
- Template variables: TARGET_LABEL, USER_FOCUS, REVIEW_INPUT

### Stop-Gate Review (`stop-review-gate.md`)
- Binary ALLOW/BLOCK decision
- Only reviews if previous turn made code changes
- Compact first-line output contract

## Design Patterns

1. **Request -> Metadata -> Job -> Execution -> Rendering** pipeline
2. **Dual-Mode Execution** with identical logic
3. **Template-Driven Prompts** with variable interpolation
4. **Progress Callbacks** flowing to stderr + log + state
5. **Session Isolation** via `CODEX_COMPANION_SESSION_ID`

## Key Strengths

- Clean separation of concerns
- Flexible execution modes
- Persistence across process termination
- Session isolation in shared repos
- Structured prompts with machine-parseable reviews
