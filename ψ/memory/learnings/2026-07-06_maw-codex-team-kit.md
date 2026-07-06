---
pattern: maw-codex-team-kit — spawn N codex/omx coders, per-account, isolated worktrees, silent boot
date: 2026-07-06
source: kru32-oracle session 1a4f1440 — first adoption on a repo outside the kit's origin
concepts: [codex-team, maw, worktrees, CODEX_HOME, direnv, tmux, fleet-orchestration]
kit: https://github.com/Soul-Brews-Studio/maw-codex-team-kit (fleetpad-oracle)
---

# maw-codex-team-kit — first-try success on kru32

Used fleetpad-oracle's kit to stand up a **5-coder codex team** (petpacks/gallery/lessons/tabs/qa)
for the WASM-apps + JSON-tabs build. **Worked first try**, on a repo *different* from where the kit was
born (fleetpad) — third validated project (fleetpad + turso + kru32).

## What worked
- **`maw codex up|down|status`** reads a charter `ψ/teams/*.yaml` (regex-parsed: `name`/`session`/
  `- role`/`engine: omx-N`/`worktree`). Lead = no `worktree` → excluded. Extra keys (`goal`/`engines`/
  `defaults`) are ignored harmlessly.
- **Silent boot, no trust prompt** — `maw codex use` writes per-account `CODEX_HOME=~/.codex-team/N`
  into each worktree's `.envrc` (direnv) + seeds `[projects."<abs>"] trust_level="trusted"` in that
  account's `config.toml`. `omx --yolo` alone does NOT skip trust; the seed is what does it.
- **Teardown gotcha #1 solved in-kit**: window name = `<repo-basename>-<slug>`, NOT `<session>-<slug>`.
  Here session `81-kru32` ≠ repo `kru32-oracle` (the exact case that broke turso) — `cmdDown` derives the
  repo basename from `git rev-parse`, so kill target `81-kru32:kru32-oracle-<slug>` was correct first try.
- `agents/` auto-added to **`.git/info/exclude`** (local, not tracked) — no stray diff. Don't hand-edit `.gitignore`.

## Friction (minor / cosmetic)
- `maw codex up --help` treats `--help` as a charter path → misleading `no charter found`. (No real --help.)
- **No dry-run** — `up` spawns immediately. Confirm before running.
- `up` boots coders **idle**; it does NOT pass the charter `prompt`. You must **dispatch** via
  `maw hey 81-kru32:<window> "<task>"` after. Point coders at the committed charter to save tokens.
- `callerDir()` = `$PWD` — run verbs from the **repo root** so charter discovery + git resolve correctly.

## Verdict
Drop-in. Charter + `maw codex up` → 5 isolated coders in ~seconds. Recommended for parallel, NEW-file,
lead-gated-merge work. Not for tightly-coupled edits to shared files (route those through the lead).
Teardown when merged: `maw codex down` (kills windows, worktrees→/tmp, prune, del branches).
