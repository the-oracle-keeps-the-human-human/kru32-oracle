# Claude Code Plugin System

## Overview

Claude Code's plugin system allows third parties to extend functionality through a standardized, declarative format. The Codex plugin (codex-plugin-cc) demonstrates the complete plugin lifecycle: discovery, installation, registration, and execution.

## Plugin Discovery and Installation

### Marketplace Registration

Plugins are registered in a marketplace through a root-level `.claude-plugin/marketplace.json` file:

```json
{
  "name": "openai-codex",
  "owner": {
    "name": "OpenAI"
  },
  "metadata": {
    "description": "Codex plugins to use in Claude Code for delegation and code review.",
    "version": "1.0.5"
  },
  "plugins": [
    {
      "name": "codex",
      "description": "Use Codex from Claude Code to review code or delegate tasks.",
      "version": "1.0.5",
      "author": {
        "name": "OpenAI"
      },
      "source": "./plugins/codex"
    }
  ]
}
```

**Key Elements:**
- `name`: Marketplace identifier (e.g., `openai-codex`)
- `owner`: Organization details
- `metadata.version`: Marketplace version
- `plugins[]`: Array of plugin definitions
  - `source`: Relative path to the plugin directory

### Installation Flow

Users install plugins through CLI commands:

```bash
# Add the marketplace as a source
/plugin marketplace add openai/codex-plugin-cc

# Install the plugin from the marketplace
/plugin install codex@openai-codex

# Reload plugins to activate
/reload-plugins
```

## Plugin Manifest Format

Each plugin has a `.claude-plugin/plugin.json` file at its root:

```json
{
  "name": "codex",
  "version": "1.0.5",
  "description": "Use Codex from Claude Code to review code or delegate tasks.",
  "author": {
    "name": "OpenAI"
  }
}
```

## Command Registration and Format

Commands are registered as individual Markdown files in the `commands/` directory. Each command file has a YAML front matter header followed by implementation instructions.

### Command File Structure

```markdown
---
description: Run a Codex code review against local git state
argument-hint: '[--wait|--background] [--base <ref>] [--scope auto|working-tree|branch]'
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(node:*), Bash(git:*), AskUserQuestion
---

Run a Codex review through the shared built-in reviewer.
...
```

### YAML Front Matter Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Short description shown in `/help` |
| `argument-hint` | string | Example arguments shown to users |
| `disable-model-invocation` | boolean | If true, prevent Claude from invoking itself recursively |
| `allowed-tools` | string | Comma-separated list of allowed tools; supports wildcards like `Bash(node:*)` |

## Agent Registration and Format

Agents are standalone subagents that can be invoked from a main Claude Code session. They are registered as Markdown files in the `agents/` directory.

### Agent YAML Front Matter

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Agent identifier (used in `/agents` list) |
| `description` | string | When to use this agent |
| `model` | string | LLM model for this agent (e.g., `sonnet`, `opus`) |
| `tools` | string | Comma-separated list of allowed tools |
| `skills` | array | List of skill names available to this agent |

## Skill Registration and Format

Skills are reusable knowledge or guidance documents packaged in the `skills/` directory. Each skill is a subdirectory containing a `SKILL.md` file and optional reference materials.

### Skill YAML Front Matter

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Skill identifier |
| `description` | string | What this skill teaches |
| `user-invocable` | boolean | If false, skill is internal-only (not shown in `/skills`) |

## Hook System

Hooks allow plugins to react to lifecycle events in Claude Code. Hooks are registered in a `hooks/hooks.json` file at the plugin root.

### Hook Event Types

| Event | When Triggered | Use Case |
|-------|---|----------|
| `SessionStart` | Claude Code session begins | Initialize state, set up environment |
| `SessionEnd` | Claude Code session ends | Clean up background processes, persist state |
| `Stop` | User attempts to stop Claude | Optional gate (e.g., run a review before allowing stop) |

### Hook Execution

Each hook entry specifies:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Hook type; currently only `"command"` is supported |
| `command` | string | Shell command to execute; `${CLAUDE_PLUGIN_ROOT}` is substituted |
| `timeout` | number | Maximum execution time in seconds |

## Plugin Lifecycle

1. **Discovery Phase** - Marketplace registrations
2. **Installation Phase** - Clone/link, validate manifest, index resources
3. **Activation Phase** - Register commands, agents, skills, hooks
4. **Execution Phase** - Process prompts, execute tools
5. **Cleanup Phase** - SessionEnd hooks, state persistence

## Security and Constraints

### Tool Allowlisting

Commands explicitly list allowed tools in YAML:
```yaml
allowed-tools: Read, Glob, Grep, Bash(node:*), Bash(git:*), AskUserQuestion
```

### Timeout Enforcement

Hooks have explicit timeouts to prevent hanging:
```json
{ "timeout": 5 }      // SessionStart: 5 seconds
{ "timeout": 900 }    // Stop gate: 15 minutes
```
