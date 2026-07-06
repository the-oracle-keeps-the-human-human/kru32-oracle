import { useState } from "react";

/** ปุ่ม copy YAML — island เล็ก client:visible (เลี่ยง inline vanilla ตาม stack mandate) */
export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className="font-display text-[11px] font-semibold tracking-wide px-3 py-1.5 rounded-md border border-[#22304d] bg-[#101b29] text-[#4dc4ff] hover:border-[#4dc4ff4d] hover:bg-[#0c1420] transition-all cursor-pointer"
    >
      {copied ? "✓ คัดลอกแล้ว" : "⧉ คัดลอก YAML"}
    </button>
  );
}
