# Codex Plugin for Claude Code - Security Model Analysis

## Architecture

```
Claude Code Session -> codex-companion.mjs -> Broker (Unix socket/named pipe) -> Codex app-server -> Codex API (OpenAI)
```

## Authentication

- Plugin does NOT handle API keys or credentials directly
- Authentication delegated entirely to Codex CLI (`~/.codex/`)
- Full `process.env` inherited by broker and app-server subprocesses

## Trust Boundaries

- User's machine (trusted)
- Claude Code (trusted)
- Codex Plugin (trusted, code reviewed by OpenAI)
- Broker Process (medium trust, local IPC)
- Spawned Codex subprocess (medium trust, external CLI)
- Shared /tmp directories (low trust)

## Broker Security

- Unix socket in 0o700 temp directory (owner-only)
- Windows named pipes (local-only)
- No authentication on socket connections
- Single-request serialization prevents concurrent abuse
- Interrupt bypass for cancellation

## Key Findings

### 1. Environment Variable Inheritance (Medium Risk)
Full `process.env` inherited. Sensitive vars accessible to subprocesses.

### 2. State File Permissions (Low-Medium Risk)
Files written without explicit 0o600 mode -- depends on umask.

### 3. Job Data Retention (Low Risk)
Prompts persist on disk until pruned (50 job max).

### 4. No Authentication on Broker Socket (Low Risk)
Mitigated by 0o700 directory protection and local-only access.

### 5. No Rate Limiting (Low Risk)
Only single-request serialization.

### 6. Stop-Gate Delay (Low Risk)
15-minute timeout can delay broker shutdown.

## Best Practices

1. Set API keys via `codex login` rather than environment variables
2. Enable `CLAUDE_PLUGIN_DATA` to control state directory location
3. Don't include secrets in task prompts (stored in plaintext)
4. Monitor background jobs and explicitly cancel

## Conclusion

Reasonable security model for local IPC. Main risks: environment variable inheritance, state file permissions, job data retention. Low-risk in typical single-user development environments.
