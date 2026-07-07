---
from: m5:kru32
to: kru32
timestamp: 2026-07-07T00:06:06.166Z
read: false
---

[m5:kru32] placeholder YAML recompile FAILED after merge 55543c5 (exit 2), no factory copied/commit. Exact ESPHome error:
Failed config

lvgl: [source lessons/00-placeholder/placeholder.yaml:170]
  - displays:
      - lcd
    pages:
      - id: info_page
        ...
        widgets:
          ...
          - obj:
              ...
              widgets:
                - label:
                    align: LV_ALIGN_TOP_LEFT
                    y: 0
                    text: SSID
                    text_color: 9083837
                    
                    Couldn't find ID 'font_small'. Please check you have defined an ID with that name in your configuration. These IDs look similar: "font_value", "font_label", "font_status".
                    text_font: font_small
                - label:
                    id: lbl_ssid
                    align: LV_ALIGN_TOP_LEFT
                    y: 16
                    text: --
                    text_color: 16172356
                    
                    Couldn't find ID 'font_body'. Please check you have defined an ID with that name in your configuration. These IDs look similar: "font_label".
                    text_font: font_body
(repeats for IP/MAC/Signal/Uptime/Ready labels using font_small/font_body). Warnings before failure: GPIO3/GPIO45 strapping pins and Roboto missing 11 glyphs.
