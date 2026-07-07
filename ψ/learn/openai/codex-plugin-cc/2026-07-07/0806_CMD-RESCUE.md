# Codex Rescue: Command & Agent Architecture

## Overview

`/codex:rescue` bridges Claude Code and Codex, allowing users to delegate debugging, investigation, or implementation work to Codex.

## Two-Layer Architecture

### Layer 1: `/codex:rescue` Command
- Thin forwarder with resume detection
- Parses flags: `--background`, `--wait`, `--resume`, `--fresh`, `--model`, `--effort`
- Checks for resumable threads via `task-resume-candidate`
- Delegates to `codex:codex-rescue` subagent via Agent tool

### Layer 2: `codex:codex-rescue` Subagent
- Thin forwarding wrapper (model: sonnet)
- Single Bash call: `node codex-companion.mjs task [OPTIONS] [PROMPT]`
- Returns stdout verbatim -- no paraphrasing
- May use `gpt-5-4-prompting` skill to tighten prompt

## Execution Options

| Flag | Purpose |
|------|---------|
| `--background` | Detached execution, returns job ID |
| `--wait` | Foreground, explicit |
| `--resume-last` | Continue previous task thread |
| `--fresh` | Start new thread |
| `--model <model\|spark>` | Choose LLM |
| `--effort <level>` | Reasoning effort |
| `--write` | Enable workspace-write sandbox (default) |

## Resume vs Fresh

- `--resume-last`: Finds latest resumable task in current session
- `--fresh`: Starts new Codex thread
- Default continuation prompt: "Continue from the current thread state..."

## Model Aliases

`spark` -> `gpt-5.3-codex-spark`

## Background Execution

Spawns detached child process (`task-worker` subcommand), returns job ID immediately. User polls with `/codex:status` and retrieves with `/codex:result`.

## Constraints

- Subagent is thin forwarder only -- no independent work
- No file reading, git operations, or debugging
- Must NOT call `Skill(codex-rescue)` (would loop)
- Returns Codex output verbatim
