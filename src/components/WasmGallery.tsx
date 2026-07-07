import React, { useEffect, useMemo, useState } from "react";
import { WASM_APPS } from "../data/apps";
import type { WasmApp } from "../data/types";
import WasmRunner from "./WasmRunner";

// pet packs ship these GIF states in characters/<id>/ — WasmRunner probes + shows the ones present
const PET_STATES = ["idle", "busy", "attention", "celebrate", "dizzy", "sleep", "heart"];
const isPet = (app: WasmApp) => (app.kind ?? "").includes("pet");

// Astro/Vite injects the Pages base path (e.g. "/kru32-oracle/").
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const asset = (path: string) => {
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  const clean = path.replace(/^public\//, "").replace(/^\/+/, "");
  if (BASE && (path === BASE || path.startsWith(`${BASE}/`))) return path;
  return `${BASE}/${clean}`;
};

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

function manifestFor(app: WasmApp) {
  return asset(app.manifest ?? `wasm-apps/${app.id}/manifest.json`);
}

function appGroups(apps: WasmApp[]) {
  const flashable = apps.filter((app) => app.flashable);
  const sourceOnly = apps.filter((app) => !app.flashable);
  return [
    { key: "flashable", label: "Flashable — พร้อมลงบอร์ด", color: "text-[#4ae08a]", apps: flashable },
    { key: "gallery", label: "Source gallery — ตัวละครและซอร์ส", color: "text-[#f6c544]", apps: sourceOnly },
  ].filter((group) => group.apps.length);
}

/* การ์ด WASM = preview ใส่กรอบทองแบบ Van Gogh gallery; คลิกเพื่อเปิด lightbox */
function WasmCard({ app, onOpen }: { app: WasmApp; onOpen: (app: WasmApp) => void }) {
  return (
    <button
      onClick={() => onOpen(app)}
      className="group relative text-left rounded-[10px] p-[3px] transition-all duration-300 cursor-pointer
        bg-gradient-to-b from-[#8a6a2e] to-[#3a2c14] hover:-translate-y-1.5
        shadow-[0_10px_30px_-14px_rgba(0,0,0,.8)] hover:shadow-[0_16px_40px_-12px_rgba(246,197,68,.4)]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f6c544]"
    >
      <div className="rounded-[8px] overflow-hidden bg-black relative">
        <img
          src={asset(app.preview)}
          alt={`พรีวิว WASM app ${app.name}`}
          width={240}
          height={360}
          loading="lazy"
          className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-[#08152e]/95 via-[#08152e]/80 to-transparent pt-8">
          <div className="flex items-baseline gap-1.5">
            <span className={app.flashable ? "font-display font-semibold text-[11px] text-[#7fe0a6]" : "font-display font-semibold text-[11px] text-[#f6c544]"}>
              {app.tag}
            </span>
            <span className="font-display font-semibold text-[13px] text-[#f4efe0] truncate">{app.name}</span>
          </div>
          <div className="text-[10px] text-[#c9bfa6] truncate mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {app.blurb}
          </div>
        </div>
        {app.flashable ? (
          <span className="absolute top-2 left-2 font-display text-[9px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-[#7fe0a6] text-[#08152e]">
            Flash ได้
          </span>
        ) : (
          <span className="absolute top-2 left-2 font-display text-[9px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-[#f6c544] text-[#1a1204]">
            Source
          </span>
        )}
        {app.kind && (
          <span className="absolute top-2 right-2 font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/55 text-[#c9bfa6]">
            {app.kind}
          </span>
        )}
      </div>
    </button>
  );
}

/* Lightbox — preview ใหญ่ + Flash สำหรับ app ที่ flashable, source link สำหรับ gallery-only */
function WasmLightbox({ app, onClose }: { app: WasmApp; onClose: () => void }) {
  // Once a flash starts, tear down the live WASM preview — running the gif decoder + canvas
  // animation loop while esp-web-tools drives WebSerial/USB starves the browser and can crash it
  // (the device re-enumerates each flash). Fall back to the static preview during/after flashing.
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050d1e]/80 backdrop-blur-md"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[560px] max-h-[92vh] overflow-y-auto rounded-2xl border border-[#2d4a2f]
          bg-[#0e2145]/95 shadow-[0_40px_90px_-24px_rgba(0,0,0,.85)] p-6 flex flex-col items-center"
      >
        <button
          onClick={onClose}
          aria-label="ปิด"
          className="absolute top-3 right-3 w-8 h-8 rounded-full grid place-items-center text-[#c9bfa6] hover:text-[#f6c544] hover:bg-white/5 transition-colors"
        >
          ✕
        </button>

        {isPet(app) && !flashing ? (
          /* pet pack → live in-browser WASM preview (self-framed, decoded by the on-device gif decoder) */
          <WasmRunner appId={app.id} states={PET_STATES} />
        ) : (
          <div className="rounded-[20px] p-2.5 bg-gradient-to-b from-[#8a6a2e] to-[#2a2012] shadow-[0_20px_50px_-18px_rgba(0,0,0,.8),0_0_60px_-14px_rgba(246,197,68,.3)]">
            <div className="relative w-[228px] h-[342px] bg-black rounded-[11px] overflow-hidden">
              <img
                src={asset(app.preview)}
                alt={`พรีวิว WASM app ${app.name}`}
                width={228}
                height={342}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div aria-hidden="true" className="kru-scan absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-transparent via-[#f6c5441a] to-transparent pointer-events-none" />
            </div>
          </div>
        )}

        <div className="text-center mt-4">
          <div className="font-display text-[10px] tracking-[.2em] uppercase text-[#f6c544]">
            {app.tag}{app.kind ? ` · ${app.kind}` : ""}
          </div>
          <h2 className="font-display text-xl font-bold text-[#f4efe0] mt-0.5">{app.name}</h2>
          <p className="text-[#c9bfa6] text-[13px] mt-1 max-w-[42ch]">{app.blurb}</p>
          <div className="font-mono text-[10px] text-[#8a9bbd] mt-1">ESP32 WASM · JC3248W535</div>
        </div>

        {app.flashable ? (
          <>
            <esp-web-install-button manifest={manifestFor(app)}>
              <button
                slot="activate"
                onClick={() => setFlashing(true)}
                className="kru-pulse mt-4 px-9 py-3 rounded-[10px] font-display font-bold text-sm tracking-wide text-[#1a1204] bg-gradient-to-br from-[#f6c544] to-[#e0a838] hover:-translate-y-px transition-transform cursor-pointer border-0"
              >
                ⚡ Quick Flash
              </button>
            </esp-web-install-button>
            {!hasSerial && (
              <div className="mt-3 text-[11px] text-[#ff8a6b] text-center">
                เบราว์เซอร์นี้ flash ไม่ได้ — ใช้เบราว์เซอร์ Chromium — Chrome / Edge / Comet บนคอมพิวเตอร์
              </div>
            )}
          </>
        ) : (
          <a
            href={app.submissionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 px-7 py-3 rounded-[10px] font-display font-bold text-sm tracking-wide text-[#1a1204] bg-[#f6c544] hover:bg-[#ffd86b] hover:-translate-y-px transition-all"
          >
            Source on GitHub →
          </a>
        )}

        <div className="mt-3 flex items-center gap-4 text-[11px]">
          <a
            href={app.submissionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-[#f6c544] hover:underline"
          >
            ดู submission →
          </a>
        </div>
        <div className="mt-3 text-[10px] text-[#8a9bbd] text-center leading-relaxed">
          {app.flashable ? (
            <>
              WASM app manifest · เสียบ USB-C พอร์ต native · ~30 วินาที<br />
              ถ้า Chrome บน macOS crash ตอน flash → เปลี่ยนไป Microsoft Edge
            </>
          ) : (
            <>
              Gallery-only ตอนนี้ยังไม่มี manifest flashable<br />
              เปิดซอร์สเพื่อดู character assets และโค้ดของ submission นี้
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WasmGallery({ apps = WASM_APPS as WasmApp[] }: { apps?: WasmApp[] } = {}) {
  const [open, setOpen] = useState<WasmApp | null>(null);
  const groups = useMemo(() => appGroups(apps), [apps]);

  if (!apps.length) {
    return (
      <section className="rounded-[10px] border border-[#2a3a5c] bg-[#08152e]/80 p-6 text-center">
        <h2 className="font-display text-lg font-bold text-[#f4efe0]">ยังไม่มี WASM apps</h2>
        <p className="mt-1 text-sm text-[#c9bfa6]">รอข้อมูลจาก src/data/apps.ts แล้วแกลเลอรีนี้จะเติมอัตโนมัติ</p>
      </section>
    );
  }

  return (
    <>
      {/* ── ทดสอบบอร์ด — flash แล้วจอโชว์ WiFi info ── */}
      <section className="mb-9">
        <h2 className="font-display text-[13px] font-semibold tracking-wide pb-2 mb-4 border-b border-[#2a3a5c] text-[#4dc4ff]">
          ทดสอบบอร์ด — First Flash
        </h2>
        <div className="flex flex-col sm:flex-row items-start gap-5 max-w-[600px]">
          {/* Screen preview — จำลองหน้าจอบอร์ด 320×480 ย่อส่วน */}
          <div className="shrink-0 rounded-[14px] p-[3px] bg-gradient-to-b from-[#8a6a2e] to-[#3a2c14] shadow-[0_10px_30px_-14px_rgba(0,0,0,.8)]">
            <div className="w-[160px] h-[240px] rounded-[10px] bg-[#0B1B39] overflow-hidden px-2.5 py-3 flex flex-col" style={{fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace",fontSize:0}}>
              <div className="text-[10px] font-bold text-[#F6C544] text-center leading-tight">Kru32 Oracle</div>
              <div className="text-[7px] text-[#00FF7F] text-center mt-0.5 leading-tight">● Connected</div>
              <div className="mt-1.5 rounded-[6px] bg-[#0E2145] border border-[#22304D] px-2 py-1.5 flex-1 grid grid-rows-5 gap-0">
                {([
                  ["SSID", "kru32-dev", "#F6C544"],
                  ["IP", "192.168.1.x", "#4DC4FF"],
                  ["MAC", "AA:BB:CC:DD:EE", "#E8E2D0"],
                  ["Signal", "-45 dBm", "#FFD27F"],
                  ["Uptime", "0h 2m 30s", "#00FF7F"],
                ] as const).map(([label, val, color]) => (
                  <div key={label} className="flex flex-col justify-center">
                    <span className="text-[6px] leading-none text-[#6b7fa0]">{label}</span>
                    <span className="text-[9px] leading-tight font-medium" style={{color}}>{val}</span>
                  </div>
                ))}
              </div>
              <div className="text-[6px] text-[#3A4A6C] text-center mt-1 leading-none">JC3248W535</div>
            </div>
          </div>

          {/* Info + flash button */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="font-display text-[15px] font-bold text-[#f4efe0]">WiFi Placeholder</div>
            <p className="text-[12px] text-[#c9bfa6] mt-1 leading-relaxed">
              Flash แล้วจอโชว์ WiFi status, IP, MAC, signal, uptime<br/>
              ยืนยันว่าบอร์ดทำงาน + ต่อ WiFi ได้
            </p>
            <div className="mt-3">
              {hasSerial ? (
                <esp-web-install-button manifest={asset("manifests/placeholder.json")}>
                  <button slot="activate" className="px-6 py-2.5 rounded-[8px] font-display font-bold text-[12px] text-[#1a1204] bg-gradient-to-br from-[#4dc4ff] to-[#2a88cc] hover:-translate-y-px transition-transform cursor-pointer border-0">
                    ⚡ Flash ทดสอบ
                  </button>
                </esp-web-install-button>
              ) : (
                <span className="text-[11px] text-[#ff8a6b]">ใช้ Chromium (Chrome/Edge/Comet) บนคอมพิวเตอร์</span>
              )}
            </div>
            <div className="mt-2 text-[10px] text-[#5f7091]">
              Improv Serial + Captive Portal + Fallback AP
            </div>
          </div>
        </div>

        {/* ESPHome YAML source */}
        <details className="mt-4 max-w-[600px]">
          <summary className="text-[11px] text-[#4dc4ff] cursor-pointer hover:underline font-display">
            📄 ดู ESPHome YAML
          </summary>
          <pre className="mt-2 rounded-lg bg-[#0b1b39] border border-[#22304d] p-3 text-[10px] leading-[1.6] text-[#c9bfa6] overflow-x-auto max-h-[320px] overflow-y-auto"><code>{`wifi:
  ssid: kru32-dev
  password: kru32pass123
  ap:
    ssid: "Kru32-Setup"
    password: "kru32setup"

improv_serial:
captive_portal:

sensor:
  - platform: uptime
    name: "Uptime"
    id: uptime_sensor
  - platform: wifi_signal
    name: "WiFi Signal"
    id: wifi_rssi

text_sensor:
  - platform: wifi_info
    ip_address:
      id: wifi_ip
    ssid:
      id: wifi_ssid_info
    mac_address:
      id: wifi_mac

lvgl:
  pages:
    - id: info_page
      bg_color: 0x0B1B39
      widgets:
        - label:
            text: "Kru32 Oracle"
            text_color: 0xF6C544
        # SSID / IP / MAC / Signal / Uptime
        # ดู YAML เต็มที่ GitHub`}</code></pre>
        </details>
      </section>

      <div className="flex flex-col gap-9">
        {groups.map((group) => (
          <section key={group.key}>
            <h2 className={`font-display text-[13px] font-semibold tracking-wide pb-2 mb-4 border-b border-[#2a3a5c] ${group.color}`}>
              {group.label}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {group.apps.map((app) => (
                <WasmCard key={app.id} app={app} onOpen={setOpen} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {open && <WasmLightbox app={open} onClose={() => setOpen(null)} />}
    </>
  );
}
