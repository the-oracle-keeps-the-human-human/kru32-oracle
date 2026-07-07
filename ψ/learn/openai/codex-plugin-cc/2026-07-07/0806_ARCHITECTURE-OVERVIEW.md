# Codex Plugin for Claude Code - Architecture Overview

## Project Summary

**Codex Plugin for Claude Code** is a Node.js plugin that integrates the Codex code review and AI assistance service into the Claude Code development environment. It provides a seamless interface for users to leverage Codex's capabilities—code reviews, architectural analysis, task delegation, and problem-solving—directly from within their Claude Code workflow, without requiring separate CLI invocations or switching contexts.

**Key Characteristics:**
- Version: 1.0.5
- License: Apache-2.0
- Node.js requirement: >=18.18.0
- Language: JavaScript/ES Modules with TypeScript support
- Total lines of code: ~7,400 (libraries + tests)
- Architecture: Command-driven plugin with job queue management and app-server protocol communication

---

## Directory Structure & Organization

```
codex-plugin-cc/
├── .claude-plugin/
│   └── marketplace.json           # Marketplace registration metadata
├── plugins/codex/                  # Main plugin directory
│   ├── .claude-plugin/
│   │   └── plugin.json             # Plugin configuration (name, version)
│   ├── agents/                     # Subagent definitions
│   │   └── codex-rescue.md         # Codex task delegation subagent
│   ├── commands/                   # Slash command definitions
│   │   ├── review.md               # /codex:review command
│   │   ├── adversarial-review.md   # /codex:adversarial-review command
│   │   ├── rescue.md               # /codex:rescue command
│   │   ├── transfer.md             # /codex:transfer command
│   │   ├── status.md               # /codex:status command
│   │   ├── result.md               # /codex:result command
│   │   ├── cancel.md               # /codex:cancel command
│   │   └── setup.md                # /codex:setup command
│   ├── hooks/                      # Plugin lifecycle hooks
│   │   └── hooks.json              # SessionStart, SessionEnd, Stop hooks
│   ├── prompts/                    # Prompt templates for reviews
│   │   ├── adversarial-review.txt
│   │   └── review.txt
│   ├── schemas/                    # JSON schemas for structured output
│   │   └── review-output.schema.json
│   ├── scripts/                    # Core runtime scripts
│   │   ├── codex-companion.mjs     # Main entry point (1,074 lines)
│   │   ├── app-server-broker.mjs   # App server broker
│   │   ├── session-lifecycle-hook.mjs
│   │   ├── stop-review-gate-hook.mjs
│   │   └── lib/                    # Library modules (core logic)
│   │       ├── codex.mjs           # Codex service abstraction (1,219 lines)
│   │       ├── app-server.mjs      # App server client (354 lines)
│   │       ├── git.mjs             # Git repository operations (346 lines)
│   │       ├── state.mjs           # Plugin state management (191 lines)
│   │       ├── tracked-jobs.mjs    # Job tracking & progress (204 lines)
│   │       ├── job-control.mjs     # Job lifecycle management (308 lines)
│   │       ├── render.mjs          # Output formatting (465 lines)
│   │       ├── broker-lifecycle.mjs # Broker session handling (209 lines)
│   │       ├── process.mjs         # Process management (135 lines)
│   │       ├── args.mjs            # Command-line argument parsing (128 lines)
│   │       ├── prompts.mjs         # Template loading (13 lines)
│   │       ├── fs.mjs              # File system utilities (40 lines)
│   │       ├── workspace.mjs       # Workspace detection (9 lines)
│   │       ├── broker-endpoint.mjs # Broker endpoint parsing (41 lines)
│   │       ├── claude-session-transfer.mjs # Session import (44 lines)
│   │       └── app-server-protocol.d.ts    # Type definitions
│   ├── skills/                     # Reusable skill definitions
│   │   ├── codex-cli-runtime/      # Internal CLI runtime helper
│   │   │   └── SKILL.md
│   │   ├── codex-result-handling/  # Result interpretation skill
│   │   └── gpt-5-4-prompting/      # Prompt optimization skill
│   └── CHANGELOG.md
├── scripts/
│   └── bump-version.mjs            # Version management script
├── tests/                          # Test suite
│   ├── commands.test.mjs           # Command definition tests (225 lines)
│   ├── runtime.test.mjs            # Runtime behavior tests (2,259 lines)
│   ├── fake-codex-fixture.mjs      # Mock Codex implementation (658 lines)
│   ├── git.test.mjs                # Git utilities tests (183 lines)
│   ├── state.test.mjs              # State management tests (105 lines)
│   ├── render.test.mjs             # Output formatting tests (59 lines)
│   ├── process.test.mjs            # Process utilities tests (55 lines)
│   ├── broker-endpoint.test.mjs    # Broker endpoint tests (22 lines)
│   ├── bump-version.test.mjs       # Version script tests (88 lines)
│   └── helpers.mjs                 # Shared test utilities (32 lines)
├── package.json
├── tsconfig.app-server.json
└── README.md
```

