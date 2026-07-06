---
name: firmware-flash
description: Make an ESP32 app (pet pack / WASM-core / prebuilt) web-flashable on the kru32 gallery — load → verify → compile → deploy. Use when adding or fixing a flashable app in public/wasm-apps.
---

# /firmware-flash — ESP32 app → web-flashable pipeline

Proven on kru32-oracle (2026-07, went 1 → 17 flashable apps). Codifies the load → verify →
compile → deploy flow so any ESP32 app becomes flashable from the browser via esp-web-tools.

> **Golden rule:** every manifest MUST have `new_install_prompt_erase: false` and a part at
> **offset 0 whose first byte is `0xE9`** (valid ESP32 image). If offset-0 ≠ 0xE9, the flash fails.
> These two invariants are the whole QA gate — see step 3.

## 0. Detect the app type

Look in `workshop-04-esp32-wasm/submissions/<id>/` (or wherever the source is):

| Has… | Type | Path |
|---|---|---|
| `characters/<id>/*.gif` | **Pet pack** | §1 (mklittlefs storage on shared runtime) |
| `wasm/*.wasm` (no firmware) | **WASM-core** | §2 (ESP-IDF gif-wamr, embed .wasm) |
| `webflasher/` with real `.bin` | **Prebuilt** | §3 (wrap existing bins) |

Output for every type → `public/wasm-apps/<id>/` : the bin parts + `manifest-<id>.json`,
then flip `flashable: true` in `src/data/apps.ts` (§4).

## 1. Pet pack — mklittlefs storage on the shared runtime (NO compile)

The pet firmware reads GIFs from a LittleFS partition, so every pet reuses the SAME 3 firmware
bins and only differs in its storage image.

```bash
MKL=~/.platformio/packages/tool-mklittlefs/mklittlefs   # or tool-mklittlefs@1.203.*
DATA=/tmp/pack-<id>; mkdir -p "$DATA"
cp workshop-04-esp32-wasm/submissions/<id>/characters/<id>/*.gif "$DATA"/   # need idle + heart|celebrate
# ⚠️ EXACT params — wrong ones get SILENTLY reformatted (format_if_mount_failed=true) → blank pet:
"$MKL" -c "$DATA" -s 3145728 -b 4096 -p 256 public/wasm-apps/<id>/<id>-storage.bin
# reuse the shared runtime (identical for all pets) from an existing pet dir (e.g. nova):
cp public/wasm-apps/nova/{bootloader.bin,partition-table.bin,jc3248_pet_idf-clawd.bin} public/wasm-apps/<id>/
```

Manifest (`public/wasm-apps/<id>/manifest-<id>.json`) — offsets confirmed from partitions.csv:
```json
{ "name":"<Name>", "version":"1.0.0", "new_install_prompt_erase": false,
  "builds":[{ "chipFamily":"ESP32-S3", "parts":[
    {"path":"bootloader.bin","offset":0},
    {"path":"partition-table.bin","offset":32768},
    {"path":"jc3248_pet_idf-clawd.bin","offset":65536},
    {"path":"<id>-storage.bin","offset":2686976}]}]}
```
Notes: 7 GIF states are NOT required — `gif.cpp` v1 reads only `idle` + (`heart` or `celebrate`);
the rest are ignored. Storage size must be exactly `0x300000` (3145728).

## 2. WASM-core — ESP-IDF gif-wamr, embed the .wasm (do NOT use pio)

`.wasm` modules run under esp32-oracle's shared WAMR host; the .wasm is embedded at build.

```bash
. ~/esp/esp-idf/export.sh            # IDF v6.x — NOT platformio (this is an IDF component build)
cp -r /opt/Code/github.com/Soul-Brews-Studio/esp32-oracle/lab/gif-wamr /tmp/gif-wamr-<id>
cd /tmp/gif-wamr-<id>
# add your app as a WAMR_HOST variant (see main/CMakeLists.txt lines ~6-31 for sentinel/chaiklang/gif),
# drop your .wasm in, then:
idf.py -DWAMR_HOST=<id> build
# collect build/bootloader/bootloader.bin, build/partition_table/partition-table.bin, build/<proj>.bin
# → copy into public/wasm-apps/<id>/ and write manifest (offsets from build/flasher_args.json).
```

## 3. Prebuilt — wrap existing webflasher bins

Submissions with a `webflasher/` dir already ship compiled firmware. Read their
`webflasher/*.html` or `flasher_args.json` for the part→offset map, copy the bins into
`public/wasm-apps/<id>/`, and write `manifest-<id>.json` with those offsets (`erase:false`).
A single merged bin → one part at offset 0.

## 4. QA verify — the gate (run before flipping flashable)

```bash
bun .claude/skills/firmware-flash/scripts/verify-flashable.mjs
```
Passes an app only if: manifest has a part at offset 0 whose byte0 == `0xE9`, `erase:false`,
and all referenced bins exist. Fix any app it reports before flagging it flashable.

## 5. Deploy

```bash
# flip flashable + manifest in src/data/apps.ts for the verified ids:
bun .claude/skills/firmware-flash/scripts/set-flashable.mjs <id> [<id> ...]
bun run build            # must be green
git add public/wasm-apps src/data/apps.ts && git commit -m "feat(wasm): <ids> flashable"
git push origin main     # GitHub Actions → Pages auto-deploy
```
The gallery's `<esp-web-install-button manifest=…>` (already wired in `WasmGallery.tsx`) makes the
app **flashable from the browser** — user clicks the card → Install → firmware uploads to the device.

## Gotchas (each cost a real debugging round)

- **offset-0 ≠ 0xE9 → dead flash.** Always run §4. `find … | head -1` may grab the wrong bin — check the *offset-0* part.
- **mklittlefs wrong params → silent blank pet** (image reformatted on mount, no error). Use `-s 3145728 -b 4096 -p 256`.
- **WASM-core is ESP-IDF, not pio.** `~/.platformio` exists but does not build these.
- **erase:true crashes the browser** on ESP32-S3 native USB (Chromium USB re-enum bug). Never set it true.
- **Shared runtime is duplicated per pet** (~2.5 MB × N). Optional dedup: one `_shared/` copy + `../\_shared/…` manifest paths.
- **Expert consult:** esp32-oracle (`maw hey 87-esp32:esp32`) owns the firmware — ask it for offsets/build details.

## References
- Recipe source: `workshop-04-esp32-wasm/submissions/_TEMPLATE/README.md`
- Firmware source: `/opt/Code/github.com/Soul-Brews-Studio/esp32-oracle/lab/{jc3248-pet-idf,gif-wamr,gif-wasm,sim-gallery}`
- Tools: `~/.platformio/packages/tool-mklittlefs/mklittlefs`, `~/esp/esp-idf/export.sh` (v6)
