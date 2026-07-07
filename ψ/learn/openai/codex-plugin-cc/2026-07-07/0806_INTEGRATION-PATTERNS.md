# Integration Patterns: Claude Code & Codex Plugin

## Overview

Nine integration patterns analyzed for how Claude Code and Codex plugin pieces fit together.

## 1. Broker-Endpoint Pattern
Platform-aware IPC (Unix sockets vs Windows named pipes). Broker session lifecycle: create, verify readiness, persist, teardown. Workspace-scoped for concurrent session sharing.

## 2. State Management Pattern
Workspace-scoped persistence with hash-based directory isolation. Two-tier location (CLAUDE_PLUGIN_DATA or temp). Automatic pruning at 50 jobs with artifact cleanup.

## 3. Process Management Pattern
Cross-platform termination: Windows taskkill /T /F -> process.kill() fallback. Unix kill(-pid, SIGTERM) -> kill(pid, SIGTERM) fallback. Structured return with attempted/delivered/method.

## 4. Job Tracking Pattern
Lifecycle states: queued -> running -> completed/failed/cancelled. Progress event normalization. Trimodal output (stderr, logfile, callback). Selective state mutation (only patches changed fields).

## 5. App-Server Communication Pattern
Turn capture state machine. Notification-driven completion tracking. Subagent collaboration tracking with pending/active sets. Inferred completion after 250ms idle. Reasoning extraction from nested object structures.

## 6. Foreground & Background Command Pattern
Foreground: create progress reporter, run synchronously, output result. Background: spawn detached worker, store request in job file, return job ID. Worker recovers context from stored state.

## 7. Session Management Integration
Session context propagation via CODEX_COMPANION_SESSION_ID. SessionStart hook appends to CLAUDE_ENV_FILE. Session-scoped filtering for job queries. Cross-session operations possible with explicit job ID.

## 8. Command Routing & Execution Pattern
Single companion script dispatches to specialized handlers. Common flow: parse -> validate -> create job -> execute -> output. Resume logic finds latest resumable task in current session.

## 9. Turn Interrupt Pattern for Cancellation
Two-stage: app-server turn interrupt (graceful) then process termination (hard kill). Even if interrupt fails, process termination proceeds. State updated to cancelled regardless.

## Data Flow Boundaries

1. CLI Input -> Argument parsing -> Validation -> Command handlers
2. Job Creation -> Progress tracking -> State mutations -> Output
3. App-Server Communication -> Turn capture -> Result extraction -> Rendering
4. Cross-Session Context -> Environment variables -> Job metadata -> Filtering