---

## Core Architecture Components

### 1. **Command Layer** (`commands/*.md`)

Commands are the primary user-facing interface. Each command is a Markdown file with YAML frontmatter that describes:
- Tool access restrictions (read-only, execution constraints)
- Argument hints
- Execution flow (foreground vs. background)
- Prompts for user confirmation

**Available Commands:**
- **`/codex:review`** - Run a native Codex review against current changes or branch
- **`/codex:adversarial-review`** - Steerable, challenge-focused review with custom focus text
- **`/codex:rescue`** - Delegate tasks (fixes, investigations, implementations) to Codex
- **`/codex:transfer`** - Export current Claude Code session to a persistent Codex thread
- **`/codex:status`** - Check job progress and view recent tasks
- **`/codex:result`** - Retrieve final output from completed jobs
- **`/codex:cancel`** - Cancel active background tasks
- **`/codex:setup`** - Verify Codex installation and authentication

**Key Flow:**
```
User invokes /codex:command
  |
Command markdown loaded
  |
AskUserQuestion (foreground vs. background)
  |
Bash() executes: node codex-companion.mjs <subcommand> <args>
  |
codex-companion parses args and delegates to handlers
  |
Result rendered and returned to user
```

### 2. **Main Runtime** (`scripts/codex-companion.mjs`)

The central orchestrator (1,074 lines) that:
- **Parses commands**: Normalizes user input, validates arguments, handles aliases (e.g., `spark` -> `gpt-5.3-codex-spark`)
- **Routes to handlers**: Each subcommand has a dedicated async handler (`handleSetup`, `handleReview`, `handleTask`, etc.)
- **Manages execution modes**: Foreground (synchronous), background (detached worker process)
- **Coordinates with services**: Git operations, Codex app-server, state persistence

**Key Functions:**
- `handleSetup()` - Checks prerequisites (Node, npm, Codex binary, authentication)
- `handleReview()` - Orchestrates code review runs
- `handleAdversarialReview()` - Steerable reviews with custom prompts
- `handleTask()` - Delegates work to Codex for fixes, investigations, implementations
- `handleTransfer()` - Exports Claude session to Codex
- `handleStatus()` - Queries job queue
- `handleCancel()` - Terminates running jobs
- `handleTaskWorker()` - Background worker subprocess (detached process)

**Design Pattern:**
- All handlers follow async/await pattern
- Output duality: JSON (for tools) and human-readable text (for terminals)
- Progress callbacks throughout long operations

---

### 3. **Codex Service Abstraction** (`scripts/lib/codex.mjs`)

The largest library module (1,219 lines) that abstracts Codex's app-server protocol. It provides:

**Core Responsibilities:**
- **App-server connectivity**: `withAppServer()`, `withDirectAppServer()` wrap connection lifecycle
- **Thread management**: `startThread()`, `resumeThread()`, `findLatestTaskThread()`
- **Turn execution**: `runAppServerTurn()`, `runAppServerReview()`, `captureTurn()`
- **Notification handling**: Receives and processes real-time updates about turns, file changes, commands
- **Session transfer**: `importExternalAgentSession()` ports Claude Code sessions to Codex
- **State capture**: `createTurnCaptureState()`, `applyTurnNotification()` track execution progress

