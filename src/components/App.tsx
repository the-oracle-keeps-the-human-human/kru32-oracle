import React, { useEffect, useRef, useState } from "react";
import { LESSONS, LEVELS, type Lesson } from "../data/lessons";

// Astro/Vite injects the Pages base path here (e.g. "/kru32-oracle/").
// Every static asset (preview PNG, manifest JSON) must go through this or it
// 404s once the app is served from a sub-path — DNA Mechanic/Skeptic verified.
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

function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let stars: { x: number; y: number; r: number; p: number; s: number }[] = [];
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      const n = Math.floor((window.innerWidth * window.innerHeight) / 9000);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: (Math.random() * 1.1 + 0.3) * dpr,
        p: Math.random() * Math.PI * 2,
        s: 0.5 + Math.random() * 0.5,
      }));
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const st of stars) {
        const twinkle = reduced ? 1 : 0.65 + 0.35 * Math.sin(t / 1400 + st.p);
        ctx.globalAlpha = st.s * twinkle * 0.8;
        ctx.fillStyle = "#cfe7ff";
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    // การ set canvas.width = ล้าง bitmap — ตอน reduced-motion ไม่มี rAF loop มาวาดซ้ำ
    // เพราะฉะนั้น resize ต้องวาดใหม่เองเสมอ
    const onResize = () => {
      resize();
      if (reduced) draw(0);
    };
    resize();
    draw(0);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 h-full w-full pointer-events-none"
    />
  );
}

function LessonItem({ lesson, selected, onSelect }: {
  lesson: Lesson;
  selected: boolean;
  onSelect: (l: Lesson) => void;
}) {
  return (
    <div
      onClick={() => onSelect(lesson)}
      className={[
        "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-all",
        "bg-[#101b29]/90 hover:bg-[#0c1420] hover:border-[#4dc4ff4d] hover:shadow-[0_0_16px_-8px_rgba(77,196,255,.6)]",
        selected
          ? "border-[#4dc4ff] bg-[#4dc4ff14]"
          : lesson.num === "01"
            ? "border-[#4ae08a]"
            : "border-[#223349]",
      ].join(" ")}
    >
      <span className={[
        "font-display font-bold text-[11px] w-6 shrink-0",
        selected ? "text-[#4dc4ff]" : lesson.num === "01" ? "text-[#4ae08a]" : "text-[#6f8ba0]",
      ].join(" ")}>{lesson.num}</span>
      <img
        src={asset(`previews/${lesson.id}.png`)}
        alt={`ตัวอย่างหน้าจอบท ${lesson.num} ${lesson.name}`}
        width={56}
        height={84}
        loading="lazy"
        className="w-14 h-[84px] shrink-0 rounded-md border border-[#223349] bg-black object-cover"
      />
      <div className="min-w-0">
        <div className="text-sm font-medium text-[#e8f2fa]">{lesson.name}</div>
        <div className="text-[11px] text-[#6f8ba0] mt-0.5">{lesson.desc}</div>
      </div>
      <a
        href={asset(`lessons/${lesson.id}/`)}
        onClick={(e) => e.stopPropagation()}
        className="ml-auto shrink-0 flex flex-col items-end gap-0.5 text-right"
      >
        <span className="font-mono text-[10px] text-[#6f8ba0]">{lesson.size}</span>
        <span className="font-display text-[9px] text-[#4dc4ff] hover:underline">ดู YAML →</span>
      </a>
    </div>
  );
}

function DevicePreview({ lesson }: { lesson: Lesson | null }) {
  return (
    <div className="flex justify-center">
      <div className="relative">
        <span aria-hidden="true" className="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-[#4dc4ff59] rounded-tl-sm" />
        <span aria-hidden="true" className="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-[#4dc4ff59] rounded-tr-sm" />
        <span aria-hidden="true" className="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-[#4dc4ff59] rounded-bl-sm" />
        <span aria-hidden="true" className="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-[#4dc4ff59] rounded-br-sm" />
        <div className="rounded-[22px] p-2.5 bg-gradient-to-b from-[#131a2c] to-[#05070d] border border-[#22304d] shadow-[0_30px_60px_-20px_rgba(0,0,0,.8),0_0_70px_-18px_rgba(77,196,255,.3),inset_0_1px_0_rgba(255,255,255,.06)]">
          <div className="flex justify-center items-center gap-1.5 pb-1.5 pt-0.5">
            <span className="w-9 h-[3px] rounded bg-white/10" />
            <i className="w-1 h-1 rounded-full bg-white/15" />
            <span className="w-9 h-[3px] rounded bg-white/10" />
          </div>
          <div className="relative w-[240px] h-[360px] bg-black rounded-[10px] overflow-hidden flex flex-col items-center justify-center shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]">
            {lesson ? (
              <img
                src={asset(`previews/${lesson.id}.png`)}
                alt={`หน้าจอบท ${lesson.num} ${lesson.name}`}
                width={240}
                height={360}
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <div className="text-[#6f8ba0] text-[10px] text-center font-mono">
                เลือกบทเรียน<br />เพื่อดู preview
              </div>
            )}
            <div aria-hidden="true" className="kru-scan absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-transparent via-[#4dc4ff1a] to-transparent pointer-events-none" />
          </div>
          <div className="text-center mt-1.5 font-display text-[8px] tracking-[.15em] uppercase text-[#7e8794]">
            Guition JC3248W535 · AXS15231 QSPI
          </div>
        </div>
      </div>
    </div>
  );
}

