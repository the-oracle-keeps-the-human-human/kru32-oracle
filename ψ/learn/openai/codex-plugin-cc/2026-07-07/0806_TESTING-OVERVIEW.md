# Testing Overview: codex-plugin-cc

## Framework

Node.js built-in test framework (`node --test`) with `node:assert/strict`. ES modules (.mjs). Run via `npm test`.

## Test Infrastructure

### helpers.mjs
- `makeTempDir()` -- Isolated temp directories
- `writeExecutable()` -- Executable scripts
- `run()` -- Command execution via spawnSync
- `initGitRepo()` -- Git repos with test config

### fake-codex-fixture.mjs (658 lines)
Comprehensive mock Codex CLI with 16 behavior modes:
- `review-ok`, `logged-out`, `provider-no-auth`, `api-key-account-only`
- `adversarial-clean`, `with-reasoning`, `with-subagent`
- `slow-task`, `interruptible-slow-task`
- Full JSON-RPC protocol simulation

## Test Files (10 files, ~2,500 lines)

### runtime.test.mjs (2,259 lines) -- Integration tests
- Setup & auth (11 tests)
- Review operations (10 tests)
- Adversarial review (5 tests)
- Task execution (20+ tests)
- Session transfer (4 tests)
- Job management (15+ tests)
- Lifecycle hooks (2 tests)

### commands.test.mjs (226 lines) -- Structure validation
### git.test.mjs (184 lines) -- Git workflow utilities
### state.test.mjs (106 lines) -- State persistence
### render.test.mjs (60 lines) -- Output formatting
### process.test.mjs (56 lines) -- Process termination
### broker-endpoint.test.mjs (23 lines) -- IPC abstraction
### bump-version.test.mjs (89 lines) -- Version sync

## Well-Tested Areas

- Authentication & authorization
- Review operations (native + adversarial)
- Task execution (resume, background, subagents)
- Job lifecycle (create, track, cancel)
- State management (isolation, pruning)
- Cross-platform compatibility

## Coverage Gaps

- Error recovery mid-operation
- Performance/stress testing
- Broker protocol edge cases
- Git edge cases (detached HEAD, submodules)
- Security (injection, path traversal)

## Key Testing Insights

1. Real integration testing with fake Codex
2. Stateful behavior validation
3. Cross-platform awareness (Windows/Unix)
4. Mock sophistication (650+ lines, full JSON-RPC)
5. User journey focus over isolated unit tests
