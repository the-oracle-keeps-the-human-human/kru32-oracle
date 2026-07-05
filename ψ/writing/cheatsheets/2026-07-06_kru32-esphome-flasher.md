# ESP32 Display Course + Web Flasher สูตรโกง

> ทุกคำสั่งที่ใช้จริงตั้งแต่ compile บทเรียนแรกยันเว็บ flasher ขึ้น GitHub Pages — จาก session เกิดของ kru32-oracle (2026-07-05 → 06)

---

## 🔧 ESPHome — compile บทเรียน

### Compile หนึ่งบท

```bash
cd lessons/01-basic
uvx esphome compile basic.yaml
```

รอบแรกช้า 3-5 นาที (โหลด toolchain) — รอบถัดไป ~40-90 วินาที

### หา firmware ที่ compile เสร็จ

```bash
# ตัวที่ใช้ flash ผ่านเว็บ = .factory.bin (รวม bootloader + partition)
find . -path "*/.pioenvs/*/firmware.factory.bin"
```

### เช็คแค่ผ่าน/ไม่ผ่าน

```bash
uvx esphome compile basic.yaml 2>&1 | grep -E "SUCCESS|FAILED|error:"
```

## 📺 JC3248W535 — ค่า pin จริงที่พิสูจน์แล้ว

```yaml
psram: { mode: octal, speed: 80MHz }

spi:
  - id: lcd_spi
    type: quad
    clk_pin: GPIO47
    data_pins: [GPIO21, GPIO48, GPIO40, GPIO39]

output:
  - platform: ledc
    pin: GPIO1          # backlight — 25kHz ไม่มีเสียงหวีด
    frequency: 25000Hz

i2c: { sda: GPIO4, scl: GPIO8, frequency: 400kHz }

touchscreen:
  - platform: axs15231
    interrupt_pin: GPIO3

display:
  - platform: mipi_spi
    model: AXS15231
    cs_pin: GPIO45
    dimensions: { width: 320, height: 480 }
    data_rate: 40MHz
    # สองบรรทัดนี้ = มอบจอให้ LVGL (ห้ามลืม!)
    update_interval: never
    auto_clear_enabled: false
```

## 🎞️ GIF Animation (บท 16)

```bash
# สร้าง GIF เอง 8 เฟรมด้วย Pillow
uv run --with pillow python3 make_gif.py
```

```yaml
animation:
  - file: "ball.gif"
    id: ball_anim
    type: RGB565

display:
  - platform: mipi_spi
    # update_interval คือตัวเดินเฟรม
    update_interval: 80ms
    lambda: |-
      id(ball_anim).next_frame();
      it.fill(Color::BLACK);
      it.image((320 - 96) / 2, (480 - 96) / 2, id(ball_anim));
```

## ⚛️ React + TS Flasher — build ด้วย bun

```bash
bun install
bun build src/webflasher/index.tsx --outfile docs/app.js --minify

# Tailwind CSS แยก (สำหรับ artifact ที่ CDN ใช้ไม่ได้)
bunx @tailwindcss/cli -i src/webflasher/input.css -o tw.css --minify
```

esp-web-tools ใน HTML shell:

```html
<script type="module" src="https://unpkg.com/esp-web-tools@10/dist/web/install-button.js?module"></script>
```

```html
<esp-web-install-button manifest="manifests/basic.json">
  <button slot="activate">⚡ Quick Flash</button>
</esp-web-install-button>
```

manifest ต่อบท:

```json
{
  "name": "Kru32 — 01 Hello Display",
  "version": "1.0.0",
  "new_install_prompt_erase": true,
  "builds": [
    {
      "chipFamily": "ESP32-S3",
      "parts": [{ "path": "../firmware/kru32-basic.bin", "offset": 0 }]
    }
  ]
}
```

## 🌐 GitHub Pages — deploy

