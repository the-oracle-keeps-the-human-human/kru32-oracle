# Codex /codex result Command

## Overview

Retrieves and displays the complete final output of a finished Codex job. Three-stage flow: argument parsing -> job lookup -> result rendering.

## Job Lookup: resolveResultJob()

- Only retrieves completed, failed, or cancelled jobs
- Exact ID match, unique prefix match, or most recent
- Active jobs rejected with helpful message
- Session filtering when no reference provided

## Result Rendering Priority

1. Structured review result with pre-rendered markdown
2. Task raw output (`result.rawOutput` or `result.codex.stdout`)
3. Any pre-rendered output (`storedJob.rendered`)
4. Fallback synthesis from job metadata

All paths append Codex session ID and `codex resume <threadId>` command.

## Storage Location

```
$CLAUDE_PLUGIN_DATA/state/{workspace-slug}-{hash}/jobs/{job-id}.json
```

## Output Formats

- **Default**: Markdown passthrough for human consumption
- **`--json`**: Full structured data with job metadata and stored job record

## Error Scenarios

| Scenario | Message |
|----------|---------|
| Job still running | "Job {id} is still {status}. Check /codex:status..." |
| Not found | "No finished job found for {reference}..." |
| Ambiguous | "Job reference is ambiguous. Use a longer job id." |
| No finished jobs | "No finished Codex jobs found for this repository yet." |