function FlashDock({ lesson }: { lesson: Lesson | null }) {
  return (
    <div className="flex flex-col items-center mt-4">
      <div className="text-center">
        <div className="font-semibold text-[#4dc4ff] text-sm">
          {lesson ? `${lesson.num} — ${lesson.name}` : "ยังไม่ได้เลือกบท"}
        </div>
        <div className="font-mono text-[10px] text-[#6f8ba0] mt-0.5">
          {lesson ? `${lesson.size} · JC3248W535` : "JC3248W535 · 320×480"}
        </div>
      </div>
      {hasSerial && lesson ? (
        <esp-web-install-button manifest={asset(`manifests/${lesson.id}.json`)}>
          <button
            slot="activate"
            className="kru-pulse mt-3 px-9 py-3 rounded-[10px] font-display font-bold text-sm tracking-wider text-[#060a0f] bg-gradient-to-br from-[#4dc4ff] to-[#2a9fe8] hover:-translate-y-px transition-all cursor-pointer border-0"
          >
            ⚡ Quick Flash
          </button>
        </esp-web-install-button>
      ) : (
        <button
          disabled
          className="mt-3 px-9 py-3 rounded-[10px] font-display font-bold text-sm tracking-wider text-[#060a0f] bg-gradient-to-br from-[#4dc4ff] to-[#2a9fe8] opacity-30 cursor-not-allowed border-0"
        >
          ⚡ Quick Flash
        </button>
      )}
      {!hasSerial && (
        <div className="mt-2 text-[11px] text-[#ff6050] text-center">
          เบราว์เซอร์นี้ไม่รองรับ Web Serial — ใช้ Chrome/Edge บนคอมพิวเตอร์
        </div>
      )}
      <div className="mt-3 text-[10px] text-[#6f8ba0] text-center leading-relaxed">
        ไฟล์เป็น .factory.bin (รวม bootloader + partition) · เสียบ USB-C พอร์ต native<br />
        ถ้าไม่เจอบอร์ด: กด BOOT ค้าง แตะ RESET · ใช้เวลา ~30 วินาที
      </div>
    </div>
  );
}

function Specs() {
  const rows: [string, string][] = [
    ["Board", "JC3248W535"],
    ["MCU", "ESP32-S3"],
    ["Display", "AXS15231B QSPI"],
    ["Res", "320×480"],
    ["Touch", "AXS15231 I2C"],
    ["USB", "303A:1001"],
  ];
  return (
    <div className="px-3.5 py-3 bg-[#0f1822]/85 border border-[#1a2838] rounded-lg">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="font-display font-semibold text-[9px] tracking-[.25em] uppercase text-[#4dc4ff]">Telemetry</span>
        <span aria-hidden="true" className="flex-1 h-px bg-[#1a2838]" />
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#4ae08a] shadow-[0_0_6px_rgba(74,224,138,.8)]" />
      </div>
      <dl className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-[#6f8ba0]">{k}</dt>
            <dd className="text-[#a8c0d0] font-medium font-mono text-[10.5px]">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}

export default function App({ initialId }: { initialId?: string }) {
  const [selected, setSelected] = useState<Lesson | null>(
    initialId ? LESSONS.find((l) => l.id === initialId) ?? null : null
  );

  return (
    <>
      <Starfield />
      <div className="relative max-w-[1200px] mx-auto px-6 py-8 pb-12">
        <header className="text-center mb-8">
          <div className="font-display font-semibold text-[9.5px] tracking-[.22em] uppercase text-[#4dc4ff] mb-1.5">
            ◢ ESP32 × Display — 16 Lessons ◣
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#e8f2fa] [text-shadow:0_0_28px_rgba(77,196,255,.4)]">
            Kru32 Oracle Web Flasher
          </h1>
          <p className="text-[#6f8ba0] text-[13px] mt-1">
            เลือกบท → ดู preview → เสียบ USB → Quick Flash ·{" "}
            <a
              className="text-[#4dc4ff] no-underline hover:underline"
              href="https://github.com/the-oracle-keeps-the-human-human/kru32-oracle"
              target="_blank" rel="noopener noreferrer"
            >
              Source on GitHub
            </a>
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-8 md:gap-12 items-start">
          <div className="flex flex-col gap-7">
            {LEVELS.map((lv) => {
              const group = LESSONS.filter((l) => l.level === lv.key)
                .sort((a, b) => a.num.localeCompare(b.num));
              if (!group.length) return null;
              return (
                <div key={lv.key}>
                  <div className={`font-display font-semibold text-[9.5px] tracking-[.12em] uppercase pb-1.5 border-b ${lv.color}`}>
                    {lv.label}
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    {group.map((l) => (
                      <LessonItem key={l.id} lesson={l} selected={selected?.id === l.id} onSelect={setSelected} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="md:sticky md:top-6 order-first md:order-none flex flex-col gap-8">
            <div>
              <DevicePreview lesson={selected} />
              <FlashDock lesson={selected} />
            </div>
            <Specs />
          </div>
        </div>

        <footer className="mt-14 pt-5 border-t border-[#1a2838] text-center text-[11px] text-[#6f8ba0]">
          kru32-oracle ·{" "}
          <a
            className="text-[#4dc4ff]"
            href="https://github.com/the-oracle-keeps-the-human-human/kru32-oracle"
            target="_blank" rel="noopener noreferrer"
          >
            the-oracle-keeps-the-human-human/kru32-oracle
          </a>{" "}
          · กลั่นจาก 41.6 ชม. 186 commits และจอจริง 8 ตัวของ esp32-oracle
          <span className="block mt-2 text-[#4a6578]">
            🤖 หน้านี้สร้างและดูแลโดย kru32-oracle (AI) — ไม่ใช่มนุษย์
          </span>
        </footer>
      </div>
    </>
  );
}
