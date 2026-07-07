# Codex Companion Broker: Architecture & Protocol

## Overview

The Codex Companion Broker is a single-process, socket-based RPC server that multiplexes access to a shared Codex App Server from multiple clients. It acts as a connection middleware layer over platform-native IPC channels.

## Endpoint Format

- **Unix/macOS**: `unix:/tmp/cxc-{random}/broker.sock`
- **Windows**: `pipe:\\\\.\\pipe\\cxc-{random}-codex-app-server`

## Protocol

Newline-delimited JSON-RPC 2.0. One JSON object per line.

## Request Serialization (Concurrency Control)

State variables:
- `activeRequestSocket` -- Currently executing request
- `activeStreamSocket` -- Currently streaming results
- `activeStreamThreadIds` -- Thread IDs for active stream

Rules:
- Only one socket can have an active request/stream at a time
- Others receive busy error (code `-32001`)
- Exception: `turn/interrupt` can interrupt an active stream from a different socket

## Streaming Methods

Three methods treated as streaming: `turn/start`, `review/start`, `thread/compact/start`

## Lifecycle

1. Spawned as detached child process (`child.unref()`)
2. Binds to Unix socket or Windows named pipe
3. Connects to Codex app-server in direct mode
4. Routes notifications to active stream socket
5. Graceful shutdown via `broker/shutdown` RPC method
6. Cleanup: socket file, PID file, session directory

## Session Persistence

Broker session saved to disk (`broker.json`) enabling reuse across CLI invocations.

## Key Design Patterns

- **Platform Abstraction**: Unix sockets vs Windows named pipes
- **Exclusive Request Ownership**: One socket at a time
- **Interrupt Privilege**: `turn/interrupt` crosses socket boundaries
- **Detached Process Lifecycle**: Survives parent exit
