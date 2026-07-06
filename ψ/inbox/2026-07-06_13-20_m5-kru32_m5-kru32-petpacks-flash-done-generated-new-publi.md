---
from: m5:kru32
to: kru32
timestamp: 2026-07-06T13:20:46.353Z
read: false
---

[m5:kru32] petpacks-flash done: generated NEW public/wasm-apps files for chaiklang, leica, tinky, tonk, weizen, itthi, vialumen, gemini, novamon, jizo, no10, sombo. Each has shared bootloader@0, partition-table@0x8000, jc3248_pet_idf-clawd@0x10000, <id>-storage@0x290000, erase:false. Verified bootloader/app byte0=0xE9 and storage size 3MB/listable by mklittlefs. Skipped nova (already flashable) and somtor (ships compiled firmware; bins-flash lane). jizo had no source manifest, synthesized standard 7-state manifest in storage. bun run build green.
