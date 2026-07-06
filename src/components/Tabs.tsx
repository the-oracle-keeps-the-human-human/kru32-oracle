import { useRef, type KeyboardEvent } from "react";

export type TabItem<T extends string = string> = {
  key: T;
  label: string;
};

export type TabsProps<T extends string = string> = {
  tabs: readonly TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  ariaLabel?: string;
  className?: string;
};

const tabBase =
  "relative inline-flex min-h-11 items-center justify-center rounded-[10px] px-4 py-2 " +
  "font-display text-[13px] font-semibold leading-6 tracking-wide transition-colors duration-200 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f6c544] focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-[#0b1b39] disabled:cursor-not-allowed disabled:opacity-60";

const tabActive =
  "bg-[#f6c544] text-[#1a1204] hover:bg-[#ffda6b] aria-selected:text-[#1a1204]";

const tabInactive =
  "border border-[#2a3a5c] bg-[#0e2145]/88 text-[#e8e2d0] hover:border-[#8a6a2e] " +
  "hover:bg-[#16284f] hover:text-[#f6c544]";

export function Tabs<T extends string = string>({
  tabs,
  active,
  onChange,
  ariaLabel = "เลือกหมวดหมู่",
  className = "",
}: TabsProps<T>) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = tabs.findIndex((tab) => tab.key === active);
  const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const moveTo = (index: number) => {
    if (!tabs.length) return;
    const next = (index + tabs.length) % tabs.length;
    onChange(tabs[next].key);
    window.requestAnimationFrame(() => tabRefs.current[next]?.focus());
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!tabs.length) return;

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveTo(currentIndex - 1);
        break;
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveTo(currentIndex + 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(tabs.length - 1);
        break;
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex max-w-full flex-wrap items-center gap-2 rounded-[14px] border border-[#22304d] bg-[#08152e]/78 p-1.5 ${className}`}
    >
      {tabs.map((tab, index) => {
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={index === currentIndex ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={onKeyDown}
            className={`${tabBase} ${selected ? tabActive : tabInactive}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
