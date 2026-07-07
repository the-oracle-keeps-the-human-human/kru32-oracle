# Data Flow: Claude Code to Codex API

## Overview

Claude Code communicates with Codex through a two-mode transport system that can operate either directly (spawning a child process) or through a shared broker (using Unix sockets or named pipes). Both modes use the same JSON-RPC 2.0 protocol over JSONL (JSON Lines) format.

## Transport Modes

### 1. Direct Mode: Spawned Process
- Claude Code spawns a child process: `codex app-server`
- Communication via stdin/stdout
- Process lives for the duration of the request

### 2. Broker Mode: Shared Socket Connection
- A broker process launches as a detached background service
- Listens on a Unix socket or Windows named pipe
- Multiple Claude Code clients connect to the same broker
- Broker multiplexes requests to a single shared Codex app-server process

## JSON-RPC 2.0 Protocol

All communication uses JSON-RPC 2.0 over JSONL (one JSON object per line).

### Request Format
```json
{"id": 1, "method": "turn/start", "params": {"threadId": "thr_abc123", "input": [...]}}
```

### Response Format
```json
{"id": 1, "result": {"turn": {"id": "turn_xyz", "status": "inProgress"}}}
```

### Notification Format (Server -> Client)
```json
{"method": "turn/started", "params": {"threadId": "thr_abc123", "turn": {...}}}
```

## API Methods

| Method | Purpose | Streaming |
|--------|---------|-----------|
| `initialize` | Handshake & capability negotiation | No |
| `thread/start` | Create new work thread | No |
| `thread/resume` | Reopen existing thread | No |
| `turn/start` | Execute task/review | Yes |
| `turn/interrupt` | Cancel running turn | No |
| `review/start` | Run code review | Yes |
| `externalAgentConfig/import` | Import Claude session | Yes |
| `account/read` | Get auth status | No |

## Turn Capture State Machine

Turns are tracked asynchronously via notifications. The `TurnCaptureState` manages:
- Thread IDs (main + subagents)
- Buffered notifications until turnId is known
- File changes, command executions, reasoning summaries
- Inferred completion after 250ms idle when final answer seen

## Error Handling & Fallback

If shared broker is busy (RPC code -32001), automatically retry with direct connection. If broker endpoint not found (ENOENT/ECONNREFUSED), fall back to direct spawn.
