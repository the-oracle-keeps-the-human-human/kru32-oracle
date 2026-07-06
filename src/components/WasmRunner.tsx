import { useEffect, useMemo, useRef, useState } from "react";

type GifWasmDecoder = {
  HEAPU8: Uint8Array;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  _gif_open: (ptr: number, len: number) => number;
  _gif_close: () => void;
  _gif_width: () => number;
  _gif_height: () => number;
  _gif_play: (delayPtr: number) => number;
  _gif_fb: () => number;
};

type GifModuleFactory = (options?: {
  locateFile?: (path: string) => string;
}) => Promise<GifWasmDecoder>;

type FrameSet = {
  frames: ImageData[];
  delays: number[];
  width: number;
  height: number;
};

interface WasmRunnerProps {
  appId: string;
  states?: string[];
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const DECODER_BASE = `${BASE}/gif-wasm`;
const APP_BASE = `${BASE}/wasm-apps`;

const DEFAULT_STATES = ["idle", "busy", "attention", "celebrate", "dizzy", "sleep", "heart"];

declare global {
  interface Window {
    GifModule?: GifModuleFactory;
  }
}

const FRAME_SCALE = 3;
const MAX_GIF_FRAMES = 10000;
const MIN_FRAME_DELAY = 20;
const DEFAULT_FRAME_DELAY = 80;

let gifScriptPromise: Promise<void> | null = null;
let gifModulePromise: Promise<GifWasmDecoder> | null = null;

function stateListFingerprint(states: string[]) {
  return states.join("|").toLowerCase();
}

function gifUrl(appId: string, state: string) {
  return `${APP_BASE}/${appId}/characters/${appId}/${state}.gif`;
}

function readFrameDelay(heap: Uint8Array, delayPtr: number): number {
  const delay =
    heap[delayPtr] |
    (heap[delayPtr + 1] << 8) |
    (heap[delayPtr + 2] << 16) |
    (heap[delayPtr + 3] << 24);

  return Math.max(MIN_FRAME_DELAY, (delay >>> 0) || DEFAULT_FRAME_DELAY);
}

function clampStateNames(input: string[]) {
  const seen = new Set<string>();
  for (const name of input) {
    const clean = name.trim().toLowerCase();
    if (!clean) continue;
    if (!seen.has(clean)) seen.add(clean);
  }
  return Array.from(seen);
}

function ensureGifDecScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("gif decoder requires window"));
  }

  if (gifScriptPromise) return gifScriptPromise;

  const src = `${DECODER_BASE}/gifdec.js`;
  const srcUrl = new URL(src, window.location.href).href;

  gifScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = Array.from(document.scripts).find((script) => {
      const candidate = script.src;
      return candidate === src || candidate === srcUrl;
    }) as HTMLScriptElement | undefined;

    const finalize = (status: "loaded" | "failed") => {
      const target = existing ?? createdScript;
      if (target) target.dataset.kruGifDecoder = status;
    };

    let createdScript: HTMLScriptElement | undefined;

    const onLoad = () => {
      finalize("loaded");
      resolve();
    };

    const onError = () => {
      finalize("failed");
      reject(new Error(`failed to load gif decoder from ${src}`));
    };

    if (existing) {
      const state = existing.dataset.kruGifDecoder;
      if (state === "loaded") {
        resolve();
        return;
      }
      if (typeof window.GifModule === "function") {
        resolve();
        return;
      }
      if (state === "failed") {
        reject(new Error(`failed to load gif decoder from ${src}`));
        return;
      }

      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    createdScript = document.createElement("script");
    createdScript.src = src;
    createdScript.async = true;
    createdScript.dataset.kruGifDecoder = "loading";
    createdScript.addEventListener("load", onLoad, { once: true });
    createdScript.addEventListener("error", onError, { once: true });
    document.head.appendChild(createdScript);
  });

  return gifScriptPromise;
}

async function ensureGifDecoderModule(): Promise<GifWasmDecoder> {
  if (gifModulePromise) return gifModulePromise;

  gifModulePromise = (async () => {
    await ensureGifDecScript();
    const factory = window.GifModule;
    if (typeof factory !== "function") {
      throw new Error("GifModule not available on window after loading gifdec.js");
    }

    const module = await factory({
      locateFile: (path: string) => `${DECODER_BASE}/${path}`,
    });

    if (typeof module._malloc !== "function" || !(module.HEAPU8 instanceof Uint8Array)) {
      throw new Error("gif decoder module failed to initialize");
    }

    return module;
  })();

  return gifModulePromise;
}

