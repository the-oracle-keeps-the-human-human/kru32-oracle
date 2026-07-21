#include "camera_mirror.h"
#include "esphome/core/log.h"

namespace esphome {
namespace camera_mirror {

static const char *const TAG = "camera_mirror";

// จอปลายทาง — subsample แนวนอน 2:1 (กล้อง 640 -> จอ 320) · แนวตั้งคงเดิม
static const int PANEL_W = 320;
static const int PANEL_H = 480;

void CameraMirror::setup() {
  if (this->disp_ == nullptr) {
    ESP_LOGE(TAG, "no display bound — mark_failed");
    this->mark_failed();
    return;
  }
  ESP_LOGI(TAG, "camera_mirror ready — panel %dx%d, subsample 2:1 H", PANEL_W, PANEL_H);
}

// JPEGDEC เรียก callback นี้ทีละ block (MCU-aligned) · p->pPixels = RGB565 block
//   ที่ (p->x, p->y) ขนาด p->iWidth x p->iHeight — วาดลงจอโดยเอาเฉพาะคอลัมน์คู่ (subsample)
int CameraMirror::draw_cb(JPEGDRAW *p) {
  auto *self = static_cast<CameraMirror *>(p->pUser);
  auto *disp = self->disp_;
  const uint16_t *px = p->pPixels;
  for (int row = 0; row < p->iHeight; row++) {
    const int sy = p->y + row;
    if (sy < 0 || sy >= PANEL_H) continue;  // แนวตั้งคงเดิม 480->480
    for (int col = 0; col < p->iWidth; col++) {
      const int sx = p->x + col;
      if (sx & 1) continue;         // subsample: เอาเฉพาะคอลัมน์คู่ 640->320
      const int dx = sx >> 1;
      if (dx >= PANEL_W) continue;
      const uint16_t c = px[row * p->iWidth + col];  // RGB565
      const uint8_t r = (c >> 11) & 0x1F;
      const uint8_t g = (c >> 5) & 0x3F;
      const uint8_t b = c & 0x1F;
      disp->draw_pixel_at(dx, sy, Color((r << 3), (g << 2), (b << 3)));
    }
  }
  return 1;  // 1 = decode ต่อ
}

void CameraMirror::decode_and_draw(const uint8_t *data, size_t len) {
  if (this->disp_ == nullptr) return;
  ESP_LOGD(TAG, "decode JPEG %u bytes", (unsigned) len);
  // openRAM คืน 1 = ok · JPEGDEC อ่านจาก data ตรง ๆ (ไม่ copy)
  if (this->jpeg_.openRAM((uint8_t *) data, (int) len, draw_cb) == 0) {
    ESP_LOGW(TAG, "JPEG open failed");
    return;
  }
  this->jpeg_.setUserPointer(this);
  this->jpeg_.setPixelType(RGB565_BIG_ENDIAN);  // ให้ตรง byte order กับ draw_pixel_at
  const int ok = this->jpeg_.decode(0, 0, 0);   // scale 0 = 1:1 · subsample ทำเองใน cb
  this->jpeg_.close();
  if (ok != 1) {
    ESP_LOGW(TAG, "JPEG decode error %d", this->jpeg_.getLastError());
    return;
  }
  this->disp_->update();  // flush framebuffer -> QSPI panel
}

}  // namespace camera_mirror
}  // namespace esphome
