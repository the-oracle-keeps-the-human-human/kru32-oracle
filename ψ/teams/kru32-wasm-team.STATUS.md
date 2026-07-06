# kru32-wasm-team — ✅ SHIPPED (2026-07-06)

**COMPLETE.** 5 codex coders built → lead merged + integrated → **deployed** → team torn down clean.
- Live: https://the-oracle-keeps-the-human-human.github.io/kru32-oracle/
- Final commit: `d5fd879` · deploy Actions success · Rule-6 in raw HTML (noscript) ✓
- Teardown: `maw codex down` cleared 5 windows + worktrees + branches (kit up+status+down all validated).

**What shipped:**
- Tab 1 "🖥️ WASM Apps" — 21 apps from workshop-04 (Nova flashable `erase:false`, 20 gallery-only + GitHub link)
- Tab 2 "📚 บทเรียน Basic" — lesson grid extracted to `LessonGrid.tsx`
- `TopBar` (WiFi) + `Tabs` (ARIA keyboard) + `FlowField` Van Gogh + Rule-6 footer (+noscript fallback)
- `src/data/types.ts` (canonical WasmApp) · `scripts/verify-apps.ts` (validator, 21 apps pass)

Merge trail: petpacks `d42fde6` · gallery `665830b` · lessons `c7ac3e2` · tabs → integration `a31ce52` · qa `d5fd879`.

---

*Historical record (team while live):*

**Team UP + dispatched.** 5 codex coders in isolated worktrees off main.
Spawned via `maw codex up` (Soul-Brews-Studio/maw-codex-team-kit, fleetpad-oracle). Charter: `ψ/teams/kru32-wasm-team.yaml`.

Session: **81-kru32** · lead window: **kru32** · repo basename: **kru32-oracle** (≠ session — teardown uses repo basename, handled).

| Coder | Account | Window | Delivers (NEW files only) |
|---|---|---|---|
| petpacks | omx-1 | `kru32-oracle-kru32-wasm-petpacks` | `src/data/apps.ts` (WASM_APPS) + `public/wasm-apps/<id>/` from workshop-04 submissions |
| gallery | omx-3 | `kru32-oracle-kru32-wasm-gallery` | `src/components/WasmGallery.tsx` (Tab 1) |
| lessons | omx-4 | `kru32-oracle-kru32-wasm-lessons` | `src/components/LessonGrid.tsx` (Tab 2, extracted from App.tsx) |
| tabs | omx-5 | `kru32-oracle-kru32-wasm-tabs` | `src/components/Tabs.tsx` + `src/components/TopBar.tsx` |
| qa | omx-6 | `kru32-oracle-kru32-wasm-qa` | `scripts/verify-apps.ts` + verification |

Coders report ACK→done to lead: `maw hey 81-kru32:kru32`.

## Monitor
- `maw codex status` — live worktrees + kill targets
- `maw ls | grep 81-kru32` — pane/agent count
- `tmux attach -t 81-kru32` then window-switch — watch a coder (detach: `Ctrl-b d`)
- Coder branches accumulate: `git branch --list 'agents/kru32-wasm-*'`

## LEAD INTEGRATION (next session — this is the human/lead half, NOT done yet)
The coders build NEW files in isolation; the LEAD must define the contract + wire them in:
1. **Contract**: create `src/data/types.ts` → `export interface WasmApp { id; name; blurb; tag; preview; submissionUrl; flashable; manifest?; kind? }`. (Dispatched inline to petpacks+gallery so their stubs align — reconcile into this canonical type.)
2. **Collect**: review each `agents/kru32-wasm-*` branch (lead-gated). Merge greens to main, serialized.
3. **Wire the shell** (`src/components/App.tsx`, lead-owned): keep FlowField backdrop + header; add `<TopBar/>` (WiFi) + `<Tabs/>`; Tab 1 → `<WasmGallery/>`, Tab 2 → `<LessonGrid/>`; remove the old inline lesson grid. Update `src/pages/index.astro` if needed.
4. `astro build` green (watch base-path `/kru32-oracle` asset URLs); qa coder validates manifests still `erase:false`.
5. Deploy (GitHub Actions) + live-verify. Keep Rule-6 AI footer.

## Reality note
Only `02-Nova` in workshop-04 submissions is fully flashable (manifest+bins). Rest are chars/source-only → gallery cards with a GitHub source link (flashable:false). Tab 1 content is thin today; the pipeline + tabs are the deliverable.

## Teardown
`maw codex down` — kills the 5 windows, moves worktrees to /tmp, `git worktree prune`, deletes `agents/kru32-wasm-*` branches. Verified clean in kit source (`plugin/src/team.ts` cmdDown). Do this once coder work is merged (or to abort).