```bash
# 1. repo ต้อง public ก่อน (free plan) — เจ้าของกดเอง
gh repo edit the-oracle-keeps-the-human-human/kru32-oracle \
  --visibility public --accept-visibility-change-consequences

# 2. สำคัญที่สุด: .nojekyll กัน Jekyll แขวนกับ binary
touch docs/.nojekyll && git add docs/.nojekyll && git commit -m "fix: nojekyll" && git push

# 3. เปิด Pages จาก main:/docs
gh api repos/the-oracle-keeps-the-human-human/kru32-oracle/pages \
  -X POST -f "source[branch]=main" -f "source[path]=/docs"

# 4. เช็ค build
gh api repos/the-oracle-keeps-the-human-human/kru32-oracle/pages/builds/latest -q .status

# 5. สั่ง rebuild (ถ้าค้าง)
gh api repos/the-oracle-keeps-the-human-human/kru32-oracle/pages/builds -X POST

# 6. เช็คว่าขึ้นจริง
curl -s -o /dev/null -w '%{http_code}' \
  https://the-oracle-keeps-the-human-human.github.io/kru32-oracle/
```

## ⚡ ลัด

| ทำอะไร | คำสั่ง |
|--------|--------|
| compile บท | `uvx esphome compile <บท>.yaml` |
| หา factory bin | `find . -path "*/.pioenvs/*/firmware.factory.bin"` |
| build flasher | `bun build src/webflasher/index.tsx --outfile docs/app.js --minify` |
| เปิด Pages | `gh api repos/<owner>/<repo>/pages -X POST -f "source[branch]=main" -f "source[path]=/docs"` |
| สถานะ build | `gh api repos/<owner>/<repo>/pages/builds/latest -q .status` |
| เว็บ flasher | https://the-oracle-keeps-the-human-human.github.io/kru32-oracle/ |

## ⚠️ trap ที่เจอจริง

| trap | วิธีเลี่ยง |
|------|-----------|
| Pages build แขวน >1 ชม. ("building" ไม่จบ) | Jekyll เคี้ยว firmware .bin ไม่ไหว — `touch docs/.nojekyll` แล้ว push |
| Pages บน private repo → HTTP 422 | free plan ต้อง public ก่อน — เจ้าของ repo กดเอง |
| font glyphs ซ้ำ → `Found duplicate glyph: e` | ตัวอักษรใน `glyphs:` ห้ามซ้ำ — "seconder" มี e สองตัว |
| LVGL ไม่มี widget `btn` | ใช้ `obj:` + `on_click:` แทน |
| `touch.x` ใช้ใน `on_release` ไม่ได้ (not declared) | เก็บพิกัดใส่ `globals` ตอน `on_touch` แล้วอ่านตอน release |
| dropdown `options: "a\nb"` → error | ใช้ YAML list: `options: [- "a", - "b"]` |
| esp-web-tools flash แล้วบอร์ดไม่ boot | ต้องใช้ `.factory.bin` (offset 0) ไม่ใช่ `firmware.bin` เปล่า |
| WebSerial ไม่ทำงาน | Chrome/Edge desktop เท่านั้น — Safari/Firefox/มือถือใช้ไม่ได้ |
| `node_modules/` หลุดเข้า git (163k บรรทัด) | ใส่ `.gitignore` ก่อน `git add -A` แล้วเช็ค `git diff --cached --stat` |
| สร้างไฟล์ด้วย relative path ไปโผล่ผิดที่ | cwd ของ Bash ค้างจาก command ก่อน — ใช้ absolute path เสมอ |
| duplicate `esphome:` key ใน yaml | `on_boot` ต้องรวมอยู่ใน `esphome:` block เดียว |
| pin ชนกัน (`Pin 45 used in multiple places`) | ลอก pin map จาก config ที่พิสูจน์บนฮาร์ดแวร์แล้วเท่านั้น |

---

🤖 ตอบโดย kru32-oracle จาก Nat → the-oracle-keeps-the-human-human/kru32-oracle
