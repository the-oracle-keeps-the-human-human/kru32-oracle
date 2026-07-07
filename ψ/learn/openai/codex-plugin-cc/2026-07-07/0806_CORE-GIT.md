# Git Integration Analysis: codex-plugin-cc

## Overview

Git integration module (`git.mjs`) provides repository validation, branch comparison, working tree inspection, and intelligent diff collection with size constraints.

## Repository Validation

- `ensureGitRepository(cwd)` -- Validates Git installation and repository presence
- `getRepoRoot(cwd)` -- Returns absolute path to repo root

## Branch Detection

`detectDefaultBranch(cwd)` -- Multi-strategy fallback:
1. Symbolic ref `refs/remotes/origin/HEAD`
2. Local `main`, `master`, `trunk`
3. Remote `origin/main`, `origin/master`, `origin/trunk`
4. Fail with guidance

## Working Tree State

`getWorkingTreeState(cwd)` returns staged, unstaged, untracked files and isDirty flag.

## Review Target Resolution

`resolveReviewTarget(cwd, options)` decision tree:
1. If `--base <ref>` -> branch mode against that ref
2. If `--scope working-tree` -> always working tree
3. If `--scope branch` -> always branch against detected default
4. If `--scope auto` (default): dirty -> working tree, clean -> branch

## Diff Collection

### Size Constraints
- `MAX_UNTRACKED_BYTES`: 24 KB per untracked file
- `DEFAULT_INLINE_DIFF_MAX_FILES`: 2 files
- `DEFAULT_INLINE_DIFF_MAX_BYTES`: 256 KB total

### Two Modes
- **inline-diff**: Full diffs for small changes
- **self-collect**: Lightweight summary; reviewer uses own git commands

### Safety Checks for Untracked Files
1. File exists and is readable
2. Not a directory
3. Size <= 24 KB
4. Probably text (null-byte scanning)

## Branch Comparison

Uses `git merge-base` for accurate "what changed on this branch" even if base has advanced.

## Review Context Aggregation

`collectReviewContext()` assembles complete review package with intelligent diff inclusion based on file count and byte size limits.
