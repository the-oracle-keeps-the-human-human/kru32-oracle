import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import display
from esphome.const import CONF_ID

# camera_mirror — glue ระหว่าง imgx_ble_requester (ส่ง JPEG มาทาง on_image)
#   กับจอ AXS15231B (ESPHome display) : decode JPEG -> subsample 640x480->320x480 -> draw
# ไม่ยุ่งกับ BLE/IMGX เลย — รับ JPEG ก้อนเดียวจบ (camera_poc component จัดการ transport)
CODEOWNERS = ["@the-oracle-keeps-the-human-human"]
DEPENDENCIES = ["display"]

CONF_DISPLAY_ID = "display_id"

camera_mirror_ns = cg.esphome_ns.namespace("camera_mirror")
CameraMirror = camera_mirror_ns.class_("CameraMirror", cg.Component)

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(): cv.declare_id(CameraMirror),
        # จอปลายทางที่จะวาดภาพลง (mipi_spi AXS15231 จาก lesson-16)
        cv.Required(CONF_DISPLAY_ID): cv.use_id(display.Display),
    }
).extend(cv.COMPONENT_SCHEMA)


async def to_code(config):
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
    disp = await cg.get_variable(config[CONF_DISPLAY_ID])
    cg.add(var.set_display(disp))
    # JPEGDEC — decoder เดียวกับที่ camera-poc reference ใช้ (Arduino-compatible, header C++)
    cg.add_library("bitbank2/JPEGDEC", "1.6.2")
