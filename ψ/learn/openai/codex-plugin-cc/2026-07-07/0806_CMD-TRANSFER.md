# Session Transfer: Claude Code to Codex

## Overview

Converts a Claude Code session transcript (JSONL format) into a persistent, resumable Codex thread with full conversation history.

## What It Does

- Preserves entire Claude conversation as visible turns in Codex thread
- Creates persistent thread resumable with `codex resume <thread-id>`
- Full tool availability in Codex without losing context

## Flow

1. **Session Identification**: Locate JSONL transcript (auto from hook or `--source`)
2. **Validation**: Must be .jsonl, under `~/.claude/projects/`
3. **Migration Payload**: Construct `externalAgentConfig/import` RPC payload
4. **Import**: Send to Codex app-server, wait for completion (2-min timeout)
5. **Thread ID**: Retrieve from Codex's `external_agent_session_imports.json` ledger
6. **Deduplication**: SHA256 content hash prevents duplicate imports

## SessionStart Hook Integration

Hook automatically provides transcript path:
```bash
export CODEX_COMPANION_TRANSCRIPT_PATH='/path/to/session.jsonl'
```

## Error Handling

- Older Codex (RPC -32601): "Update with `npm install -g @openai/codex@latest`"
- File outside `~/.claude/projects/`: Rejected
- Non-JSONL file: Rejected
- Import timeout (2 min): Error message

## Output

```
Transferred the Claude session into a Codex thread with visible turn history.
Codex session ID: thread-xyz789
Resume in Codex: codex resume thread-xyz789
```

## Security

- Reads only the JSONL transcript file
- No other configuration transferred (no plugins, MCP servers, hooks)
- Files must be in `~/.claude/projects` to be accepted
