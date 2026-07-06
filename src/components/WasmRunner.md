# WASM preview spike — findings

- **Target module tested:** `03-lord-knight/wasm/gifapp.wasm` (copied to `public/wasm-apps/lord-knight/gifapp.wasm`).
- **Import inspection (offline before instantiate):**
  - Ran `wasm2wat` and `wasm-objdump -x`.
  - `Import` section: **none** (no host imports).
- **Exports checked:**
  - `gifapp_run`, `gifapp_width`, `gifapp_height`, `gifapp_fb`, `gifapp_selftest`, `memory`.
- **Browser shim need:** none for this module.
- **Feasibility:** yes, with empty imports (`{}`), run in browser and map framebuffer out of linear memory.
- **Render strategy:** call `gifapp_run()` then read `gifapp_fb()` pointer and copy `width*height*4` bytes from wasm `memory` into a canvas image.
- **Fallback for non-framebuffer modules:** component now attempts safe import inspection + optional `wasi_snapshot_preview1` shim before instantiate; unsupported imports abort with report.
- **Caveat:** the current spike decodes on-demand and renders the available framebuffer frame from this module.
