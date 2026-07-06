import { useEffect, useRef, useState } from "react";

declare const __BUILD_VERSION__: string;
import { TopBar } from "./TopBar";
import { Tabs } from "./Tabs";
import WasmGallery from "./WasmGallery";
import LessonGrid from "./LessonGrid";

// Astro/Vite injects the Pages base path (e.g. "/kru32-oracle/").
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const asset = (p: string) => `${BASE}/${p}`;

/* ── Starry Night flow-field ──
   อนุภาคโคจรรอบ vortex 3 ดวง ทิ้งหางพู่กันจาง ๆ (impasto layering ผ่าน alpha-fade)
   ไม่ใช่จุดดาวสุ่ม — เป็นการหมุนวนแบบภาพวาด */
function FlowField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let W = 0, H = 0;
    let vortices: { x: number; y: number; s: number }[] = [];
    let parts: { x: number; y: number; px: number; py: number; c: string }[] = [];
    const strokes = ["rgba(246,197,68,", "rgba(207,224,255,", "rgba(120,170,255,", "rgba(60,120,90,"];

    const seed = () => {
      W = canvas.width = window.innerWidth * dpr;
      H = canvas.height = window.innerHeight * dpr;
      vortices = [
        { x: W * 0.78, y: H * 0.22, s: 1 },
        { x: W * 0.15, y: H * 0.7, s: -1 },
        { x: W * 0.45, y: H * 0.4, s: 0.6 },
      ];
      const n = Math.min(150, Math.floor((window.innerWidth * window.innerHeight) / 13000));
      parts = Array.from({ length: n }, () => {
        const x = Math.random() * W, y = Math.random() * H;
        return { x, y, px: x, py: y, c: strokes[(Math.random() * strokes.length) | 0] };
      });
      // เริ่มด้วยพื้น cobalt เต็มจอ
      ctx.fillStyle = "#0b1b39";
      ctx.fillRect(0, 0, W, H);
    };

    const step = () => {
      // ทับด้วย cobalt โปร่งบาง → หางพู่กันเก่าจางลง = impasto
      ctx.fillStyle = "rgba(11,27,57,0.055)";
      ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 1.15 * dpr;
      for (const p of parts) {
        let vx = 0, vy = 0;
        for (const v of vortices) {
          const dx = p.x - v.x, dy = p.y - v.y;
          const d2 = dx * dx + dy * dy + 9000 * dpr;
          const f = (v.s * 3400 * dpr) / d2;
          // ตั้งฉาก = หมุนวน + ดูดเข้าเล็กน้อย
          vx += -dy * f - dx * 0.00006;
          vy += dx * f - dy * 0.00006;
        }
        p.px = p.x; p.py = p.y;
        p.x += vx; p.y += vy;
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = Math.random() * W; p.y = Math.random() * H; p.px = p.x; p.py = p.y;
        }
        ctx.strokeStyle = p.c + "0.5)";
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      raf = requestAnimationFrame(step);
    };

    const drawStatic = () => {
      // reduced-motion: เฟรมนิ่งสวย ๆ — วนหลายรอบให้เกิดลายวน
      for (let i = 0; i < 260; i++) step_noRAF();
    };
    const step_noRAF = () => {
      ctx.lineWidth = 1.1 * dpr;
      for (const p of parts) {
        let vx = 0, vy = 0;
        for (const v of vortices) {
          const dx = p.x - v.x, dy = p.y - v.y;
          const d2 = dx * dx + dy * dy + 9000 * dpr;
          const f = (v.s * 3400 * dpr) / d2;
          vx += -dy * f - dx * 0.00006;
          vy += dx * f - dy * 0.00006;
        }
        p.px = p.x; p.py = p.y; p.x += vx; p.y += vy;
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) { p.x = Math.random() * W; p.y = Math.random() * H; p.px = p.x; p.py = p.y; }
        ctx.strokeStyle = p.c + "0.14)";
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
    };

    seed();
    if (reduced) drawStatic();
    else raf = requestAnimationFrame(step);
    const onResize = () => { seed(); if (reduced) drawStatic(); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" className="fixed inset-0 h-full w-full pointer-events-none opacity-40" />;
}

const TABS = [
  { key: "wasm", label: "🖥️ WASM Apps" },
  { key: "basic", label: "📚 บทเรียน Basic" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function App({ initialId }: { initialId?: string }) {
  // initialId = deep-link ไปบทเรียนหนึ่ง (จาก /lessons/[id]) → เปิดแท็บ Basic ให้เลย
  const [active, setActive] = useState<TabKey>(initialId ? "basic" : "wasm");

  return (
    <>
      <FlowField />
      <div className="relative max-w-[1160px] mx-auto px-6 py-10 pb-16">
        <TopBar />

        {/* nav รอง — บทที่ 0 · Lesson · Source */}
        <nav aria-label="ลิงก์เพิ่มเติม" className="-mt-4 mb-7 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px]">
          <a className="text-[#f6c544] hover:underline" href={asset("why-hard/")}>บทที่ 0 — ทำไมจอยาก</a>
          <span className="text-[#3a4a6c]" aria-hidden="true">·</span>
          <a className="text-[#f6c544] hover:underline" href={asset("lesson/")}>Lesson: erase:false</a>
          <span className="text-[#3a4a6c]" aria-hidden="true">·</span>
          <a className="text-[#f6c544] hover:underline" href="https://github.com/the-oracle-keeps-the-human-human/kru32-oracle" target="_blank" rel="noopener noreferrer">Source</a>
        </nav>

        {/* Tab switcher */}
        <div className="mb-9 flex justify-center">
          <Tabs tabs={TABS} active={active} onChange={setActive} ariaLabel="เลือก WASM Apps หรือ บทเรียน Basic" />
        </div>

        {/* Panel */}
        <div role="tabpanel">
          {active === "wasm" ? <WasmGallery /> : <LessonGrid initialId={initialId} />}
        </div>

        <footer className="mt-14 pt-5 border-t border-[#2a3a5c] text-center text-[11px] text-[#8a9bbd]">
          <a className="text-[#f6c544]" href="https://github.com/the-oracle-keeps-the-human-human/kru32-oracle" target="_blank" rel="noopener noreferrer">
            the-oracle-keeps-the-human-human/kru32-oracle
          </a>{" "}
          · กลั่นจาก 41.6 ชม. 186 commits และจอจริง 9 บอร์ดที่มีโค้ดใน esp32-oracle
          <span className="block mt-2 text-[#5f7091]">🤖 หน้านี้สร้างและดูแลโดย Kru32 Oracle (AI) — ไม่ใช่มนุษย์</span>
          <span className="block mt-1 font-mono text-[9px] text-[#3a4a6c]">build {__BUILD_VERSION__}</span>
        </footer>
      </div>
    </>
  );
}