**Key Abstraction:**
```
TurnCaptureState
├── threadId, turnId
├── finalTurn (Turn object with status)
├── fileChanges[]
├── commandExecutions[]
├── reasoningSummary[] (extended thinking)
├── messages[] (agent output)
├── onProgress (callback for real-time updates)
└── completion (Promise resolves when turn finishes)
```

**Progress Tracking:**
The `TurnCaptureState` machine follows a state graph:
- Buffers notifications until turnId is known
- Filters notifications by threadId (multi-threaded support for subagents)
- Detects final answer and schedules inferred completion
- Manages pending subagent work before marking done

**Error Handling:**
- Broker fallback: If broker is busy, retries with direct app-server connection
- Silent filtering of PATH warnings from Codex stderr
- Detailed error messages for missing dependencies

---

### 4. **App-Server Client** (`scripts/lib/app-server.mjs`)

Low-level JSON-RPC client (354 lines) for the Codex app-server protocol.

**Responsibilities:**
- Opens transport (Unix socket or broker endpoint)
- Sends JSON-RPC 2.0 requests and collects responses
- Manages notification subscriptions
- Handles connection lifecycle (initialization, shutdown)
- Detects broker overload and retries

**Transport Types:**
- **Direct**: Native Codex app-server on the local machine
- **Broker**: Shared app-server endpoint for multiple Claude sessions

**Key Methods:**
- `connect()` - Establishes connection, negotiates capabilities
- `request(method, params)` - RPC call with promise-based response
- `setNotificationHandler()` - Registers callback for server push events
- `close()` - Graceful shutdown

---

### 5. **State Management** (`scripts/lib/state.mjs`)

Persistent plugin state (191 lines) for job tracking and configuration.

**State Structure:**
```json
{
  "version": 1,
  "config": {
    "stopReviewGate": false
  },
  "jobs": [
    {
      "id": "review-1735689600000-abc123",
      "kind": "review",
      "status": "completed",
      "phase": "finalizing",
      "title": "Codex Review",
      "summary": "Review of working-tree changes",
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T12:05:00Z",
      "completedAt": "2024-01-01T12:05:00Z",
      "sessionId": "session-uuid",
      "logFile": "/path/to/job-review-xxx.log"
    }
  ]
}
```

**Storage:**
- Location: `${CLAUDE_PLUGIN_DATA}/state/<workspace-slug>-<workspace-hash>/`
- Fallback: `/tmp/codex-companion/<workspace-slug>-<workspace-hash>/` (if env var missing)
- Workspace identification: Git repo root with sha256 hash for uniqueness

**Key Functions:**
- `loadState()` / `saveState()` - Read/write state file
- `upsertJob()` - Add or update job records
- `listJobs()` - Query all jobs for workspace
- `pruneJobs()` - Keep only last 50 jobs
- `resolveStateDir()` - Compute workspace-specific state directory

---

### 6. **Job Tracking & Progress** (`scripts/lib/tracked-jobs.mjs`)

Real-time progress reporting (204 lines) for long-running operations.

**Responsibilities:**
- Create job records with metadata
- Log job events to per-job log files
- Report progress events (normalized messages, phases, threadId, turnId)
- Extract touched files from Codex output
- Collect extended thinking summaries

**Log Format:**
```
[2024-01-01T12:00:00.000Z] Starting Codex Task.
[2024-01-01T12:00:01.000Z] Turn started (turn-123).
[2024-01-01T12:00:05.000Z] Running command: npm test (exit 0)
[2024-01-01T12:00:10.000Z] File changes applied.
[2024-01-01T12:00:15.000Z] Turn completed.
```

**Progress Events:**
```javascript
{
  message: "Turn started",
  phase: "starting",         // starting, running, editing, verifying, investigating, finalizing, failed
  threadId: "thread-xyz",
  turnId: "turn-456",
  stderrMessage?: "error text",
  logTitle?: "Section title",
  logBody?: "detailed output"
}
```

---

### 7. **Job Lifecycle Management** (`scripts/lib/job-control.mjs`)

Job state transitions and status querying (308 lines).

