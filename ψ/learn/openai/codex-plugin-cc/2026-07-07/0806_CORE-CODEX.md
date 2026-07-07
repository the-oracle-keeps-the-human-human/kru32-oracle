# CORE-CODEX: Codex API Client Library

## Overview

The Codex API client (`codex.mjs`, 1,219 lines) provides a high-level interface to OpenAI's Codex App Server. It manages thread lifecycle, turn execution, code reviews, external agent integration, and authentication.

## Transport Mechanisms

Two-tier connection strategy:
1. **Direct Spawn** (`SpawnedCodexAppServerClient`): Spawns `codex app-server` subprocess
2. **Broker Socket** (`BrokerCodexAppServerClient`): Connects to shared broker via Unix socket

## API Methods

### Thread Management
- `thread/start` -- Create new thread (ephemeral or persistent)
- `thread/resume` -- Continue existing thread
- `thread/list` -- Query threads
- `thread/name/set` -- Rename thread

### Turn Management
- `turn/start` -- Execute a turn with prompt, model, effort
- `turn/interrupt` -- Cancel running turn

### Code Review
- `review/start` -- Initiate code review (inline or detached delivery)

### External Agent
- `externalAgentConfig/import` -- Import Claude session (2-minute timeout)

### Account & Config
- `account/read` -- Authentication status
- `config/read` -- Provider configuration

## Turn Capture State Machine

`captureTurn()` intercepts notifications, buffers until turnId known, tracks file changes, command executions, reasoning summaries, and manages subagent collaborations. Inferred completion after 250ms idle when final answer seen and no pending work.

## High-Level Entry Points

- `runAppServerTurn()` -- Execute task (start/resume thread, capture turn)
- `runAppServerReview()` -- Code review (read-only sandbox, ephemeral thread)
- `importExternalAgentSession()` -- Transfer Claude session
- `interruptAppServerTurn()` -- Cancel running task
- `findLatestTaskThread()` -- Retrieve previous task

## Error Handling

- Broker busy (-32001) -> retry with direct connection
- ENOENT/ECONNREFUSED -> fall back to direct spawn
- Protocol errors wrapped with `rpcCode` for categorization
