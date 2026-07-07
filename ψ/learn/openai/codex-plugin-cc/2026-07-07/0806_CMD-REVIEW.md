# Codex Review System Architecture

## Two Review Types

### 1. Native Review (`/codex:review`)
- Built-in Codex CLI reviewer
- Read-only, no custom focus text
- Targets uncommitted changes or branch diffs
- Uses `runAppServerReview()` with `review/start` RPC

### 2. Adversarial Review (`/codex:adversarial-review`)
- Challenge-oriented, questions design choices
- Supports custom focus text
- Uses LLM turn with structured JSON output
- Adversarial framing in system prompt
- Returns verdict (approve/needs-attention) + detailed findings

## Review Target Resolution

Decision tree:
1. `--base <ref>` -> branch mode
2. `--scope working-tree` -> working tree
3. `--scope branch` -> branch against detected default
4. `--scope auto` -> dirty=working-tree, clean=branch

## Adversarial Review Prompt

Key sections:
- `<operating_stance>`: Default to skepticism
- `<attack_surface>`: Auth, data integrity, resilience, concurrency, edge cases
- `<finding_bar>`: Only material findings (no style, naming)
- `<structured_output_contract>`: JSON schema with verdict, findings, confidence
- `<grounding_rules>`: Must be defensible from repository context

## Review Output Schema

```json
{
  "verdict": "approve" | "needs-attention",
  "summary": "string",
  "findings": [{ "severity", "title", "body", "file", "line_start", "line_end", "confidence", "recommendation" }],
  "next_steps": ["string"]
}
```

## Execution Modes

- **--wait**: Foreground, synchronous
- **--background**: Background Claude task
- **Auto**: Estimates size, prompts user

## Stop-Review Gate

Optional hook: runs adversarial review of previous Claude turn before allowing session exit. Parses first line for `ALLOW:` or `BLOCK:` decision. 15-minute timeout.

## Context Collection

Size-bounded: inline diffs for small changes (<2 files, <256KB), otherwise lightweight summary with self-collection guidance.