**Job States:**
- `queued` - Background task waiting for worker process
- `running` - Task actively executing
- `completed` - Task finished (status 0)
- `failed` - Task failed (status != 0)
- `cancelled` - User cancelled

**Key Functions:**
- `buildSingleJobSnapshot()` - Current status of one job
- `buildStatusSnapshot()` - Summary of all jobs or filtered by session
- `resolveCancelableJob()` - Find active job to terminate
- `resolveResultJob()` - Fetch stored results

**Snapshot Structure:**
```javascript
{
  job: { id, status, title, summary, threadId, turnId, ... },
  stored: { /* stored job file contents */ },
  active: boolean,
  found: boolean
}
```

---

### 8. **Git Integration** (`scripts/lib/git.mjs`)

Repository operations and review target selection (346 lines).

**Capabilities:**
- Repository detection and validation
- Branch comparison (merge-base, commit range)
- Diff collection (working-tree, staged, branch diffs)
- File change detection (untracked, modified)
- Diff size measurement (bytes, file count)

**Review Targets:**
```javascript
{
  mode: "working-tree" | "branch",
  baseRef: "main" | null,
  label: "Working tree changes" | "Branch comparison",
  target: { type: "uncommittedChanges" | "baseBranch", ... }
}
```

**Key Functions:**
- `ensureGitRepository()` - Validate git setup
- `resolveReviewTarget()` - Determine review scope
- `collectReviewContext()` - Gather diffs, files, metadata
- `detectDefaultBranch()` - Find primary branch

---

### 9. **Output Rendering** (`scripts/lib/render.mjs`)

Human-readable formatting (465 lines) of results, status, and logs.

**Output Types:**
- **Review results**: Findings by severity, next steps, verdict
- **Job status**: Active/completed jobs table, progress details
- **Task output**: Final message, file list, reasoning summary
- **Setup report**: Prerequisites, authentication status, next steps
- **Cancel report**: Job cancellation confirmation

**Example Review Output:**
```
Review: Codex Review
Target: Working tree changes

VERDICT: Approved

SUMMARY: No critical issues found.

FINDINGS (2 total):
  1. [HIGH] Missing error handling
     File: src/handler.ts:42-45
     Add try-catch for API call
  
  2. [MEDIUM] Unoptimized query
     File: db/query.js:156

NEXT STEPS:
  - Add comprehensive error handling
  - Review database indexes
```

**Structured Output:**
Commands support `--json` flag for machine-readable output (JSON objects with full details).

---

### 10. **Broker Session Management** (`scripts/lib/broker-lifecycle.mjs`)

Shared app-server coordination (209 lines) for multiple Claude sessions.

**Purpose:**
Multiple Claude Code instances can share a single Codex app-server process through a broker endpoint, reducing resource consumption.

**Responsibilities:**
- Launch broker process if needed
- Load broker session from `.codex/broker.json`
- Set `CODEX_COMPANION_APP_SERVER_ENDPOINT` environment variable
- Detect broker availability and readiness

**Session File:**
```json
{
  "endpoint": "unix:/tmp/codex-broker.sock",
  "started_at": "2024-01-01T12:00:00Z",
  "pid": 12345
}
```

---

### 11. **Subagent Integration** (`agents/codex-rescue.md`)

A specialized subagent for delegating tasks to Codex (see `codex:rescue`).

**Design:**
- Thin forwarding wrapper around the task runtime
- Uses `codex-cli-runtime` skill to invoke `task` command
- Optionally uses `gpt-5-4-prompting` to refine user's request
- Does NOT perform any independent analysis or repo inspection

**Execution Flow:**
```
User: "Ask Codex to fix the failing tests"
  |
codex:rescue subagent (Sonnet model)
  |
[Optional] Refine prompt with gpt-5-4-prompting
  |
Bash: node codex-companion.mjs task --write "fix the failing tests"
  |
Codex app-server runs, outputs stdout
  |
Return output as-is (no paraphrasing)
```

---

### 12. **Skills** (`skills/*/SKILL.md`)

Reusable capability definitions:

