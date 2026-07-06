import React, { useEffect, useRef, useState } from "react";

type RuntimeState = {
  hasFramebuffer: boolean;
  framebufferPtr: number | null;
  width: number;
  height: number;
  statusLine: string;
  exportedFunctions: string[];
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
export const DEFAULT_MODULE_URL = `${BASE}/wasm-apps/lord-knight/gifapp.wasm`;

export const WASM_RUNNER_NOTES = {
  module: "03-lord-knight/wasm/gifapp.wasm",
  imports: "none",
  instantiate: "WebAssembly.instantiate with empty imports",
  renderPath: "gifapp_run() updates framebuffer -> gifapp_fb() returns pointer to linear-memory RGBA8888 frame",
  shimNeeded: "none for this module; wasi_snapshot_preview1 shim included for future cases",
  feasible: true,
};

interface WasmRunnerProps {
  /** Demo spike stays off unless explicitly enabled. */
  enabled?: boolean;
  moduleUrl?: string;
  fallbackWidth?: number;
  fallbackHeight?: number;
}

function createBrowserWasiShim(memRef: { memory?: WebAssembly.Memory }): Record<string, WebAssembly.ImportValue> {
  return {
    // args + environment are no-op / tiny-compatible for browser-only preview use cases.
    args_sizes_get: () => 0,
    args_get: () => 0,
    environ_get: () => 0,
    environ_sizes_get: () => 0,

    // stdout / stderr -> JS console fallback.
    fd_write: (fd: number, iovs: number, iovsLen: number, nwritten: number) => {
      const memory = memRef.memory;
      if (!memory) return 0;
      const data = new DataView(memory.buffer);
      let written = 0;
      for (let i = 0; i < iovsLen; i++) {
        const addr = iovs + i * 8;
        const ptr = data.getUint32(addr, true);
        const len = data.getUint32(addr + 4, true);
        const bytes = new Uint8Array(memory.buffer, ptr, len);
        const txt = new TextDecoder().decode(bytes);
        if (fd === 1 || fd === 2) {
          // eslint-disable-next-line no-console
          console.log(txt);
        }
        written += len;
      }
      if (nwritten !== 0 && memory) {
        new DataView(memory.buffer).setUint32(nwritten, written, true);
      }
      return 0;
    },

    // basic read/close/file ops no-op
    fd_read: (_fd: number, _iovs: number, _iovsLen: number, nread: number) => {
      if (memRef.memory) new DataView(memRef.memory.buffer).setUint32(nread, 0, true);
      return 0;
    },
    fd_close: () => 0,
    fd_seek: () => 0,
    fd_tell: () => 0,
    fd_fdstat_get: () => 0,
    fd_prestat_get: (_fd: number, prestatPtr: number) => {
      if (memRef.memory) new DataView(memRef.memory.buffer).setUint8(prestatPtr, 0);
      return 0;
    },
    fd_prestat_dir_name: () => 0,

    random_get: (buf: number, len: number) => {
      const memory = memRef.memory;
      if (!memory) return 0;
      const bytes = new Uint8Array(memory.buffer, buf, len);
      crypto.getRandomValues(bytes);
      return 0;
    },

    proc_exit: (code: number) => {
      throw new Error(`WASI proc_exit(${code})`);
    },

    clock_time_get: (_id: number, _precision: number, ptr: number) => {
      if (!memRef.memory) return 0;
      const nanos = BigInt(Date.now()) * 1_000_000n;
      const hi = Number((nanos >> 32n) & 0xffffffffn);
      const lo = Number(nanos & 0xffffffffn);
      const dv = new DataView(memRef.memory.buffer);
      dv.setUint32(ptr, lo, true);
      dv.setUint32(ptr + 4, hi, true);
      return 0;
    },

    path_open: () => 0,
    fd_filestat_get: () => 0,
    sock_recv: () => 0,
    sock_send: () => 0,
  };
}

function pickFunctionName(keys: string[], patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const match = keys.find((key) => re.test(key));
    if (match) return match;
  }
  return null;
}

