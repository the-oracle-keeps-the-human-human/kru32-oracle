// Shared data contract for the WASM-apps gallery (Tab 1). Lead-owned.
// During the parallel build each coder stubbed this locally; apps.ts + WasmGallery.tsx
// import it from here after integration (single source of truth).

export interface WasmApp {
  id: string;
  name: string;
  blurb: string;
  /** Short badge, e.g. "ESP32-S3" | "WASM core" | "WASM + pet". */
  tag: string;
  /** Path under BASE_URL to the card preview (gif/png). */
  preview: string;
  /** GitHub link to the student submission. */
  submissionUrl: string;
  /** True only when a real esp-web-tools manifest + firmware bins exist. */
  flashable: boolean;
  /** Path under BASE_URL to the esp-web-tools manifest (flashable apps only). */
  manifest?: string;
  /** e.g. "pet" | "wasm" | "wasm+pet". */
  kind?: string;
}