**`codex-cli-runtime`** (Internal helper)
- Provides `task` invocation for `codex:codex-rescue`
- Encodes command routing (--model, --effort, --write, --resume-last)
- Safety rules: no repo inspection, return stdout as-is

**`codex-result-handling`** (Interpretation)
- Extracts and presents findings from review results
- Formats severity rankings and recommendations

**`gpt-5-4-prompting`** (Prompt optimization)
- Refines user's Codex request for clarity
- Optional helper used by subagent

---

## Execution Flows

### Flow A: Review Command (Foreground)

```
User: /codex:review
  |
Command markdown: review.md loaded
  |
handleReview() parses args
  |
resolveReviewTarget() determines scope (working-tree, branch, base ref)
  |
executeReviewRun() calls runAppServerReview()
  |
withAppServer() opens connection to Codex app-server
  |
startThread() creates ephemeral review thread
  |
captureTurn() receives notifications via app-server protocol
  |
Codex runs review, sends progress events
  |
Notifications update TurnCaptureState (files, commands, findings)
  |
Turn completes, state finalized
  |
renderNativeReviewResult() formats output
  |
Return to user with review findings
```

### Flow B: Task/Rescue Command (Background)

```
User: /codex:rescue fix the failing tests
  |
codex-rescue subagent created
  |
buildTaskRequest() prepares parameters (--write, model, effort)
  |
enqueueBackgroundTask() creates Job record
  |
spawn() detaches task-worker subprocess
  |
Parent returns job-id immediately to user
  |
Background worker: handleTaskWorker() loads job
  |
executeTaskRun() calls runAppServerTurn()
  |
withAppServer() connects to app-server
  |
startThread() creates persistent thread
  |
Codex executes prompt, applies changes
  |
captureTurn() tracks progress, file changes, output
  |
Progress updates written to job log file
  |
Job record updated in state.json
  |
User queries /codex:status to monitor
  |
User calls /codex:result to retrieve output
```

### Flow C: Session Transfer (Transfer)

```
User: /codex:transfer
  |
SessionStart hook provides current session path (env var)
  |
resolveClaudeSessionPath() locates .jsonl transcript
  |
importExternalAgentSession() via app-server
  |
withDirectAppServer() connects (no broker)
  |
externalAgentSessionMigration() builds migration payload
  |
requestExternalAgentSessionImport() sends to Codex
  |
Codex imports history, creates thread
  |
importedThreadIdForSource() reads ledger
  |
Return Codex session ID & resume command
  |
User can: codex resume <session-id>
```

---

## Key Design Patterns

### 1. **Promise-Based Async/Await**
All I/O operations use async/await. Long-running tasks emit progress via callbacks rather than polling.

### 2. **State Machine for Turns**
`TurnCaptureState` manages complex async operations with multiple sub-flows (file changes, subagent turns, collaboration). Resolves when all work is complete.

### 3. **Broker Fallback**
If shared broker is busy (RPC code -32001), automatically retry with direct connection.

### 4. **Progress Callbacks**
Long operations call `onProgress()` to emit structured events:
```javascript
onProgress("message")
onProgress({ message, phase, threadId, turnId, logBody })
```

### 5. **Job Persistence**
Jobs are stored in workspace-specific state directory, allowing:
- Background task durability across session restarts
- Status queries from different Claude Code instances
- Job result retrieval later

### 6. **Argument Parsing**
Custom `parseArgs()` (128 lines) handles:
- Value options (--model gpt-5.4-mini)
- Boolean flags (--wait)
- Alias maps (-m -> --model)
- Positional arguments (free text after flags)

### 7. **Markdown-Based Commands**
Commands are Markdown files, not code. This:
- Allows tools/permissions declarations in YAML frontmatter
- Encodes instruction logic as prose
- Versions alongside plugin code
- Supports `--json` output duality

---

## Integration Points

### 1. **Claude Code Plugin System**
- Commands register via `.claude-plugin/plugin.json`
- Hooks (SessionStart, SessionEnd, Stop) via `hooks.json`
- Environment variables: `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`

