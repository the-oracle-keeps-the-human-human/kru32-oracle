# Dependencies and Build System Analysis

**Project**: Codex Plugin for Claude Code
**Version**: 1.0.5, **License**: Apache-2.0, **Node.js**: >=18.18.0, **Module Type**: ESM

## Dependencies

### Production Dependencies
**None.** Zero production dependencies -- pure Node.js stdlib.

### Development Dependencies
- `@types/node` (^25.5.0) -- TypeScript type definitions
- `typescript` (^6.0.2) -- Type checking (noEmit: true)

### External Runtime Dependencies
- **codex** (global binary): Must be installed via `npm install -g @openai/codex`
- **git**: Standard Git version control

## Node.js APIs Used

| Module | Purpose |
|--------|---------|
| `fs` | Synchronous file operations |
| `os` | System info, temp directories |
| `path` | Cross-platform path manipulation |
| `process` | Environment, arguments, signals |
| `child_process` | Subprocess spawning (spawn, spawnSync) |
| `readline` | Line-based I/O for JSONL parsing |
| `net` | Unix sockets / named pipes for broker |
| `crypto` | SHA256 hashing for session tracking |
| `node:test` | Built-in test framework |

## Build System

### TypeScript Configuration
- Target ES2022, ESNext modules, Bundler resolution
- `noEmit: true` -- type-checking only, no JavaScript output
- `allowJs + checkJs` -- validates .mjs files

### Build Scripts
```json
{
  "prebuild": "codex app-server generate-ts --out ...",
  "build": "tsc -p tsconfig.app-server.json",
  "test": "node --test tests/*.test.mjs",
  "check-version": "node scripts/bump-version.mjs --check",
  "bump-version": "node scripts/bump-version.mjs"
}
```

## Platform-Specific Handling
- **Windows**: Named pipes, `taskkill`, shell spawn option
- **Unix**: Unix domain sockets, process groups, SIGTERM
