# IMGX Camera Mirror — kru32 display-side reference

Mirror ภาพจากกล้อง **camera-poc-oracle** ขึ้นจอ **JC3248W535** (ESP32-S3, AXS15231B
320×480 QSPI) ผ่าน BLE — camera 📷 → BLE → จอ 🖼️ board-to-board

## Canonical อยู่ที่ camera-poc

ตัว **working + flashed จริง** คือของ camera-poc: `laris-co/camera-poc-oracle/for-display/`
(`display-demo.yaml` + `jpeg_fb.h`) — เขา flash ขึ้นบอร์ดสำเร็จ first try แล้ว (2026-07-15)

โฟลเดอร์นี้เป็น **kru32 reference variant** — เก็บไว้เป็นตัวอย่างฝั่ง display (เราคือ oracle
ของบอร์ดจอนี้) ไม่ใช่ตัว canonical ถ้าจะใช้งานจริงชี้ไปที่ `for-display/` ของ camera-poc

## ต่างจาก canonical ยังไง

| | camera-poc (canonical) | kru32 variant (อันนี้) |
|---|---|---|
| decode | JPEGDEC `JPEG_SCALE_HALF` → 320×240 | JPEGDEC 1:1 |
| scale | letterbox 320×240 กลางจอ + double-buffer | subsample แนวนอน 640→320, แนวตั้งคงเดิม 480 |
| ผลบนจอ | ภาพครึ่งจอ นิ่ง มี text overlay | เต็มจอ 320×480 (H:V ไม่ uniform) |
| flush | double-buffer + `id(lcd).update()` | `update_interval: never` + `update()` ตอนได้เฟรม |

ทั้งคู่ reuse panel init จาก **lesson-16** (mipi_spi model AXS15231, QSPI clk47
data[21,48,40,39] cs45, backlight GPIO1) เหมือนกัน

## สถานะ

- ✅ **compile-verified** (esp-idf, ESPHome 2026.7.1) — RAM 36.8%, Flash 9.6%
- ⏳ ยังไม่ flash/live-test ฝั่งนี้ (canonical ของ camera-poc พิสูจน์ pipeline แล้ว)

## Build

```bash
uvx esphome compile imgx-camera.yaml
uvx esphome run imgx-camera.yaml --device /dev/cu.usbmodem211401   # flash + monitor
```

`components/imgx_ble_requester/` = vendor copy จาก camera-poc (BLE central + IMGX state
machine) · `components/camera_mirror/` = glue ฝั่ง kru32 (decode + subsample + draw)

## กับดักที่ carry มาจาก lesson-16

- **AXS15231B = QSPI panel** — init ด้วย mipi_spi model AXS15231 (SPI ธรรมดา = จอดำ/รก)
- **`new_install_prompt_erase: false`** ใน manifest เสมอ — กัน Chromium/WebSerial crash บน
  ESP32-S3 native USB
- **PSRAM ต้องเปิด** (`psram:`) — imgx_ble_requester จอง reassembly buffer 256KB ใน SPIRAM