function decodeGif(module: GifWasmDecoder, bytes: Uint8Array): FrameSet {
  const sourcePtr = module._malloc(bytes.length);
  if (sourcePtr === 0) {
    throw new Error("gif decoder malloc failed");
  }

  module.HEAPU8.set(bytes, sourcePtr);

  const result = module._gif_open(sourcePtr, bytes.length);
  const frames: ImageData[] = [];
  const delays: number[] = [];
  let width = 0;
  let height = 0;
  let delayPtr = 0;

  try {
    if (result !== 0) {
      throw new Error(`gif_open failed (${result})`);
    }

    width = module._gif_width();
    height = module._gif_height();
    if (width <= 0 || height <= 0) {
      throw new Error(`invalid frame size: ${width}x${height}`);
    }

    const stride = width * height * 4;
    delayPtr = module._malloc(4);

    for (let i = 0; i < MAX_GIF_FRAMES; i += 1) {
      const r = module._gif_play(delayPtr);
      if (r < 0) break;

      const fb = module._gif_fb();
      const frame = new ImageData(width, height);
      frame.data.set(module.HEAPU8.subarray(fb, fb + stride));
      frames.push(frame);
      delays.push(readFrameDelay(module.HEAPU8, delayPtr));

      if (r === 0) break;
    }

    return { frames, delays, width, height };
  } finally {
    if (delayPtr) module._free(delayPtr);
    module._gif_close();
    module._free(sourcePtr);
  }
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (head.ok) return true;

    const get = await fetch(url, { method: "GET", cache: "no-store" });
    return get.ok;
  } catch {
    return false;
  }
}

