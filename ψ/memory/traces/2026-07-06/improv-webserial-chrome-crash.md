# esp-web-tools + Improv → Chrome crash หลัง flash (verified research)

> 2026-07-06 · deep-research workflow (19 agents, 12 claims ยืนยัน) + crash log จริง 3 ครั้ง (Comet ×2, Chrome ×1)

## อาการ
flash เสร็จ → **ทั้ง browser crash** (ไม่ใช่แค่ tab) — `Chrome_IOThread` EXC_BREAKPOINT (SIGTRAP/brk 0)
ตอน `org.libusb.device-hotplug` / `UsbEventHandler` ทำงาน = USB re-enumerate
- เกิดทั้ง **Comet** (ai.perplexity.comet) และ **Google Chrome แท้** (com.google.Chrome 149) — engine เดียวกัน
- "ก่อนใส่ Improv ไม่ crash" = ผู้ใช้สังเกตถูก

## Root cause (2 บั๊กซ้อน)
1. **esp-web-tools ส่ง Improv "hello" เร็วไป** ระหว่างบอร์ดยัง reboot — maintainer diagnosis, JS timing bug (esphome/esp-web-tools#545)
2. **Chrome native Web Serial + USB bug บน macOS** — crash ทั้ง browser ตอน device re-enumerate; reproduce ได้บนหน้า demo ทางการเอง; native `USB_SERIAL_JTAG` upload+erase = crash 100%, UART bridge = crash น้อยกว่า (#608)
- คนละบั๊กกับ SerialSplitDtrAndRts regression (chromium 420689824, "fixed" 139 — แต่ #608 ยัง crash บน build นั้น)

## Fix (เรียงตามคุ้ม)
| fix | recompile? | ผล |
|---|---|---|
| **Edge แทน Chrome** | ไม่ | reporter Edge เสถียร 100% บนเครื่องที่ Chrome crash ← **user-facing ดีสุด** |
| manifest `"new_install_improv_wait_time": 0` | ไม่ (JSON ล้วน) | install-dialog.ts ข้ามสร้าง ImprovSerial client → ไม่ reconnect |
| **เอา `improv_serial:` ออกจาก YAML** | ใช่ | ไม่มี advertisement ให้ reconnect ← **ทำแล้ว (revert)** |
| self-host esp-web-tools bundle | ไม่ | ลด frequency (mitigation ไม่ใช่ fix) |
| UART bridge chip แทน USB_SERIAL_JTAG | ใช่ + ฮาร์ดแวร์ | native USB re-enum คือตัวหนัก |

## บทเรียน
- **ผมวินิจฉัยผิดตอนแรก** โทษ Comet อย่างเดียว → crash log Chrome แท้ พิสูจน์ว่าเป็น Chromium-core bug ต้องดู `Identifier:` ใน report ก่อนสรุป
- WiFi config ในเบราว์เซอร์ผ่าน serial Improv = ไม่ปลอดภัยกับ native-USB board + Chromium ตอนนี้
- ทางเลี่ยงที่อยากได้ WiFi config: **captive portal (AP)** — ไม่แตะ browser serial หลัง flash เลย
