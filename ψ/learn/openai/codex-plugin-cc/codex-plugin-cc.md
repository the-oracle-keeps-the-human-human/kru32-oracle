# openai/codex-plugin-cc -- Exploration Index

**Repository**: [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc)
**Explored**: 2026-07-07 08:06
**Agents**: 29 parallel exploration agents
**Project**: Codex Plugin for Claude Code -- integrates OpenAI Codex into Claude Code for code reviews, task delegation, and session transfer

---

## Architecture

| File | Agent | Summary |
|------|-------|---------|
| [ARCHITECTURE-OVERVIEW](2026-07-07/0806_ARCHITECTURE-OVERVIEW.md) | arch:overview | Full project architecture: directory structure, 12 core components, execution flows, design patterns, integration points |
| [PLUGIN-SYSTEM](2026-07-07/0806_PLUGIN-SYSTEM.md) | arch:plugin-system | Claude Code plugin system: marketplace, manifests, commands, agents, skills, hooks, lifecycle |
| [DATA-FLOW](2026-07-07/0806_DATA-FLOW.md) | arch:data-flow | Data flow from Claude Code to Codex API: dual transport (direct/broker), JSON-RPC 2.0 over JSONL, turn capture state machine |
| [HOOKS](2026-07-07/0806_HOOKS.md) | arch:hooks | Hook system: SessionStart, SessionEnd, Stop events; environment injection; review gate; graceful degradation |
| [DEPENDENCIES](2026-07-07/0806_DEPENDENCIES.md) | arch:dependencies | Zero npm runtime dependencies; Node.js stdlib only; TypeScript type-check-only build; platform-specific handling |
| [CI-CD](2026-07-07/0806_CI-CD.md) | arch:ci-cd | PR validation CI; version management across 5 locations in 4 files; manual release process |

## Core Libraries

| File | Agent | Summary |
|------|-------|---------|
| [CORE-CODEX](2026-07-07/0806_CORE-CODEX.md) | core:codex-mjs | Codex API client (1,219 LOC): thread/turn management, review execution, session transfer, auth, error handling |
| [CORE-BROKER](2026-07-07/0806_CORE-BROKER.md) | core:broker | App-server broker: JSONL-RPC multiplexer, exclusive request ownership, streaming state, interrupt privilege |
| [CORE-APP-SERVER](2026-07-07/0806_CORE-APP-SERVER.md) | core:app-server | App server protocol: two-tier client (direct/broker), JSON-RPC 2.0, initialization handshake, error codes |
| [CORE-STATE](2026-07-07/0806_CORE-STATE.md) | core:state | State management: per-workspace isolation, job lifecycle, config, pruning (max 50), session scoping |
| [CORE-PROCESS](2026-07-07/0806_CORE-PROCESS.md) | core:process | Process management: runCommand/spawnSync, cross-platform termination, job tracking, progress events |
| [CORE-GIT](2026-07-07/0806_CORE-GIT.md) | core:git | Git integration: repo validation, branch detection, review target resolution, size-bounded diff collection |
| [CORE-RENDER](2026-07-07/0806_CORE-RENDER.md) | core:render | Output rendering: 8 render functions, severity sorting, defensive normalization, markdown safety |
| [CORE-WORKSPACE](2026-07-07/0806_CORE-WORKSPACE.md) | core:workspace | Workspace management: root resolution, state directory isolation, file utilities, binary detection |

## Commands

| File | Agent | Summary |
|------|-------|---------|
| [CMD-SETUP](2026-07-07/0806_CMD-SETUP.md) | cmd:setup | Setup command: 6 health checks, installation flow, review gate configuration, auth delegation |
| [CMD-STATUS](2026-07-07/0806_CMD-STATUS.md) | cmd:status | Status command: job listing, phase inference, time calculations, session scoping, polling |
| [CMD-RESULT](2026-07-07/0806_CMD-RESULT.md) | cmd:result | Result retrieval: cascade rendering (4 sources), session resume info, completion gating |
| [CMD-REVIEW](2026-07-07/0806_CMD-REVIEW.md) | cmd:review | Review system: native + adversarial modes, attack surface prompts, structured JSON output, stop gate |
| [CMD-CANCEL](2026-07-07/0806_CMD-CANCEL.md) | cmd:cancel | Cancellation: turn interrupt + process termination, session-scoped resolution, state cleanup |
| [CMD-TRANSFER](2026-07-07/0806_CMD-TRANSFER.md) | cmd:transfer | Session transfer: JSONL transcript to Codex thread, SHA256 dedup, auto transcript path from hook |
| [CMD-RESCUE](2026-07-07/0806_CMD-RESCUE.md) | cmd:rescue | Rescue command: two-layer architecture, thin forwarding subagent, resume semantics, model aliases |

## Skills

| File | Agent | Summary |
|------|-------|---------|
| [SKILL-RUNTIME](2026-07-07/0806_SKILL-RUNTIME.md) | skill:runtime | CLI runtime contract: forwarding rules, flag handling, forbidden commands, execution engine |
| [SKILL-RESULT-HANDLING](2026-07-07/0806_SKILL-RESULT-HANDLING.md) | skill:result-handling | Result presentation: preserve structure, no auto-fixes, confidence transparency, failure reporting |
| [SKILL-PROMPTING](2026-07-07/0806_SKILL-PROMPTING.md) | skill:prompting | GPT-5.4 prompting: XML block recipes, anti-patterns, verification loops, grounding rules |
| [SKILL-COMPANION](2026-07-07/0806_SKILL-COMPANION.md) | skill:companion | Companion script architecture: 8 subcommands, job lifecycle, prompt templates, design patterns |

## Testing & Integration

| File | Agent | Summary |
|------|-------|---------|
| [TESTING-OVERVIEW](2026-07-07/0806_TESTING-OVERVIEW.md) | test:overview | Test suite: 10 files, ~2,500 LOC, 16-behavior mock Codex, coverage analysis |
| [INTEGRATION-PATTERNS](2026-07-07/0806_INTEGRATION-PATTERNS.md) | test:integration | 9 integration patterns: broker, state, process, job tracking, app-server, execution modes, sessions |

## Meta Analysis

| File | Agent | Summary |
|------|-------|---------|
| [COMPARISON-MAW](2026-07-07/0806_COMPARISON-MAW.md) | meta:comparison | Comparison with maw-codex-team-kit: 8 adoptable patterns (broker, transfer, rescue, jobs, review gate) |
| [SECURITY-MODEL](2026-07-07/0806_SECURITY-MODEL.md) | meta:security | Security analysis: trust boundaries, env var inheritance, state file permissions, broker auth, job retention |

---

## Key Takeaways

- **Zero dependencies**: Pure Node.js stdlib, no npm packages
- **~7,400 LOC** across libraries + tests
- **Plugin system**: Markdown-based commands with YAML frontmatter for tool restrictions
- **Dual transport**: Direct subprocess or shared broker via Unix sockets/named pipes
- **JSON-RPC 2.0**: Over JSONL for all Codex communication
- **Job persistence**: Workspace-scoped, session-isolated, auto-pruning
- **Adversarial review**: Structured output with attack surfaces, confidence scores, grounding rules
- **Session transfer**: Claude JSONL -> Codex thread with SHA256 deduplication
- **Comprehensive testing**: 16-behavior mock Codex, real integration tests
