#pragma once
#include "esphome/core/component.h"
#include "esphome/components/display/display.h"
#include <JPEGDEC.h>

namespace esphome {
namespace camera_mirror {

// CameraMirror — รับ JPEG จาก imgx_ble_requester.on_image แล้ววาดลงจอ
//   source กล้อง = 640x480 · จอ = 320x480 (AXS15231B QSPI)
//   scale = subsample แนวนอน 2:1 (640->320) · แนวตั้งคงเดิม (480->480)
//   วาดผ่าน display->draw_pixel_at() แล้ว flush ด้วย display->update()
class CameraMirror : public Component {
 public:
  void set_display(display::Display *disp) { this->disp_ = disp; }
  void setup() override;
  float get_setup_priority() const override { return setup_priority::LATE; }

  // เรียกจาก on_image lambda — data/len ใช้ได้เฉพาะช่วง call นี้ (decode ให้เสร็จในนี้)
  void decode_and_draw(const uint8_t *data, size_t len);

 protected:
  // callback ของ JPEGDEC ต่อ block ที่ decode ออกมา (RGB565) — วาดลงจอพร้อม subsample
  static int draw_cb(JPEGDRAW *p);

  display::Display *disp_{nullptr};
  JPEGDEC jpeg_;
};

}  // namespace camera_mirror
}  // namespace esphome
