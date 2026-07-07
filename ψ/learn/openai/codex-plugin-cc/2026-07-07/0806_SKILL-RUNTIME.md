# Codex CLI Runtime Skill

**Skill Name:** `codex-cli-runtime`
**Invocable:** No (internal helper)

## Overview

Internal helper contract defining how Claude Code invokes the Codex CLI runtime. Used only by `codex:codex-rescue` subagent.

## Primary Interface

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/codex-companion.mjs" task "<raw arguments>"
```

## Forwarding Rules

| User Input | Task Call |
|---|---|
| `--background` | `task --background ...` |
| `--resume` | `task --resume-last ...` |
| `--fresh` | `task ...` (new thread) |
| `--effort high` | `task --effort high ...` |
| `--model spark` | `task --model gpt-5.3-codex-spark ...` |

## Defaults

- Leave `--effort` unset unless explicitly requested
- Leave model unset by default
- Default to write-capable (`--write`) unless read-only requested
- Map `spark` to `gpt-5.3-codex-spark`

## Forbidden Commands

Only `task` allowed. Cannot invoke: setup, review, adversarial-review, status, result, cancel.

## Key Behaviors

- Rescue agent is a forwarder, not an orchestrator
- No repo inspection, file reading, or independent analysis
- Return stdout exactly as-is
- May use `gpt-5-4-prompting` skill only to tighten prompt text
- Progress tracked via `TurnCaptureState` state machine
- Supports foreground and background execution
- Resume via `--resume-last`, fresh via default

## Execution Engine

`runAppServerTurn()` manages:
- Thread start/resume via app-server RPC
- Turn capture with notification streaming
- File change and command execution tracking
- Subagent collaboration management
- Inferred completion after 250ms idle
