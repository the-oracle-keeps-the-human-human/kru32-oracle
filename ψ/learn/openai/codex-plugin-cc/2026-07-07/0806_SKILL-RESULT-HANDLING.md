# Codex Result Handling Skill

## Overview

Internal guidance framework for presenting Codex output to users. Core principle: **preserve the helper's verdict and structure; do not reinterpret, summarize, or auto-apply findings.**

## Core Principles

1. **Preserve Structure** -- Present findings first, ordered by severity
2. **Trust Evidence Boundaries** -- Keep inferences as inferences, preserve confidence scores
3. **Handle Empty Findings** -- Say so explicitly, keep residual-risk notes brief

## Output Patterns

### Reviews
1. Present verdict (approve / needs-attention)
2. Present summary
3. List findings by severity with file/line/confidence/recommendation
4. Present next_steps
5. **STOP -- Do not auto-fix. Ask user which issues to fix.**

### Results
- Present full output verbatim, no condensing
- Preserve all details including error messages

### Rescue Edits
- List touched files when provided
- Present edits as completed work

### Failures
- Report failure and stop
- Do not generate substitute answers
- Direct to `/codex:setup` if auth required

## Key Constraints

- **No Post-Review Auto-Fixes** -- Must explicitly ask user first
- **No Rescue Substitution** -- If Codex fails, report and stop
- **Setup Redirection** -- Do not improvise auth flows

## Design Principles

- Verdict as ground truth (not a suggestion)
- Findings as evidence (not commands)
- Confidence as epistemic honesty (0-1 scores preserved)
- Ordering by severity (not certainty)
- Preservation over interpretation
