---
pattern: diff-against-working-reference
date: 2026-07-06
source: session 1a4f1440
concepts: [root-cause-analysis, debugging, reference-implementation, esp-web-tools, isolation-testing, deep-research-follow-through]
---

# Diff Against a Working Reference Before Theorizing

**The pattern**: When a working reference implementation exists — same org, same hardware, same problem class — diff against it FIRST, before generating independent theories about root cause.

**What happened**: kru32-oracle's web flasher crashed real Google Chrome during ESP32 flashing. Over roughly 40 minutes the AI cycled through independently-generated theories — blamed a specific browser (Comet) alone, then an esp-web-tools version bump (v10 vs v9), then reached for a self-host/vendoring fix — while a same-org reference flasher (`workshop-04-esp32-wasm`) using the identical board and never crashing sat one repo away the entire time. Only when the user pointed at it directly ("this one never crashes") did a side-by-side manifest diff surface the actual difference in under a minute: `new_install_prompt_erase: false` vs `true`. A deep-research workflow the AI had itself commissioned had already named the same trigger 24 minutes earlier ("native USB_SERIAL_JTAG + erase = crash 100%"), but that finding wasn't acted on directly — the AI's next move was a mitigation flag, not flipping the flag the research pointed at. The fix, once found, was a one-line manifest change.

**The rule**: Before generating a theory, ask "does a working reference for this exact problem already exist?" — same org, same hardware/board, same library, or even a past version of your own thing that worked. If yes, diff configs/manifests/dependency versions against it before doing anything else. The answer is very often a single-field difference, not a new subsystem that needs building.

**Secondary rule**: If you commission research (subagents, deep-research workflows, fan-out investigations) specifically to find a root cause, its top-line finding should change the very next thing you touch. Don't file a clear "X causes this" finding away as supporting evidence for a fix that carefully avoids touching X.

**Tertiary rule**: When isolating a variable, isolate exactly one. Bundling a version bump with a self-host/vendoring change with a config flag in the same deploy means a fix (or a new failure) can't be attributed to any single change — two unrelated bugs can end up being debugged simultaneously by mistake.
