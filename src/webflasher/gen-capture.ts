/**
 * สร้าง docs/_capture.html — เรนเดอร์ preview ของทุกบทเป็น tile 240x360
 * เรียงต่อกันแนวตั้ง (ไม่มีช่องว่าง) เพื่อให้ screenshot เดียวแล้ว crop เป็นรูปต่อบทได้
 * ใช้: bun run src/webflasher/gen-capture.ts
 */
import { LESSONS } from "./lessons";

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

await Bun.write("docs/_capture.html", html);
console.log(`wrote docs/_capture.html — ${LESSONS.length} tiles, order: ${LESSONS.map((l) => l.id).join(",")}`);
