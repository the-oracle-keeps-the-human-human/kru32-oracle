# Codex Output Rendering Architecture

**File**: `plugins/codex/scripts/lib/render.mjs`
**Pattern**: Pure export module; no state; all rendering is deterministic function composition

## Core Rendering Functions (8 Exports)

1. **`renderReviewResult(parsedResult, meta)`** -- Structured review output with severity-sorted findings
2. **`renderNativeReviewResult(result, meta)`** -- Built-in reviewer output (pass/fail)
3. **`renderTaskResult(parsedResult, meta)`** -- Raw AI output passthrough
4. **`renderSetupReport(report)`** -- Initial configuration status
5. **`renderStatusReport(report)`** -- Queue & job status with markdown tables
6. **`renderJobStatusReport(job)`** -- Single job deep dive
7. **`renderStoredJobResult(job, storedJob)`** -- Historical job result retrieval
8. **`renderCancelReport(job)`** -- Job cancellation confirmation

## Key Design Patterns

- **Severity Sorting**: critical(0) > high(1) > medium(2) > low(3)
- **Defensive Normalization**: All inputs validated with sensible defaults
- **Array Line Building**: Build `lines = []`, push strings, join with newline
- **Markdown Safety**: Escape pipes and newlines in table cells
- **Cascade Rendering**: Multiple sources tried (rendered -> rawOutput -> fallback)
- **Newline Termination**: All render functions return strings ending with exactly one `\n`

## Output Modes

- **Human-Readable** (default): Formatted markdown for console
- **JSON Mode** (`--json`): Structured data for programmatic use (handled by codex-companion.mjs)

## Edge Cases Handled

- No findings -> "No material findings"
- Missing line numbers -> Omitted
- Parse error -> Shows raw output + error message
- Empty task output -> Fallback message
- Reasoning empty -> Skips section
