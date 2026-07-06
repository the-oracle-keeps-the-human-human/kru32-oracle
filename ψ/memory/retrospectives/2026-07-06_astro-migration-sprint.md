# Sprint Retro: Astro Migration (kru32 web flasher)

> /oracle-plan sprint · 2026-07-06 · single-page bun build → Astro on GitHub Pages (Actions)
> DNA: 6 lenses (Archaeologist, Mechanic, Skeptic, User, Architect, Minimalist)

## Scorecard

| # | Task | สมมติฐาน | ตรงไหม | Surprise |
|---|------|----------|--------|----------|
| S1 | Baseline snapshot | ทุก endpoint 200, Pages=legacy | ✅ | 00-why-hard 404 (ยังไม่เคย deploy — ตรงคาด) |
| S2 | Scaffold + island split | astro build ผ่านเมื่อ App=client:only | ✅ | ไม่มี — build ผ่านรอบแรก |
| S3 | Assets → public/ | `../firmware` รอด byte-identical | ✅ | ไม่มี — sha256 ตรงเป๊ะทุกไฟล์ (Mechanic ทายแม่น) |
| S4 | index + BASE_URL | 0 broken imgs | ✅ | ไม่มี — click-probe สะอาด |
| S5 | หน้าต่อบท: YAML core | แก่นคือ YAML ไม่ใช่ shell | ✅ | Shiki highlight zero-JS ได้ฟรี |
| S6 | CI build-only | เขียวโดยไม่มี Chrome | ✅ | ไม่มี — PNG committed พอ |
| S7 | **Cutover** flip→Actions | downtime ≤1 build, rollback พร้อม | ⚠️ | **deploy พลาด "try again later" 2 ครั้ง** |
| S8 | Cleanup docs/ | docs = artifact ซ้ำ | ✅ | 404 หลอก (typo ในเทสต์เอง ไม่ใช่บั๊ก) |

## Summary
- **Matched: 7.5/8** — ทุกข้อตรงสมมติฐาน ยกเว้น S7 ที่ downtime pattern ต่างจากคาด
- Skeptic ทายถูกว่า cutover = risk #1 แต่ผิดที่ severity: ไม่ fatal เป็นแค่ transient

## Surprises (ของมีค่าที่สุด)
1. **Cutover "Deployment failed, try again later" ×2** — หลัง flip build_type=workflow, Pages backend ต้อง provision ~90s ก่อน deploy-pages จะสำเร็จ. build+artifact เขียวทุกครั้ง พลาดแค่ deploy API. **ครั้งที่ 3 (หลังรอ 90s) เขียว**
2. **เว็บ live ไม่ดับเลย** ระหว่าง flip+retry ~3 นาที — legacy ยังเสิร์ฟ 200 ตลอด (ดีกว่าที่ Skeptic กลัว: "cutover kills live site")
3. **manifest `../firmware` รอด base-path ฟรี** — เพราะ esp-web-tools resolve จาก manifest URL ไม่ใช่ page URL (Mechanic ชี้ไว้ = จุดเดียวที่รอดโดยไม่ต้องแก้)

## Lessons
- **flip Pages mode ต้องรอ provisioning** — อย่า panic กับ "try again later" ครั้งแรก รอ 90s re-run ก่อนคิด rollback
- **docs/ เป็น rollback ที่ดี** — เก็บไว้จน smoke ผ่านหมดค่อย git rm (Nothing is Deleted → ยังอยู่ใน history)
- **byte-identical check คือ contract ของ flasher** — firmware sha256 ต้องไม่ขยับ ไม่งั้นบอร์ด boot ไม่ขึ้น
- DNA divergence มีค่า: Minimalist ค้าน (deep-link 15 บรรทัดพอ) แต่ User lens ชนะ (ผู้เรียนต้อง YAML อ่าน/copy ได้ — ซึ่งเว็บเดิมไม่มีเลย)

## Skill promotion?
Cutover pattern (flip → run → wait-provision → smoke → rollback-ready) น่าจะเป็น skill `/pages-cutover` — reusable กับ repo อื่นที่ย้าย branch:/docs → Actions
