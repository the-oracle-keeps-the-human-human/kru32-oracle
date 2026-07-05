import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { LESSONS, LEVELS, type Lesson } from "./lessons";

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

function LessonItem({ lesson, selected, onSelect }: {
  lesson: Lesson;
  selected: boolean;
  onSelect: (l: Lesson) => void;
}) {
  return (
    <div
      onClick={() => onSelect(lesson)}
      className={[
        "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer border transition-all",
        "bg-[#0f1822] hover:bg-[#0a1018] hover:border-[#4dc4ff4d]",
        selected
          ? "border-[#4dc4ff] bg-[#4dc4ff0f] shadow-[inset_3px_0_0_#4dc4ff]"
          : lesson.num === "01"
            ? "border-[#4ae08a]"
            : "border-[#1a2838]",
      ].join(" ")}
    >
      <span className={[
        "font-mono font-bold text-[11px] w-6 shrink-0",
        selected ? "text-[#4dc4ff]" : lesson.num === "01" ? "text-[#4ae08a]" : "text-[#4a6578]",
      ].join(" ")}>{lesson.num}</span>
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-[#e8f2fa]">{lesson.name}</div>
        <div className="text-[11px] text-[#4a6578]">{lesson.desc}</div>
      </div>
      <span className="font-mono text-[10px] text-[#4a6578] ml-auto shrink-0">{lesson.size}</span>
    </div>
  );
}

function DevicePreview({ lesson }: { lesson: Lesson | null }) {
  return (
    <div className="flex justify-center">
      <div className="rounded-[22px] p-2.5 bg-gradient-to-b from-[#1c1e26] to-[#08090c] shadow-[0_30px_60px_-20px_rgba(0,0,0,.7),inset_0_1px_0_rgba(255,255,255,.06)]">
        <div className="flex justify-center items-center gap-1.5 pb-1.5 pt-0.5">
          <span className="w-9 h-[3px] rounded bg-white/10" />
          <i className="w-1 h-1 rounded-full bg-white/15" />
          <span className="w-9 h-[3px] rounded bg-white/10" />
        </div>
        <div className="w-[240px] h-[360px] bg-black rounded-[10px] overflow-hidden flex flex-col items-center justify-center p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]">
          {lesson ? (
            <div
              className="w-full h-full flex flex-col items-center justify-center text-center font-mono text-[11px] leading-snug"
              dangerouslySetInnerHTML={{ __html: lesson.preview }}
            />
          ) : (
            <div className="text-[#4a6578] text-[10px] text-center font-mono">
              เลือกบทเรียน<br />เพื่อดู preview
            </div>
          )}
        </div>
        <div className="text-center mt-1.5 font-mono text-[8px] tracking-[.15em] uppercase text-[#8a8a9366]">
          Guition JC3248W535 · AXS15231 QSPI
        </div>
      </div>
    </div>
  );
}

function FlashDock({ lesson }: { lesson: Lesson | null }) {
  return (
    <div className="flex flex-col items-center gap-1.5 mt-4">
      <div className="font-semibold text-[#4dc4ff] text-sm">
        {lesson ? `${lesson.num} — ${lesson.name}` : "ยังไม่ได้เลือกบท"}
      </div>
      <div className="font-mono text-[10px] text-[#4a6578]">
        {lesson ? `${lesson.size} · JC3248W535` : "JC3248W535 · 320×480"}
      </div>
      {hasSerial && lesson ? (
        <esp-web-install-button manifest={`manifests/${lesson.id}.json`}>
          <button
            slot="activate"
            className="px-9 py-2.5 rounded-[10px] font-bold text-sm tracking-wide text-[#060a0f] bg-gradient-to-br from-[#4dc4ff] to-[#2a9fe8] hover:-translate-y-px hover:shadow-[0_6px_20px_-4px_rgba(77,196,255,.35)] transition-all cursor-pointer border-0"
          >
            ⚡ Quick Flash
          </button>
        </esp-web-install-button>
      ) : (
        <button
          disabled
          className="px-9 py-2.5 rounded-[10px] font-bold text-sm text-[#060a0f] bg-gradient-to-br from-[#4dc4ff] to-[#2a9fe8] opacity-30 cursor-not-allowed border-0"
        >
          ⚡ Quick Flash
        </button>
      )}
      {!hasSerial && (
        <div className="text-[11px] text-[#ff6050] text-center">
          เบราว์เซอร์นี้ไม่รองรับ Web Serial — ใช้ Chrome/Edge บนคอมพิวเตอร์
        </div>
      )}
      <div className="text-[10px] text-[#4a6578] text-center leading-relaxed">
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
    <dl className="mt-4 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] px-3 py-2.5 bg-[#0f1822] rounded-lg">
      {rows.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-[#4a6578]">{k}</dt>
          <dd className="text-[#a8c0d0] font-medium">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function App() {
  const [selected, setSelected] = useState<Lesson | null>(null);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 pb-12">
      <header className="text-center mb-8">
        <div className="font-mono font-semibold text-[9.5px] tracking-[.22em] uppercase text-[#4dc4ff] mb-1.5">
          ESP32 × Display — 16 Lessons
        </div>
        <h1 className="text-2xl font-bold text-[#e8f2fa]">Kru32 Oracle Web Flasher</h1>
        <p className="text-[#4a6578] text-[13px] mt-1">
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

      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6 items-start">
        <div>
          {LEVELS.map((lv) => {
            const group = LESSONS.filter((l) => l.level === lv.key)
              .sort((a, b) => a.num.localeCompare(b.num));
            if (!group.length) return null;
            return (
              <div key={lv.key}>
                <div className={`font-mono font-semibold text-[9.5px] tracking-[.12em] uppercase py-1.5 mt-3 border-b ${lv.color}`}>
                  {lv.label}
                </div>
                <div className="flex flex-col gap-1.5 mt-1.5">
                  {group.map((l) => (
                    <LessonItem key={l.id} lesson={l} selected={selected?.id === l.id} onSelect={setSelected} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="md:sticky md:top-4 order-first md:order-none">
          <DevicePreview lesson={selected} />
          <FlashDock lesson={selected} />
          <Specs />
        </div>
      </div>

      <footer className="mt-10 pt-4 border-t border-[#1a2838] text-center text-[11px] text-[#4a6578]">
        kru32-oracle ·{" "}
        <a
          className="text-[#4dc4ff]"
          href="https://github.com/the-oracle-keeps-the-human-human/kru32-oracle"
          target="_blank" rel="noopener noreferrer"
        >
          the-oracle-keeps-the-human-human/kru32-oracle
        </a>{" "}
        · กลั่นจาก 41.6 ชม. 186 commits และจอจริง 8 ตัวของ esp32-oracle
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
