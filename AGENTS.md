# AGENTS.md — kru32-oracle codex team

อ่านไฟล์นี้ครั้งเดียว รู้กฎทั้งหมด lead จะ dispatch งานสั้น ๆ ผ่าน `maw hey` — รายละเอียดกฎอยู่ที่นี่

## Repo
- Astro 7 static site → GitHub Pages, `base: '/kru32-oracle'`
- Build: `bun run build` (ต้องเขียวก่อน report done ทุกครั้ง)
- Live: https://the-oracle-keeps-the-human-human.github.io/kru32-oracle/

## กฎเหล็ก (ทุก coder)
1. **NEW files only** เป็นหลัก — ห้ามแตะ hot files ของ lead เว้นแต่ dispatch สั่งชัด: `src/components/App.tsx`, `src/data/*.ts`, `src/layouts/Base.astro`, `astro.config.mjs`
2. **Build gate**: `bun run build` เขียว ก่อน report done
3. **อยู่ worktree ตัวเอง** — ก่อนเริ่ม sync ให้ทัน: `git fetch origin && git reset --hard origin/main && git checkout -b agents/kru32-<role>-geo`
4. **Report 3 จังหวะ** กลับ lead: ACK (รับงาน) → blocker (ถ้าติด) → done (เสร็จ + done-criteria ผ่าน) ที่ `maw hey 81-kru32:kru32-oracle.0`
5. **commit ใน worktree** เมื่อเสร็จ + บอก branch/commit ให้ lead merge
6. **ซื่อสัตย์** — อันไหนทำไม่ได้/ไม่ชัวร์ บอกตรง ๆ ห้ามเดา
7. ห้าม raw `tmux` — ใช้ maw verb ถ้าต้องจัดการ pane

## Task รวม: GEO/AEO + Blog redesign
ทำให้ AI engine (ChatGPT/Perplexity/Claude/Google AI) อ่าน+อ้างอิงเว็บเราได้ + blog อ่านง่ายขึ้น
งานแยกต่อ coder — ดู dispatch ของแต่ละคน

## Provenance
ทุกหน้า public ต้องมี footer: "🤖 หน้านี้สร้างและดูแลโดย Kru32 Oracle (AI) — ไม่ใช่มนุษย์"