export default function WasmRunner({ appId, states = DEFAULT_STATES }: WasmRunnerProps) {
  const requestedStates = useMemo(() => clampStateNames(states), [states]);
  const finalStates = requestedStates.length > 0 ? requestedStates : DEFAULT_STATES;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const framesRef = useRef<ImageData[]>([]);
  const delaysRef = useRef<number[]>([]);
  const frameIndexRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const playingRef = useRef<boolean>(true);

  const [decoder, setDecoder] = useState<GifWasmDecoder | null>(null);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [activeState, setActiveState] = useState<string>("");
  const [status, setStatus] = useState<string>("loading gif decoder");
  const [error, setError] = useState<string>("");
  const [playing, setPlaying] = useState<boolean>(true);
  const [dimensions, setDimensions] = useState({ width: 96, height: 100 });

  const stopLoop = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const drawCurrentFrame = (index: number) => {
    const ctx = ctxRef.current;
    const frame = framesRef.current[index];
    if (!ctx || !frame) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (canvas.width !== frame.width || canvas.height !== frame.height) {
      canvas.width = frame.width;
      canvas.height = frame.height;
    }

    ctx.putImageData(frame, 0, 0);
  };

  const tick = () => {
    if (!mountedRef.current || !playingRef.current || framesRef.current.length === 0) return;

    const current = frameIndexRef.current;
    drawCurrentFrame(current);

    const delay = delaysRef.current[current] ?? DEFAULT_FRAME_DELAY;
    frameIndexRef.current = (current + 1) % framesRef.current.length;

    timerRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, delay);
  };

  const startLoop = () => {
    stopLoop();
    if (!playingRef.current || framesRef.current.length === 0) return;

    frameIndexRef.current = 0;
    tick();
  };

  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;
    ensureGifDecoderModule()
      .then((m) => {
        if (cancelled || !mountedRef.current) return;
        setDecoder(m);
        setStatus("gif decoder ready");
      })
      .catch((e) => {
        if (cancelled || !mountedRef.current) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("decoder unavailable");
      });

    return () => {
      cancelled = true;
      mountedRef.current = false;
      stopLoop();
    };
  }, []);

  useEffect(() => {
    if (!decoder) return;

    let cancelled = false;
    const probeList = finalStates;

    setAvailableStates([]);
    setActiveState("");
    stopLoop();
    setStatus("probing available gif states");

    const runProbe = async () => {
      const results = await Promise.all(
        probeList.map(async (stateName) => ({
          stateName,
          ok: await urlExists(gifUrl(appId, stateName)),
        })),
      );

      if (cancelled || !mountedRef.current) return;

      const next = results.filter((entry) => entry.ok).map((entry) => entry.stateName);
      setAvailableStates(next);

      if (!next.length) {
        setError(`No valid GIF states found for ${appId}`);
        setStatus("no animations available");
        return;
      }

      const first = next.includes("idle") ? "idle" : next[0];
      setActiveState(first);
      setError("");
      setStatus(`states ready (${next.length})`);
    };

    runProbe().catch((e) => {
      if (cancelled || !mountedRef.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setStatus("probe failed");
    });

    return () => {
      cancelled = true;
      stopLoop();
    };
  }, [appId, decoder, stateListFingerprint(finalStates)]);

  useEffect(() => {
    if (!decoder || !activeState) return;

    let cancelled = false;
    const controller = new AbortController();
    const signal = controller.signal;

    const decodeAndPlay = async () => {
      setError("");
      stopLoop();
      setStatus(`loading ${activeState}`);

      if (!mountedRef.current || signal.aborted) return;

      const url = gifUrl(appId, activeState);
      const response = await fetch(url, { signal, cache: "no-store" });
      if (!response.ok) {
        throw new Error(`couldn't load ${url}`);
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      const { frames, delays, width, height } = decodeGif(decoder, bytes);

      if (cancelled || signal.aborted) return;

      if (!frames.length || !delays.length) {
        throw new Error("no frames decoded");
      }

      framesRef.current = frames;
      delaysRef.current = delays;
      setDimensions({ width, height });
      drawCurrentFrame(0);
      setStatus(`state: ${activeState} · ${frames.length} frame${frames.length > 1 ? "s" : ""}`);

      if (playingRef.current) {
        startLoop();
      }
    };

    decodeAndPlay().catch((e) => {
      if (cancelled || signal.aborted) return;
      framesRef.current = [];
      delaysRef.current = [];
      setError(e instanceof Error ? e.message : String(e));
      setStatus("decode failed");
    });

    return () => {
      cancelled = true;
      controller.abort();
      stopLoop();
    };
  }, [appId, activeState, decoder]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext("2d");
    }

    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    return () => {
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!dimensions.width || !dimensions.height) return;

    canvasRef.current.width = dimensions.width;
    canvasRef.current.height = dimensions.height;

    drawCurrentFrame(frameIndexRef.current % Math.max(1, framesRef.current.length));
  }, [dimensions.width, dimensions.height]);

  useEffect(() => {
    playingRef.current = playing;
    if (!playing) {
      stopLoop();
      setStatus((prev) => (prev.includes("paused") ? prev : `paused · ${activeState || "idle"}`));
      return;
    }

    startLoop();
    return () => {
      stopLoop();
    };
  }, [playing, activeState]);

  const handlePlayToggle = () => {
    setPlaying((current) => !current);
  };

  const handleStateSelect = (stateName: string) => {
    if (stateName === activeState) return;
    setActiveState(stateName);
    setPlaying(true);
  };

  const displayWidth = dimensions.width * FRAME_SCALE;
  const displayHeight = dimensions.height * FRAME_SCALE;

  return (
    <div
      className="flex w-full flex-col items-center gap-3 text-[#9bb0d3]"
      style={{ fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace' }}
    >
      {/* gilt-framed screen — the pet decoded LIVE by the same on-device WASM gif decoder */}
      <div className="rounded-[16px] p-2 bg-gradient-to-b from-[#8a6a2e] to-[#2a2012] shadow-[0_16px_40px_-18px_rgba(0,0,0,.8),0_0_50px_-16px_rgba(246,197,68,.3)]">
        <div
          className="grid place-items-center overflow-hidden rounded-[9px] border border-[#1a1204] bg-black"
          style={{ width: `${displayWidth}px`, height: `${displayHeight}px` }}
        >
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="block"
            style={{ width: `${displayWidth}px`, height: `${displayHeight}px`, imageRendering: "pixelated" }}
            aria-label="WASM GIF character frame"
          />
        </div>
      </div>

      {/* state buttons */}
      <div className="flex max-w-[330px] flex-wrap justify-center gap-1.5">
        {availableStates.map((stateName) => {
          const active = stateName === activeState;
          return (
            <button
              key={stateName}
              type="button"
              onClick={() => handleStateSelect(stateName)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                active
                  ? "bg-[#f6c544] text-[#1a1204] border border-[#ffda6b]"
                  : "border border-[#2a3a5c] text-[#91a6cc] hover:border-[#f6c544] hover:text-[#f6c544]"
              }`}
            >
              {stateName}
            </button>
          );
        })}
      </div>

      {/* play + one-line caption */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlayToggle}
          className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
            playing
              ? "bg-[#0f2447] text-[#e8e2d0] border border-[#f6c544]"
              : "border border-[#2a3a5c] text-[#91a6cc] hover:border-[#f6c544]"
          }`}
        >
          {playing ? "⏸ pause" : "▶ play"}
        </button>
        <span className="text-[10px] text-[#7a8bad]">
          {error ? <span className="text-[#ff9f7a]">{error}</span> : <>🖥️ decoded in WASM · {status}</>}
        </span>
      </div>
    </div>
  );
}
