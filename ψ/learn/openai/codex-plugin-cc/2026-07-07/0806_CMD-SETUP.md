# Codex Setup Command

## Overview

`/codex:setup` verifies Codex CLI integration with Claude Code. Performs health checks, optionally installs Codex, and configures workspace settings.

## Health Checks

1. **Node.js** -- `binaryAvailable("node", ["--version"])`
2. **npm** -- `binaryAvailable("npm", ["--version"])`
3. **Codex CLI** -- Two-level: `codex --version` + `codex app-server --help`
4. **Authentication** -- Connects to app-server, calls `account/read` and `config/read`
5. **Session Runtime** -- Checks broker endpoint availability
6. **Review Gate** -- Reads workspace config for `stopReviewGate`

## Authentication Methods

- **ChatGPT Login** (`!codex login`) -- Verified, email available
- **Device Auth** (`!codex login --device-auth`) -- For blocked browser environments
- **API Key** (`!codex login --with-api-key`) -- Unverified

Plugin does NOT handle credentials directly -- delegates to Codex CLI.

## Workspace Configuration

State stored at `<stateDir>/state.json`:
```json
{ "version": 1, "config": { "stopReviewGate": false }, "jobs": [] }
```

Toggle review gate:
```bash
/codex:setup --enable-review-gate
/codex:setup --disable-review-gate
```

## Installation Flow

If Codex unavailable and npm available:
1. Prompt user to install
2. If confirmed: `npm install -g @openai/codex`
3. Re-run setup to verify

## Output

Text format with status, checks, actions taken, and next steps. JSON format with `--json` flag.
