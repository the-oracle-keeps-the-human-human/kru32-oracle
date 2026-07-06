# Product

## Register

product

## Users

ผู้เริ่มต้น ESP32 (มือใหม่ถึงกลาง) ที่มีบอร์ดจอ **Guition JC3248W535** (ESP32-S3 + AXS15231B 320×480 QSPI + touch) อยู่ในมือ และอยากเห็นจอติดโดยไม่ต้องติดตั้ง toolchain ใด ๆ — เปิด Chrome/Edge บนคอมพิวเตอร์ เสียบ USB-C แล้ว flash บทเรียนได้เลย ภาษาหลักของผู้ใช้คือไทย (UI ผสมไทย/อังกฤษ ศัพท์เทคนิคคงเป็นอังกฤษ)

Job to be done: "เลือกบทเรียนที่ถูกระดับ → เห็น preview ว่าจะได้อะไร → flash ลงบอร์ดใน 30 วินาที"

## Product Purpose

Web flasher สำหรับคอร์ส **Kru32 — ESP32 × Display 16 บทเรียน** (kru = ครู, 32 = ESP32) กลั่นจาก 41.6 ชม. / 186 commits ของ esp32-oracle ทุก firmware compile ผ่านจริงเป็น `.factory.bin` สำเร็จ = คนแปลกหน้าเปิดลิงก์ GitHub Pages แล้ว flash บทแรกติดจอได้เองโดยไม่ถามใคร

Success: จำนวนคนที่ flash บท 01 สำเร็จแล้วไล่ต่อจนถึง Advanced

## Brand Personality

ครูใจดี · ตรงไปตรงมา · ผ่านสนามจริง — น้ำเสียงคือครูที่เคยเจอ trap มาแล้วทุกตัวและบอกทางลัดให้ ไม่ใช่ marketing landing ไม่ hype ทุกตัวเลขบนหน้าเว็บเป็นค่าจริง (ขนาดไฟล์, pin, ชั่วโมงที่ใช้)

## Anti-references

- Landing page SaaS ทั่วไป (hero ยักษ์, gradient text, metric โชว์) — นี่คือ tool ไม่ใช่ ad
- หน้า vendor จีนของบอร์ด (ตารางสเปคแน่นจนอ่านไม่ออก, ลิงก์ดาวน์โหลด rar)
- ความ "น่ากลัวแบบ engineer" — terminal dump, jargon ไม่อธิบาย — ผู้ใช้คือมือใหม่

Reference ที่ดี: หน้า install ของ ESPHome / WLED / Tasmota (esp-web-tools แบบเดียวกัน) แต่เพิ่ม device preview ที่พวกนั้นไม่มี

## Design Principles

1. **จอคือพระเอก** — device preview ของ JC3248W535 คือศูนย์กลางหน้า ปุ่ม Flash เกาะอยู่กับจอเสมอ (user กำหนดเอง)
2. **ลำดับบทเรียนคือ UI** — เรียงตามระดับ Basic → Advanced, บท 01 มี marker "เริ่มที่นี่" ชัดเจน ผู้ใช้ไม่ต้องเดาว่าเริ่มตรงไหน
3. **ความจริงเท่านั้น** — ขนาดไฟล์จริง, board spec จริง, คำเตือน browser จริง (WebSerial = Chrome/Edge desktop only) ไม่มี placeholder
4. **บอร์ดเดียวเท่านั้น** — JC3248W535 only ห้ามเพิ่มบอร์ดอื่น (user สั่งสองครั้ง)
5. **Stack ตายตัว** — React + Tailwind + TypeScript, build ด้วย bun เป็น static ไฟล์บน docs/ ห้าม inline vanilla JS (user สั่ง)

## Accessibility & Inclusion

- Dark UI (ตรงกับบริบท: โต๊ะทำงาน dev, เทียบจอ OLED ของบอร์ด) — ตัวหนังสือเล็กต้องผ่าน contrast ≥4.5:1
- `prefers-reduced-motion` ต้อง disable animation ใน preview
- ภาษาไทยเป็นหลัก ศัพท์เทคนิคอังกฤษ — ประโยคสั้น ไม่มี jargon ที่ไม่อธิบาย
- ข้อจำกัดจริงของ WebSerial ต้องแจ้งตรง ๆ ไม่ซ่อน (Safari/Firefox/มือถือใช้ไม่ได้)
