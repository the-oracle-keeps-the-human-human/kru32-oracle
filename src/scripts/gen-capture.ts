/**
 * DEV-ONLY — regenerate public/previews/<id>.png จาก preview HTML ใน lessons data
 * ไม่รันใน CI (PNG ที่ได้ commit ไว้แล้ว) — รันเองเมื่อแก้ preview:
 *
 *   bun run src/scripts/gen-capture.ts        # เขียน _capture.html (gitignored)
 *   # แล้ว screenshot strip 240x(360*N) + crop เป็น public/previews/<id>.png
 *   # (ลำดับ id ตาม LESSONS — ดู log ท้ายสคริปต์)
 */
import { LESSONS } from "../data/lessons";

const tiles = LESSONS.map(
  (l) => `<div class="tile" data-id="${l.id}">${l.preview}</div>`
).join("\n");

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  body { margin: 0; }
  .tile {
    width: 240px; height: 360px; background: #000;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 16px; box-sizing: border-box; overflow: hidden;
    font-family: ui-monospace, Menlo, monospace; font-size: 11px; line-height: 1.375;
  }
  @keyframes kru-spin { to { transform: rotate(360deg); } }
  .kru-spin { animation: kru-spin 1.5s linear infinite; }
  @keyframes kru-bounce { 0%,100% { transform: translateY(-70px); } 50% { transform: translateY(0); } }
  .kru-bounce { animation: kru-bounce .8s ease-in infinite; }
</style>
${tiles}`;

await Bun.write("_capture.html", html);
console.log(`wrote _capture.html — ${LESSONS.length} tiles`);
console.log(`crop order: ${LESSONS.map((l) => l.id).join(",")}`);
