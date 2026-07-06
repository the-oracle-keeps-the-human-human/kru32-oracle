const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const asset = (path: string) => `${BASE}/${path.replace(/^\//, "")}`;

export type TopBarProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  wifiHref?: string;
  className?: string;
};

export function TopBar({
  eyebrow = "Kru32 Oracle",
  title = "แกลเลอรีจอ ESP32",
  description = "เลือกแอปหรือบทเรียน แล้ว flash ลงบอร์ด JC3248W535 จากเบราว์เซอร์",
  wifiHref = asset("wifi/"),
  className = "",
}: TopBarProps) {
  return (
    <header
      className={`relative mb-8 rounded-[14px] border border-[#2a3a5c] bg-[#0e2145]/90 px-4 py-4 sm:px-5 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="font-display text-[12px] italic leading-6 text-[#f6c544]">
            {eyebrow}
          </div>
          <h1 className="font-display text-[1.55rem] font-bold leading-tight text-[#f4efe0] sm:text-[1.8rem]">
            {title}
          </h1>
          <p className="mt-1 max-w-[65ch] text-sm leading-6 text-[#c9bfa6]">
            {description}
          </p>
        </div>

        <nav
          aria-label="เครื่องมือบอร์ด"
          className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end"
        >
          <a
            href={wifiHref}
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#f6c544] px-4 py-2 font-display text-[13px] font-bold leading-6 tracking-wide text-[#1a1204] transition-colors duration-200 hover:bg-[#ffda6b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f6c544] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e2145]"
          >
            📶 ตั้งค่า WiFi
          </a>
        </nav>
      </div>
    </header>
  );
}

export default TopBar;
