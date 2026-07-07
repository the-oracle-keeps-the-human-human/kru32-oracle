# Codex Plugin for Claude Code vs maw-codex-team-kit

## Executive Summary

The OpenAI Codex plugin demonstrates sophisticated patterns for agent orchestration, session management, and adversarial review. Key innovations:

1. **Broker-based connection multiplexing** for shared app server access
2. **Persistent session transfer** with transcript conversion
3. **Rescue agents** as thin forwarding wrappers with resume semantics
4. **Adversarial review gates** enforced via Stop hooks
5. **Structured job lifecycle** with background execution and cancellation

## Key Patterns for maw Adoption

### 1. Broker Architecture
Persistent broker multiplexing clients to single app server. Reduces process overhead, enables resource sharing, allows safe interruption during streaming.

### 2. Session Transfer
`/maw:transfer` command converting Claude session to Codex thread. Preserves conversation history, allows resumption in native Codex UI.

### 3. Thin Forwarding Agents
Subagents that only forward requests, no independent reasoning. Easier to test, clear delegation boundary.

### 4. Structured Job Lifecycle
Durable job queue with status polling, progress tracking, cancellation. Jobs survive session exit, clear history.

### 5. Review Gates via Stop Hook
Stop hook running adversarial review before session end. Catches regressions, forces fixes.

### 6. Adversarial Review Prompts
Domain-specific prompts with attack surfaces, confidence scoring, finding bar, grounding rules.

### 7. Hook-Based Lifecycle
SessionStart/SessionEnd/Stop hooks for transparent session integration, automatic environment injection, clean teardown.

### 8. Resume Semantics
Track latest task thread per session, offer resume on next rescue. `--resume-last` vs `--fresh` branching.

## Architecture Highlights

- Single companion script (~1100 LOC) as entry point
- Zero npm runtime dependencies
- JSONL-RPC protocol for Codex communication
- Platform-aware IPC (Unix sockets + Windows named pipes)
- Session-scoped job isolation
- Detached background workers with PID tracking
- Comprehensive test suite with 16-behavior mock Codex
