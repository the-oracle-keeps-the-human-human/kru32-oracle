import React, { useEffect, useRef, useState } from "react";
import { LESSONS, LEVELS, type Lesson } from "../data/lessons";

// Astro/Vite injects the Pages base path (e.g. "/kru32-oracle/").
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const asset = (p: string) => `${BASE}/${p}`;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "esp-web-install-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { manifest?: string },
        HTMLElement
      >;
    }
  }
}

const hasSerial = typeof navigator !== "undefined" && "serial" in navigator;

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

/* การ์ดในแกลเลอรี = ภาพวาดใส่กรอบ hover ยกขึ้น+เรืองแสง */
function GalleryCard({ lesson, onOpen }: { lesson: Lesson; onOpen: (l: Lesson) => void }) {
  const start = lesson.num === "01";
  return (
    <button
      onClick={() => onOpen(lesson)}
      className="group relative text-left rounded-[10px] p-[3px] transition-all duration-300 cursor-pointer
        bg-gradient-to-b from-[#8a6a2e] to-[#3a2c14] hover:-translate-y-1.5
        shadow-[0_10px_30px_-14px_rgba(0,0,0,.8)] hover:shadow-[0_16px_40px_-12px_rgba(246,197,68,.4)]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f6c544]"
    >
      <div className="rounded-[8px] overflow-hidden bg-black relative">
        <img
          src={asset(`previews/${lesson.id}.png`)}
          alt={`หน้าจอบท ${lesson.num} ${lesson.name}`}
          width={240}
          height={360}
          loading="lazy"
          className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        {/* ป้ายชื่อ overlay ล่าง — พื้นทึบ อ่านได้เสมอ */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-[#08152e]/95 via-[#08152e]/80 to-transparent pt-8">
          <div className="flex items-baseline gap-1.5">
            <span className={`font-display font-semibold text-[11px] ${start ? "text-[#7fe0a6]" : "text-[#f6c544]"}`}>{lesson.num}</span>
            <span className="font-display font-semibold text-[13px] text-[#f4efe0] truncate">{lesson.name}</span>
          </div>
          <div className="text-[10px] text-[#c9bfa6] truncate mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {lesson.desc}
          </div>
        </div>
        {start && (
          <span className="absolute top-2 left-2 font-display text-[9px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-[#7fe0a6] text-[#08152e]">
            เริ่มที่นี่
          </span>
        )}
        <span className="absolute top-2 right-2 font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/55 text-[#c9bfa6]">{lesson.size}</span>
      </div>
    </button>
  );
}

/* Lightbox — คลิกการ์ดแล้วเปิดจอใหญ่ + Flash (แทน sidebar แถวยาว) */
function Lightbox({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050d1e]/80 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[560px] max-h-[92vh] overflow-y-auto rounded-2xl border border-[#2d4a2f]
          bg-[#0e2145]/95 shadow-[0_40px_90px_-24px_rgba(0,0,0,.85)] p-6 flex flex-col items-center"
      >
        <button
          onClick={onClose}
          aria-label="ปิด"
          className="absolute top-3 right-3 w-8 h-8 rounded-full grid place-items-center text-[#c9bfa6] hover:text-[#f6c544] hover:bg-white/5 transition-colors"
        >✕</button>

        {/* จอในกรอบภาพวาด */}
        <div className="rounded-[20px] p-2.5 bg-gradient-to-b from-[#8a6a2e] to-[#2a2012] shadow-[0_20px_50px_-18px_rgba(0,0,0,.8),0_0_60px_-14px_rgba(246,197,68,.3)]">
          <div className="relative w-[228px] h-[342px] bg-black rounded-[11px] overflow-hidden">
            <img src={asset(`previews/${lesson.id}.png`)} alt={`หน้าจอบท ${lesson.num} ${lesson.name}`} width={228} height={342} className="absolute inset-0 w-full h-full" />
            <div aria-hidden="true" className="kru-scan absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-transparent via-[#f6c5441a] to-transparent pointer-events-none" />
          </div>
        </div>

        <div className="text-center mt-4">
          <div className="font-display text-[10px] tracking-[.2em] uppercase text-[#f6c544]">บทที่ {lesson.num} · {lesson.level}</div>
          <h2 className="font-display text-xl font-bold text-[#f4efe0] mt-0.5">{lesson.name}</h2>
          <p className="text-[#c9bfa6] text-[13px] mt-1">{lesson.desc}</p>
          <div className="font-mono text-[10px] text-[#8a9bbd] mt-1">{lesson.size} · JC3248W535</div>
        </div>

        {hasSerial ? (
          <esp-web-install-button manifest={asset(`manifests/${lesson.id}.json`)}>
            <button slot="activate" className="kru-pulse mt-4 px-9 py-3 rounded-[10px] font-display font-bold text-sm tracking-wide text-[#1a1204] bg-gradient-to-br from-[#f6c544] to-[#e0a838] hover:-translate-y-px transition-transform cursor-pointer border-0">
              ⚡ Quick Flash
            </button>
          </esp-web-install-button>
        ) : (
          <div className="mt-4 text-[11px] text-[#ff8a6b] text-center">
            เบราว์เซอร์นี้ flash ไม่ได้ — ใช้ Chrome/Edge บนคอมพิวเตอร์
          </div>
        )}

        <div className="mt-3 flex items-center gap-4 text-[11px]">
          <a href={asset(`lessons/${lesson.id}/`)} className="font-display text-[#f6c544] hover:underline">ดู YAML เต็ม →</a>
        </div>
        <div className="mt-3 text-[10px] text-[#8a9bbd] text-center leading-relaxed">
          .factory.bin (bootloader + partition) · เสียบ USB-C พอร์ต native · ~30 วินาที<br />
          หลัง flash เว็บจะถามตั้งค่า Wi-Fi ผ่าน USB (Improv) ได้เลย
        </div>
        <div className="mt-2 text-[10px] text-[#e0a838] text-center leading-relaxed">
          ⚠️ ใช้ <b>Chrome หรือ Edge</b> เท่านั้น — เบราว์เซอร์ Chromium ตัวอื่น (Comet/Arc/Brave)
          อาจ crash ตอนบอร์ด reset หลัง flash
        </div>
      </div>
    </div>
  );
}

export default function App({ initialId }: { initialId?: string }) {
  const [open, setOpen] = useState<Lesson | null>(
    initialId ? LESSONS.find((l) => l.id === initialId) ?? null : null
  );

  return (
    <>
      <FlowField />
      <div className="relative max-w-[1160px] mx-auto px-6 py-10 pb-16">
        <header className="text-center mb-9">
          <div className="font-display italic text-[13px] text-[#f6c544] mb-1">Kru32 Oracle</div>
          <h1 className="font-display text-[2.6rem] leading-none font-bold text-[#f4efe0] [text-shadow:0_2px_30px_rgba(246,197,68,.3)]">
            แกลเลอรีจอ ESP32
          </h1>
          <p className="text-[#c9bfa6] text-sm mt-3 max-w-lg mx-auto">
            คลิกภาพเพื่อดูจอใหญ่แล้ว flash ลงบอร์ด JC3248W535 ·{" "}
            <a className="text-[#f6c544] hover:underline" href={asset("why-hard/")}>บทที่ 0 — ทำไมจอยาก</a>
            {" · "}
            <a className="text-[#f6c544] hover:underline" href="https://github.com/the-oracle-keeps-the-human-human/kru32-oracle" target="_blank" rel="noopener noreferrer">Source</a>
          </p>
        </header>

        <div className="flex flex-col gap-9">
          {LEVELS.map((lv) => {
            const group = LESSONS.filter((l) => l.level === lv.key).sort((a, b) => a.num.localeCompare(b.num));
            if (!group.length) return null;
            return (
              <section key={lv.key}>
                <h2 className={`font-display text-[13px] font-semibold tracking-wide pb-2 mb-4 border-b border-[#2a3a5c] ${lv.color.split(" ")[0]}`}>
                  {lv.label}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {group.map((l) => (
                    <GalleryCard key={l.id} lesson={l} onOpen={setOpen} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="mt-14 pt-5 border-t border-[#2a3a5c] text-center text-[11px] text-[#8a9bbd]">
          <a className="text-[#f6c544]" href="https://github.com/the-oracle-keeps-the-human-human/kru32-oracle" target="_blank" rel="noopener noreferrer">
            the-oracle-keeps-the-human-human/kru32-oracle
          </a>{" "}
          · กลั่นจาก 41.6 ชม. 186 commits และจอจริง 8 ตัวของ esp32-oracle
          <span className="block mt-2 text-[#5f7091]">🤖 หน้านี้สร้างและดูแลโดย kru32-oracle (AI) — ไม่ใช่มนุษย์</span>
        </footer>
      </div>

      {open && <Lightbox lesson={open} onClose={() => setOpen(null)} />}
    </>
  );
}
