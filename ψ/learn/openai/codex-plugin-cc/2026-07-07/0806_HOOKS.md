# Hook System and Lifecycle Events in Codex Plugin for Claude Code

## Overview

The Codex plugin implements a declarative hook system that integrates with Claude Code's session lifecycle. Hooks are event-driven entry points that execute Node.js scripts in response to specific lifecycle events.

## Hook Declaration

Hooks declared in `/plugins/codex/hooks/hooks.json`:

| Hook Event | Trigger | Timeout | Purpose |
|---|---|---|---|
| **SessionStart** | Session begins | 5s | Capture session ID and transcript path; seed environment |
| **SessionEnd** | Session ends | 5s | Clean up broker, terminate background jobs, remove state |
| **Stop** | Stop command | 900s | Optional code review gate; blocks exit if issues found |

## SessionStart Hook

Captures and persists session ID and transcript path to environment variables via `CLAUDE_ENV_FILE`:
```bash
export CODEX_COMPANION_SESSION_ID='abc123'
export CODEX_COMPANION_TRANSCRIPT_PATH='/path/to/transcript.jsonl'
```

## SessionEnd Hook

Performs cleanup:
1. Sends graceful shutdown to broker (JSON-RPC `broker/shutdown`)
2. Terminates queued/running Codex tasks for the session
3. Kills broker process tree, removes PID/log files, Unix sockets
4. Removes persistent broker session file

## Stop Hook (Review Gate)

Optional session-termination gate. When enabled (`config.stopReviewGate: true`):
1. Checks for ongoing work
2. Runs Codex review of previous Claude turn
3. Parses output for `ALLOW:` or `BLOCK:` prefix
4. Blocks session termination if issues found

## Error Handling

Hooks never fail fatally:
- Missing env files -> silent skip
- Missing state files -> create defaults
- Process teardown errors -> caught and ignored

This prevents hook failures from blocking session exit.
