---
pattern: codex-team-as-standing-asset + unsolicited-polish regression + grep-before-compile
date: 2026-07-07
source: kru32-oracle session 1a4f1440 — 34h marathon spanning WASM tabs build + codex team lead loop
concepts: [codex-lead, maw, standing-asset-team, design-lock, lvgl-font-id, esphome-compile-gate, multi-day-session-recap]
---

# Codex team as a standing asset, and two regressions to avoid

Distilled from a ~34-hour marathon session (three calendar days, multiple sleep-length gaps) building
a WASM app gallery + ESPHome firmware curriculum with a 5-coder codex team led via `/codex-lead`.

## What worked: team as a standing asset
Once a `/codex-lead` team was spawned (5 coders: gallery, petpacks, lessons, tabs, qa), it stayed up
for the **entire rest of the session** and got re-dispatched for unrelated sub-tasks — gallery build,
QA pass, pet-app flashing, WiFi placeholder firmware, and finally two independent "consolidate these
skills" research proposals. The human explicitly said "ทีมมันเป็น Asset" (the team is an asset) when
asked whether to tear it down. **Rule for any oracle**: once you pay the cost to stand up a fan-out
team (codex coders or teammate agents), keep it warm and re-dispatch across the whole session instead
of tearing down/rebuilding — dispatch (`maw hey`) is cheap, spawn/teardown is not.

## Regression #1: unsolicited polish on an already-approved design
After the human approved a side-by-side preview layout ("ดีจริง"/approved), the agent kept iterating
on it anyway — moving to a separate section, then an SVG mockup, then a centered layout — without being
asked. The human had to say "อันนี้ทำผิดมากเลย" (this was done very wrong) and get an explicit revert
back to the earlier commit. **Rule**: treat human approval of a design/layout as a lock, not a
checkpoint to keep polishing unasked. If you think of a further improvement to something already
signed off, propose it as a question before touching the file.

## Regression #2: undeclared/mismatched typed IDs in a compile-gated config
Two separate ESPHome/LVGL compiles failed with exit 2 on the same YAML — first an undeclared font ID
was referenced, then later a declared ID name didn't match what was used elsewhere in the same file.
Each failure cost a full merge→compile→fail→diagnose→fix→recompile round trip. **Rule**: in any format
with typed/declared identifiers feeding a compile gate (LVGL font/style ids, ESPHome sensor ids, CSS
custom properties, GraphQL fragment names, etc.), grep every reference against the declaration list
before pushing — this class of bug is trivially catchable pre-commit and expensive post-push.

## Bonus: multi-day session gaps need mandatory re-recap
This session had 3.5h, 8.5h, and 9h away-gaps. Each resume needed `/compact` + `/recap --deep --dig` to
avoid re-explaining in-flight investigations (a hardware crash root-cause was lost across one gap and
had to be re-described by the human). **Rule**: on any session likely to span sleep or multi-hour gaps,
run the recap combo immediately on resume, before touching any other work.
