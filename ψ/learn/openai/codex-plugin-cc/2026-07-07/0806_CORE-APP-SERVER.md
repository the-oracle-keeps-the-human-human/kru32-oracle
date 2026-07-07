# Codex App Server & Protocol

## Overview

The Codex Plugin communicates with Claude Code through a JSON-RPC 2.0-based protocol over JSONL transport. Supports direct mode (subprocess stdin/stdout) and broker mode (Unix socket/named pipe).

## Two-Tier Client System

### SpawnedCodexAppServerClient (Direct Mode)
- Spawns `codex app-server` subprocess
- Communicates via child process stdin/stdout
- Uses readline for line-delimited parsing
- Transport: `"direct"`

### BrokerCodexAppServerClient (Broker Mode)
- Connects to broker via Unix socket
- Parses newline-delimited JSON from socket
- Transport: `"broker"`

## Connection Strategy Priority

1. Explicit `brokerEndpoint` option
2. Environment variable `CODEX_COMPANION_APP_SERVER_ENDPOINT`
3. Saved broker session (if `reuseExistingBroker`)
4. Create new broker session
5. Fall back to direct spawning

## Initialization Handshake

Client sends `initialize` with clientInfo and capabilities, receives `userAgent` response, then sends `initialized` notification.

Default capabilities opt out of delta notifications to reduce traffic.

## Broker Multiplexing

- Single active request/stream per broker
- Busy clients receive error code -32001
- `turn/interrupt` can bypass busy check
- Thread-aware notification routing

## Error Codes

| Code | Meaning |
|------|---------|
| `-32700` | Invalid JSON |
| `-32001` | Broker busy |
| `-32000` | Generic server error |
| `-32601` | Unsupported method |
