# CLAUDE.md — kru32-oracle

Kru32 Oracle — เว็บ flasher + คอร์สสอน ESP32 display (Thai-first) สำหรับบอร์ด **Guition JC3248W535** (ESP32-S3 + AXS15231B 320×480 QSPI touch) board scope นี้บอร์ดเดียวเท่านั้น

**AI-run repo:** ทุกอย่างในนี้สร้าง+ดูแลโดย Kru32 Oracle (AI) ไม่ใช่มนุษย์

## Stack
- **Astro 7** static site → **GitHub Pages** (`base: '/kru32-oracle'`, `site: github.io`)
- React islands (`@astrojs/react`), Tailwind v4, `@astrojs/sitemap`
- Package manager: **bun** · Build: `bun run build` (= `sync-blog-md.ts && astro build`)
- Deploy: GitHub Actions on push ที่แตะ `src/** public/** astro.config package.json bun.lock deploy.yml`
- Live: https://the-oracle-keeps-the-human-human.github.io/kru32-oracle/

## กฎเหล็ก (NON-NEGOTIABLE)

1. **Rule 6 footer** ทุกหน้า public: `🤖 หน้านี้สร้างและดูแลโดย Kru32 Oracle (AI) — ไม่ใช่มนุษย์`
2. **`new_install_prompt_erase: false`** ใน manifest ทุกอัน — erase:true ทำ Chromium/WebSerial crash บน ESP32-S3 native USB
3. **Coding conventions** (ψ memory `coding-conventions`):
   - ห้ามใช้ `any` — TypeScript strict, explicit types
   - ห้ามใช้ fallback (`?? default` ที่ซ่อนข้อมูลหาย) — fail loud / conditional render
   - State management ใช้ **Zustand** (typed); cross-LAN sync = Zustand + transport (Yjs/WebSocket)
   - Data validation ใช้ **zod** (Astro Content Collections schema)
4. **Article byline** ทุกบทความ blog: `author` + `model` ใน frontmatter (โมเดลปัจจุบัน = **Opus 4.8**)
5. **maw verbs เท่านั้น** — ห้าม raw `tmux` (ใช้ `maw peek`, `maw tile`, `maw hey`) ถ้าไม่มี verb → ขอ maw-rs ทำ
6. **Provenance footer** ใน report/artifact: `[time] [oracle@machine] [session] [via] [org] [repo] [commit]` (time+commit จาก shell จริง)

## Blog (data/layout แยก — zod + Content Collections)
- **Data**: `src/content/blog/*.md` + schema `src/content.config.ts` (zod บังคับ field: title/description/date/tags/author/model)
- **Layout**: `src/layouts/Prose.astro` (`.kru-prose` styling + byline + download + Rule-6)
- **Render**: `src/pages/blog/[...slug].astro` (`getCollection` + `render`), index = `src/pages/blog/index.astro`
- **เขียนบทความใหม่**: `bun run new:post "ชื่อ" "tag1,tag2"` → สร้าง .md ครบ schema
- Markdown ดาวน์โหลดได้: `scripts/sync-blog-md.ts` copy .md/.mdx → `public/blog-md/`
- **MDX** (`@astrojs/mdx`): ไฟล์ `.mdx` แทรก component ในบทความได้ (เช่น `src/components/Callout.astro`) — schema zod เดิมใช้ได้ทั้ง .md/.mdx · ใช้ .mdx เฉพาะบทความที่ต้องการ interactive

## GEO/AEO (AI engine อ่าน+อ้างอิงได้)
`public/llms.txt` + `llms-full.txt` · `public/robots.txt` (allow GPTBot/ClaudeBot/PerplexityBot/Google-Extended/ChatGPT-User) · sitemap · JSON-LD (`src/components/StructuredData.astro`) · OG/canonical ใน `Base.astro`

## Firmware
เรา compile firmware เอง (ESPHome / IDF gif-wamr) ไม่ใช่ codex — mklittlefs params: `-s 3145728 -b 4096 -p 256` · placeholder YAML ที่ `lessons/00-placeholder/`

## Codex team (asset — ไม่ teardown)
- Charter: `ψ/teams/kru32-team.yaml` · Makefile: `make team-up/down/status/peek` (ครอบ maw verbs)
- Session `81-kru32`: window `kru32-oracle` (lead + assistant share-cwd + compile) + window `codex-team` (coder-1/2 + qa + designer, worktree แยก)
- Dispatch: **`maw hey` (message สั้น)** + spec ใน charter `prompt:` / AGENTS.md · done-criteria ตรวจได้ · peek loop
- ⚠️ `maw team up` ติด bug #258 (บังคับ --wt lead+assistant) — dry-run ก่อนเสมอ

## Security (public repo)
- commit/push public ได้ — **ห้าม leak MQTT/password จริง**
- WiFi literals `kru32-dev`/`kru32pass123`, OTA `kru32-ota-pass`, `kru32fallback` = ค่าสอนสาธารณะ (ตั้งใจ)
- Repo visibility + DNS + Pages settings = user-only
- Safety: ห้าม `rm -f`/`rm -rf` (ใช้ `mv /tmp`) · ห้าม force flags (`git pull --no-rebase` + merge)

## ค้างอยู่
- Custom domain `kru32.buildwithoracle.com` — `public/CNAME` ถือไว้ (ยัง commit) รอ Nat ตั้ง DNS + เปลี่ยน base เป็น `/` ตอน cutover
- Cross-LAN state management (Zustand+sync) — รอ scope/target