function safeInvokeInt(fn: ((...args: number[]) => number) | null): { result?: number; error?: string } {
  if (!fn) return {};
  for (let argc = 0; argc <= 2; argc += 1) {
    try {
      const args = new Array(argc).fill(0);
      const result = fn(...args);
      return { result };
    } catch (error) {
      if (argc === 2) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    }
  }
  return { error: "invoke failed" };
}

export default function WasmRunner({
  enabled = false,
  moduleUrl = DEFAULT_MODULE_URL,
  fallbackWidth = 96,
  fallbackHeight = 100,
}: WasmRunnerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState("ready");
  const [error, setError] = useState("");
  const [state, setState] = useState<RuntimeState>({
    hasFramebuffer: false,
    framebufferPtr: null,
    width: fallbackWidth,
    height: fallbackHeight,
    statusLine: "",
    exportedFunctions: [],
  });

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || typeof WebAssembly === "undefined") {
      setStatus("WebAssembly unsupported");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      setStatus("Canvas unavailable");
      return;
    }

    const memRef: { memory?: WebAssembly.Memory } = {};
    let cancelled = false;

    const renderFramebuffer = (width: number, height: number, ptr: number) => {
      const memory = memRef.memory;
      if (!memory) return;
      const byteCount = width * height * 4;
      if (byteCount <= 0) return;
      const mem = new Uint8ClampedArray(memory.buffer, ptr, byteCount);
      const copy = new Uint8ClampedArray(mem);
      const image = new ImageData(copy, width, height);
      ctx.putImageData(image, 0, 0);
    };

    const run = async () => {
      setStatus("loading module");
      setError("");

      try {
        const response = await fetch(moduleUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const bytes = await response.arrayBuffer();
        const compiled = await WebAssembly.compile(bytes);
        const moduleImports = WebAssembly.Module.imports(compiled);

        const unsupported = moduleImports.filter(
          (m) => m.module !== "wasi_snapshot_preview1" && !(m.module === "env" && m.name === "emscripten_resize_heap"),
        );
        if (unsupported.length > 0) {
          const names = unsupported.map((i) => `${i.module}.${i.name}`).join(", ");
          throw new Error(`unsupported import module(s): ${names}`);
        }

        const importObj: Record<string, Record<string, WebAssembly.ImportValue>> = {};
        if (moduleImports.some((i) => i.module === "wasi_snapshot_preview1")) {
          importObj.wasi_snapshot_preview1 = createBrowserWasiShim(memRef);
        }
        if (moduleImports.some((i) => i.module === "env" && i.name === "emscripten_resize_heap")) {
          importObj.env = {
            emscripten_resize_heap: () => 1,
          };
        }

        const instance = await WebAssembly.instantiate(compiled, importObj);
        memRef.memory = instance.exports.memory instanceof WebAssembly.Memory ? instance.exports.memory : undefined;

        const exports = instance.exports as Record<string, WebAssembly.ExportValue>;
        const fnNames = Object.keys(exports).filter((k) => typeof exports[k] === "function").sort((a, b) => a.localeCompare(b));

        const widthFnName = pickFunctionName(fnNames, [/^gifapp_width$/i, /^.*_width$/i]);
        const heightFnName = pickFunctionName(fnNames, [/^gifapp_height$/i, /^.*_height$/i]);
        const fbFnName = pickFunctionName(fnNames, [/^gifapp_fb$/i, /^.*_fb$/i]);
        const runFnName = pickFunctionName(fnNames, [
          /^gifapp_run$/i,
          /^gifapp_selftest$/i,
          /^selftest$/i,
          /^run$/i,
          /^pulse$/i,
          /^sense$/i,
        ]);

        const widthFn = widthFnName && (exports[widthFnName] as ((...args: number[]) => number) | undefined);
        const heightFn = heightFnName && (exports[heightFnName] as ((...args: number[]) => number) | undefined);
        const fbFn = fbFnName && (exports[fbFnName] as ((...args: number[]) => number) | undefined);
        const runFn = runFnName && (exports[runFnName] as ((...args: number[]) => number) | undefined);

        let width = fallbackWidth;
        let height = fallbackHeight;
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = false;

        let statusLine = `Exports: ${fnNames.join(", ")}`;
        let hasFramebuffer = false;
        let framebufferPtr: number | null = null;

        let runLine = "";
        const runResult = runFn ? safeInvokeInt(runFn) : {};
        if (runResult.error) {
          throw new Error(`run invocation failed: ${runResult.error}`);
        }
        if (runResult.result !== undefined) {
          runLine = `${runFnName}: ${runResult.result}`;
        }

        if (widthFn) {
          const w = safeInvokeInt(widthFn).result;
          if (typeof w === "number" && w > 0) width = w;
        }
        if (heightFn) {
          const h = safeInvokeInt(heightFn).result;
          if (typeof h === "number" && h > 0) height = h;
        }

        // Some modules (notably gifapp) expose width/height only after a run call.
        if ((!width || !height) && runFnName?.toLowerCase().includes("selftest") && runResult.result !== undefined) {
          const v = runResult.result;
          const w = (v >>> 16) & 0xffff;
          const h = v & 0xffff;
          if (w > 0) width = w;
          if (h > 0) height = h;
        }

        canvas.width = width;
        canvas.height = height;

        if (fbFn && memRef.memory) {
          const ptr = safeInvokeInt(fbFn).result;
          if (typeof ptr === "number" && ptr >= 0) {
            framebufferPtr = ptr;
            hasFramebuffer = true;
            statusLine = `framebuffer=${fbFnName}(ptr=0x${ptr.toString(16)}) ${runLine ? `· ${runLine}` : ""}`;
            renderFramebuffer(width, height, ptr);
          }
        } else if (runLine) {
          statusLine = runLine;
        }

        if (cancelled) return;
        setState({
          hasFramebuffer,
          framebufferPtr,
          width,
          height,
          statusLine,
          exportedFunctions: fnNames,
        });

        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [enabled, moduleUrl, fallbackHeight, fallbackWidth]);

  if (!enabled) return null;

  return (
    <section className="rounded-[12px] border border-[#2a3a5c] bg-[#08152e]/80 p-4 text-[#e8e2d0]">
      <h3 className="font-display text-sm font-semibold text-[#f6c544]">WASM Preview Spike</h3>
      <p className="mt-1 text-[12px] text-[#9fb2ce]">Status: {status}</p>
      {error ? <p className="mt-1 text-xs text-[#ff8a6b]">{error}</p> : null}

      <div className="mt-3 inline-block rounded-lg overflow-hidden border border-[#26385f] bg-black">
        <canvas
          ref={canvasRef}
          width={state.width}
          height={state.height}
          className="block w-[288px] h-[300px]"
          aria-label="WASM preview canvas"
          style={{ width: `${state.width}px`, height: `${state.height}px` }}
        />
      </div>

      <p className="mt-2 text-[11px] text-[#8a9bbd]">
        Module: <code>{moduleUrl}</code>
      </p>
      <p className="mt-1 text-[11px] text-[#8a9bbd]">{state.statusLine || "loading metadata…"}</p>
      <p className="mt-1 text-[11px] text-[#8a9bbd]">
        Exported functions: {state.exportedFunctions.length > 0 ? state.exportedFunctions.join(", ") : "(loading)"}
      </p>
      {state.hasFramebuffer ? (
        <p className="mt-1 text-[11px] text-[#8a9bbd]">
          Framebuffer: 0x{state.framebufferPtr?.toString(16)} @ {state.width}×{state.height}
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-[#8a9bbd]">
          No exported framebuffer found; this remains compute-only preview mode.
        </p>
      )}

      <p className="mt-2 text-[10px] text-[#8a9bbd] leading-relaxed">
        This spike is behind a feature flag and uses import inspection before instantiation. If imports include
        <code> wasi_snapshot_preview1</code>, a small browser shim is injected; unknown imports are rejected.
      </p>
    </section>
  );
}
