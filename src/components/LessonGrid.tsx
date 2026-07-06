import React, { useEffect, useState } from "react";
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
            เบราว์เซอร์นี้ flash ไม่ได้ — ใช้เบราว์เซอร์ Chromium — Chrome / Edge / Comet บนคอมพิวเตอร์
          </div>
        )}

        <div className="mt-3 flex items-center gap-4 text-[11px]">
          <a href={asset(`lessons/${lesson.id}/`)} className="font-display text-[#f6c544] hover:underline">ดู YAML เต็ม →</a>
        </div>
        <div className="mt-3 text-[10px] text-[#8a9bbd] text-center leading-relaxed">
          .factory.bin (bootloader + partition) · เสียบ USB-C พอร์ต native · ~30 วินาที<br />
          แก้ <span className="font-mono text-[#c9bfa6]">wifi: ssid/password</span> ใน YAML เป็นของคุณก่อน flash
        </div>
        <div className="mt-2 text-[10px] text-[#8a9bbd] text-center leading-relaxed">
          ใช้ <b className="text-[#c9bfa6]">Microsoft Edge</b> จะเสถียรสุด (WebSerial)<br />
          ถ้า Chrome บน macOS crash ตอน flash → เปลี่ยนไป Edge · flash จบแล้วปิดหน้าได้เลย
        </div>
      </div>
    </div>
  );
}

export default function LessonGrid({ initialId }: { initialId?: string }) {
  const [open, setOpen] = useState<Lesson | null>(
    initialId ? LESSONS.find((l) => l.id === initialId) ?? null : null
  );

  return (
    <>
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

      {open && <Lightbox lesson={open} onClose={() => setOpen(null)} />}
    </>
  );
}