### 2. **Codex App Server**
- JSON-RPC 2.0 protocol
- Unix socket or broker endpoint
- Methods: `thread/start`, `thread/resume`, `turn/start`, `review/start`, `turn/interrupt`, `account/read`, etc.
- Notifications: `turn/started`, `item/started`, `item/completed`, `error`, etc.

### 3. **Codex CLI Binary**
- `codex --version` - Check availability
- `codex app-server --help` - Verify runtime support
- `codex app-server generate-ts` - Generate TypeScript types (build step)
- `codex login` - Authentication

### 4. **Git Repository**
- `git rev-parse --show-toplevel` - Repository detection
- `git diff`, `git status`, `git merge-base` - Diff collection
- Branch/commit information for review targeting

### 5. **Environment Variables**
- `CLAUDE_PLUGIN_ROOT` - Plugin directory (set by Claude Code)
- `CLAUDE_PLUGIN_DATA` - State directory (set by Claude Code)
- `CODEX_COMPANION_SESSION_ID` - Current Claude session ID (set by SessionStart hook)
- `CODEX_COMPANION_APP_SERVER_ENDPOINT` - Broker endpoint (set if broker active)
- `CODEX_HOME` - Codex config directory (user's ~/.codex)

---

## Testing Strategy

**Test Suite Size:** ~2,500 lines across 8 test files

**Test Categories:**

### 1. **Runtime Tests** (`tests/runtime.test.mjs` - 2,259 lines)
Extensive behavioral tests using `fake-codex-fixture.mjs` (658 lines) mock:
- Command parsing and subcommand routing
- Job creation and background execution
- State persistence and recovery
- Progress tracking and log writing
- Result formatting
- Error handling (missing Codex, auth failures, etc.)
- Multi-session isolation

### 2. **Command Definition Tests** (`tests/commands.test.mjs` - 225 lines)
Validates command Markdown structure:
- Review command uses AskUserQuestion and Bash
- Adversarial-review includes focus text support
- Commands have correct tool access restrictions
- Argument examples match implementation

### 3. **Git Integration Tests** (`tests/git.test.mjs` - 183 lines)
- Repository detection
- Branch comparison logic
- Diff size measurement
- Review target resolution

### 4. **State Management Tests** (`tests/state.test.mjs` - 105 lines)
- Load/save state round-trip
- Job upsert logic
- Workspace-specific isolation
- Job pruning (keep last 50)

### 5. **Utility Tests**
- `render.test.mjs` - Output formatting
- `process.test.mjs` - Process execution
- `broker-endpoint.test.mjs` - Broker endpoint parsing
- `bump-version.test.mjs` - Version script

**Key Testing Patterns:**
- Mock Codex app-server with JSON-RPC responses
- Use temp directories for state isolation
- Test both success and error paths
- Verify JSON + text output duality

---

## Dependency Graph

```
codex-companion.mjs
  ├── args.mjs           (argument parsing)
  ├── codex.mjs          (Codex service abstraction)
  │   ├── app-server.mjs (app-server client)
  │   │   └── broker-endpoint.mjs
  │   ├── broker-lifecycle.mjs (broker session mgmt)
  │   ├── fs.mjs         (file I/O)
  │   └── process.mjs    (process spawning)
  ├── git.mjs            (repository operations)
  │   └── process.mjs
  ├── state.mjs          (state persistence)
  │   └── workspace.mjs  (workspace detection)
  ├── job-control.mjs    (job lifecycle)
  │   └── state.mjs
  ├── tracked-jobs.mjs   (progress tracking)
  │   └── state.mjs
  ├── render.mjs         (output formatting)
  ├── prompts.mjs        (template loading)
  ├── claude-session-transfer.mjs
  └── workspace.mjs
```

**External Dependencies:**
- Node.js stdlib only (fs, path, process, child_process, net, readline, crypto, os, stream)
- No npm packages (zero external dependencies)

---

## Build & Deployment

**Build Process** (`prebuild` script):
```bash
mkdir -p plugins/codex/.generated/app-server-types
codex app-server generate-ts --out plugins/codex/.generated/app-server-types
tsc -p tsconfig.app-server.json
```

This generates TypeScript type definitions from the Codex app-server schema, ensuring type safety for RPC calls.

**Deployment:**
1. User adds marketplace: `/plugin marketplace add openai/codex-plugin-cc`
2. User installs plugin: `/plugin install codex@openai-codex`
3. User runs setup: `/codex:setup` (checks Codex, authenticates)
4. Plugin registers commands and hooks automatically

**Configuration:**
- User-level: `~/.codex/config.toml` (Codex settings)
- Project-level: `.codex/config.toml` (project overrides, must be trusted)
- Plugin state: `${CLAUDE_PLUGIN_DATA}/state/<workspace-hash>/`

---

## Security & Permissions

**Command Tool Restrictions:**
Each command declares allowed tools in frontmatter, e.g.:
```yaml
allowed-tools: Read, Glob, Grep, Bash(node:*), Bash(git:*), AskUserQuestion
```

This enforces sandboxing:
- Review commands: read-only (no file writes)
- Rescue subagent: write-capable (--write flag)
- All commands: no arbitrary bash execution

**Codex Sandbox:**
- Native reviews: `sandbox: "read-only"`
- Tasks: `sandbox: "read-only"` or `"workspace-write"` (--write flag)
- Prevents unintended side effects

**Session Isolation:**
- Jobs tagged with `sessionId` (Claude session UUID)
- `/codex:status` filters to current session
- Background workers inherit session context

---

## Error Handling & Resilience

### Error Categories:

1. **Prerequisites Missing**
   - Codex binary not installed -> suggest `npm install -g @openai/codex`
   - Git not available -> "Must run inside Git repository"
   - Authentication missing -> suggest `!codex login`

2. **Codex Failures**
   - Review timeout -> Suggest `--background`
   - RPC errors -> Broker fallback to direct connection
   - Turn interrupted -> Clean cancellation, job marked "cancelled"

3. **State Issues**
   - Corrupted state.json -> Reload with defaults
   - Missing job file -> Reconstruct from in-memory state
   - Stale session ID -> Filter to current session

4. **Git Issues**
   - Not in repo -> Clear error message with remediation
   - No commits -> Allow review anyway
   - Merge base resolution -> Fall back to HEAD

### Retry Logic:
- Broker RPC code -32001 (busy) -> Retry with direct connection
- Network timeouts -> Rely on Codex app-server timeout handling
- No automatic retry loops (respects user's --wait / --background choice)

---

## Performance Considerations

### Optimization Areas:

1. **Diff Collection**
   - Measures output bytes before including in review
   - Limits inline diffs to 2 files / 256KB by default
   - Warns user for large changes

2. **Job Storage**
   - Prunes to last 50 jobs per workspace
   - Removes orphaned log files
   - Lazy-loads stored job details

3. **Progress Reporting**
   - Throttles updates to avoid log spam
   - Buffers notifications until turnId known
   - Inferred completion after 250ms idle

4. **Broker Caching**
   - Loads broker session from disk (no re-spawn)
   - Shares single app-server across sessions
   - Transparent fallback if broker unavailable

---

## Future Extension Points

1. **New Commands:** Add `.md` file in `commands/` with handler in `codex-companion.mjs`
2. **New Skills:** Define `SKILL.md` in `skills/*/`, use in commands
3. **New Hooks:** Add hook handler to `hooks.json` and implement script
4. **Protocol Upgrades:** Update `app-server-protocol.d.ts` when Codex API changes
5. **Output Formats:** Extend `render.mjs` for custom result presentation

---

## Conclusion

The Codex Plugin for Claude Code is a well-architected, zero-dependency integration that:
- **Abstracts complexity** behind a clean command interface
- **Manages durability** with workspace-scoped persistent job state
- **Handles async operations** via promises, progress callbacks, and state machines
- **Isolates work** in background processes with proper lifecycle management
- **Provides resilience** through broker fallback and error recovery
- **Stays lightweight** with pure Node.js stdlib (no npm dependencies)
- **Maintains flexibility** via markdown-based commands and JSON-RPC protocol

The codebase demonstrates strong separation of concerns, comprehensive testing, and careful error handling--making it a reliable bridge between Claude Code and the Codex AI service.
